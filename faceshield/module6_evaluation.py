"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 6: EVALUATION                                                         ║
║                                                                              ║
║ Purpose: Quantify attack success (identity shift) and visual quality         ║
║          (how similar the cloaked image looks to the original).              ║
║                                                                              ║
║ Metrics:                                                                     ║
║   Cosine Similarity — identity match score. Lower = better cloaking.        ║
║   SSIM              — structural similarity. Higher = less visible noise.    ║
║   PSNR              — peak signal-to-noise ratio. Higher = less distortion. ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import logging

import numpy as np
from PIL import Image
from skimage.metrics import peak_signal_noise_ratio, structural_similarity

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Recognition thresholds per model
# ──────────────────────────────────────────────────────────────────────────────

# Cosine similarity threshold: above this value → same person.
# Below this value → different person → cloaking worked.
# These are empirically established values from published benchmarks.
THRESHOLDS = {
    'facenet': 0.60,   # FaceNet VGGFace2, standard LFW threshold
    'arcface': 0.30,   # ArcFace ResNet50, standard IJB-C threshold
    'adaface': 0.30,   # AdaFace IR-50, same ballpark as ArcFace
}

DEFAULT_THRESHOLD = 0.50  # Conservative fallback for unknown backends


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def evaluate(
    orig_high_res_np:   np.ndarray,
    cloaked_high_res_np: np.ndarray,
    backend,
    backend_name: str = 'facenet',
) -> dict:
    """
    Evaluate the attack on both visual quality and identity protection.

    Args:
        orig_high_res_np:    (H, W, 3) uint8 numpy array — original face crop.
        cloaked_high_res_np: (H, W, 3) uint8 numpy array — cloaked face crop.
        backend:             FaceRecognitionBackend instance from Module 3.
        backend_name:        Which backend — used to select the right threshold.
                             One of 'facenet', 'arcface', 'adaface'.

    Returns:
        dict with keys:
            'cosine_similarity' — float in [-1, 1]. Goal: < threshold.
            'ssim'              — float in [0, 1]. Goal: > 0.90.
            'psnr'              — float in dB. Goal: > 30dB.
            'threshold'         — float. The threshold used for verdict.
            'verdict'           — 'Protected' or 'Not Protected'.

    Notes on data_range:
        Both SSIM and PSNR require knowing the possible pixel value range.
        Our inputs are uint8 [0, 255] so data_range=255 is always correct here.
        Not specifying this explicitly causes skimage to infer from the DATA
        (min/max of actual pixel values) rather than the TYPE, which gives
        wrong results for images that don't use the full range.
    """
    # ── Visual metrics ────────────────────────────────────────────────────────
    ssim_val = structural_similarity(
        orig_high_res_np,
        cloaked_high_res_np,
        channel_axis=2,
        data_range=255,     # explicit — do not rely on skimage inference
    )
    psnr_val = peak_signal_noise_ratio(
        orig_high_res_np,
        cloaked_high_res_np,
        data_range=255,     # explicit — same reason
    )

    # ── Identity metric ───────────────────────────────────────────────────────
    # Resize to 112×112 before embedding — this matches real-world usage where
    # a face recognition API receives a cropped, standardized face image.
    # Using LANCZOS (high quality) to match what a real pipeline would do.
    orig_pil_112  = Image.fromarray(orig_high_res_np).resize(
        (112, 112), Image.Resampling.LANCZOS
    )
    cloak_pil_112 = Image.fromarray(cloaked_high_res_np).resize(
        (112, 112), Image.Resampling.LANCZOS
    )

    orig_emb  = backend.get_embedding(np.array(orig_pil_112))
    cloak_emb = backend.get_embedding(np.array(cloak_pil_112))

    # Cosine similarity — handles non-normalized embeddings correctly
    norm_orig  = np.linalg.norm(orig_emb)
    norm_cloak = np.linalg.norm(cloak_emb)

    if norm_orig == 0 or norm_cloak == 0:
        logger.warning("Zero-norm embedding detected — cosine similarity set to 0.")
        cos_sim = 0.0
    else:
        cos_sim = float(np.dot(orig_emb, cloak_emb) / (norm_orig * norm_cloak))

    # ── Verdict ───────────────────────────────────────────────────────────────
    threshold = THRESHOLDS.get(backend_name.lower(), DEFAULT_THRESHOLD)
    verdict   = "Protected" if cos_sim < threshold else "Not Protected"

    logger.info(
        f"Evaluation — cos_sim: {cos_sim:.4f} | "
        f"threshold: {threshold} | "
        f"SSIM: {ssim_val:.4f} | "
        f"PSNR: {psnr_val:.2f}dB | "
        f"Verdict: {verdict}"
    )

    return {
        "cosine_similarity": cos_sim,
        "ssim":              ssim_val,
        "psnr":              psnr_val,
        "threshold":         threshold,
        "verdict":           verdict,
    }