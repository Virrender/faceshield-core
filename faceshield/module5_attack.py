"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 5: EOT ATTACK ENGINE                                                  ║
║                                                                              ║
║ Purpose: Generate adversarial noise that survives image downsampling         ║
║          while remaining visually imperceptible.                             ║
║                                                                              ║
║ Mechanics:                                                                   ║
║   1. Tanh-space optimization — pixel values stay in [0, 255] implicitly.    ║
║   2. Hard L∞ epsilon clamp — hard ceiling on per-pixel change from step 1.  ║
║   3. SSIM loss active from step 1 — never allows unconstrained explosion.   ║
║   4. EOT downsampling inside gradient tape — noise survives resize.         ║
║                                                                              ║
║ WHY THE OLD CODE PRODUCED RAINBOW NOISE:                                    ║
║   alpha_ssim started at 0.0. With lr=0.5, Adam moved pixels hundreds of    ║
║   units with zero visual constraint. By step ~20 the perturbation was at    ║
║   maximum magnitude. SSIM could never pull it back afterward.               ║
║                                                                              ║
║   Fix: SSIM weight active from step 1 + hard L∞ clamp after every step.    ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import logging

import numpy as np
import torch
import torch.nn.functional as F
from pytorch_msssim import ms_ssim, ssim

logger = logging.getLogger(__name__)


def run_attack(
    high_res_face_np:    np.ndarray,
    target_embedding_np: np.ndarray,
    backend,
    device:       str   = 'cpu',
    steps:        int   = 200,
    lr:           float = 0.08,
    epsilon:      float = 0.02,
    ssim_weight:  float = 4000.0,
    feat_weight:  float = 1000.0,
) -> np.ndarray:
    """
    Run the EOT adversarial attack on a native-resolution face crop.

    Args:
        high_res_face_np:    (H, W, 3) uint8 numpy array from Module 2.
        target_embedding_np: (N,) float32 numpy array from Module 4.
        backend:             FaceRecognitionBackend instance from Module 3.
        device:              'cuda' or 'cpu'.
        steps:               Optimization iterations.
                               40  = fast mode
                               150 = balanced mode (default)
                               300 = strong mode
        lr:                  Adam learning rate. Keep between 0.05 and 0.1.
                             DO NOT increase past 0.1 — causes visible noise.
        epsilon:             Max per-pixel change as fraction of 255.
                             0.05 = max 12.75 pixel units per channel.
                             This is the primary visual quality guard.
        ssim_weight:         SSIM penalty weight. NEVER set to 0.
        feat_weight:         Feature distance loss weight.

    Returns:
        (H, W, 3) uint8 numpy array — cloaked face at native resolution.
    """
    logger.info(
        f"Starting EOT Attack on {device.upper()} — "
        f"{steps} steps | lr={lr} | epsilon={epsilon}"
    )

    # ── Setup ─────────────────────────────────────────────────────────────────
    face_tensor = (
        torch.from_numpy(high_res_face_np)
        .permute(2, 0, 1)
        .unsqueeze(0)
        .float()
        .to(device)
    )
    target_tensor = (
        torch.from_numpy(target_embedding_np)
        .unsqueeze(0)
        .float()
        .to(device)
    )

    face_norm = face_tensor / 255.0  # [0, 1] reference — never modified

    # ── Tanh-space init ───────────────────────────────────────────────────────
    eps_tanh    = 1e-6
    face_scaled = torch.clamp(face_norm * 2.0 - 1.0, -1.0 + eps_tanh, 1.0 - eps_tanh)
    w           = torch.atanh(face_scaled).detach().requires_grad_(True)

    optimizer = torch.optim.Adam([w], lr=lr)

    # ── SSIM mode ─────────────────────────────────────────────────────────────
    # MS-SSIM requires spatial dims >= 160. Fall back to single-scale SSIM.
    use_msssim = min(face_tensor.shape[2], face_tensor.shape[3]) >= 160
    if not use_msssim:
        logger.warning(
            "Face crop < 160px — using single-scale SSIM. "
            "For best visual quality use an input image where the face is large."
        )

    # ── Optimization loop ─────────────────────────────────────────────────────
    for step in range(steps):
        optimizer.zero_grad()

        # Reconstruct [0, 1] image from tanh-space
        adv_norm   = (torch.tanh(w) + 1.0) / 2.0
        adv_tensor = adv_norm * 255.0

        # EOT: downsample to 112×112 INSIDE gradient tape.
        # Gradients flow back through F.interpolate into high-res pixels.
        # This is what makes the noise survive when the image is resized.
        adv_112 = F.interpolate(
            adv_tensor,
            size=(112, 112),
            mode='bilinear',
            align_corners=False,
            antialias=True,
        )

        # Feature distance loss
        adv_emb   = backend.forward(adv_112)
        adv_emb_n = F.normalize(adv_emb,        p=2, dim=1)
        target_n  = F.normalize(target_tensor,  p=2, dim=1)
        feat_dist = torch.sum((adv_emb_n - target_n) ** 2)

        # SSIM loss — ACTIVE FROM STEP 1, never disabled
        if use_msssim:
            sim_score = ms_ssim(adv_norm, face_norm, data_range=1.0, size_average=True)
        else:
            sim_score = ssim(adv_norm, face_norm, data_range=1.0, size_average=True)
        ssim_loss = 1.0 - sim_score

        loss = (feat_dist * feat_weight) + (ssim_loss * ssim_weight)
        loss.backward()
        optimizer.step()

        # ── Hard L∞ epsilon clamp (CRITICAL) ──────────────────────────────────
        # After every optimizer step, enforce the epsilon budget.
        # This prevents any pixel from moving more than epsilon*255 units
        # from the original, regardless of what Adam wants to do.
        # Without this clamp, Adam can push pixels to extremes before
        # SSIM has time to pull them back.
        with torch.no_grad():
            adv_clamped = (torch.tanh(w) + 1.0) / 2.0
            delta       = torch.clamp(adv_clamped - face_norm, -epsilon, epsilon)
            adv_fixed   = torch.clamp(face_norm + delta, eps_tanh, 1.0 - eps_tanh)
            adv_fixed_s = torch.clamp(adv_fixed * 2.0 - 1.0, -1.0 + eps_tanh, 1.0 - eps_tanh)
            w.data      = torch.atanh(adv_fixed_s)

        if step == 0 or (step + 1) % 25 == 0:
            logger.info(
                f"Step {step+1:03d}/{steps} | "
                f"FeatDist: {feat_dist.item():.4f} | "
                f"SSIM: {sim_score.item():.4f} | "
                f"Loss: {loss.item():.2f}"
            )

    # ── Finalize ──────────────────────────────────────────────────────────────
    with torch.no_grad():
        final_norm = (torch.tanh(w) + 1.0) / 2.0
        final_np   = final_norm.squeeze(0).permute(1, 2, 0).cpu().numpy()
        final_np   = np.clip(final_np * 255.0, 0, 255).astype(np.uint8)

    logger.info("Attack complete.")
    return final_np