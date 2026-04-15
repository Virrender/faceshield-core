"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 7: RECONSTRUCTION                                                     ║
║                                                                              ║
║ Purpose: Paste the optimized face crop back into the master image with       ║
║          Gaussian feather blending at the edges.                             ║
║                                                                              ║
║ WHY THE OLD CODE SHOWED A VISIBLE BOX:                                      ║
║   Hard pixel replacement result_np[y1:y2, x1:x2] = cloaked_slice creates   ║
║   a sharp rectangular seam at every edge. No blending at all.               ║
║                                                                              ║
║   Fix: Build a Gaussian feather mask that is white (1.0) in the center      ║
║   and fades to black (0.0) at the edges. Alpha-blend using this mask.       ║
║   The center of the face gets full adversarial noise. The edges blend       ║
║   smoothly back to the original pixels. No visible seam.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import logging

import numpy as np
from PIL import Image, ImageFilter

logger = logging.getLogger(__name__)


def _build_feather_mask(width: int, height: int, feather_fraction: float = 0.12) -> np.ndarray:
    """
    Build a 2D Gaussian feather mask of shape (height, width).

    The mask is 1.0 in the center and fades smoothly to 0.0 at edges.
    When used as an alpha blend weight, this eliminates the rectangular seam.

    Args:
        width:            Mask width in pixels.
        height:           Mask height in pixels.
        feather_fraction: What fraction of width/height is the fade zone.
                          0.12 = 12% fade at each edge. Increase for wider blending.

    Returns:
        (height, width) float32 numpy array with values in [0, 1].
    """
    # Build 1D ramps for X and Y independently, then multiply
    # This gives a smooth 2D falloff toward all four edges.
    feather_x = int(width  * feather_fraction)
    feather_y = int(height * feather_fraction)

    # Ensure minimum feather of 1px to avoid zero-size operations
    feather_x = max(feather_x, 1)
    feather_y = max(feather_y, 1)

    mask_x = np.ones(width,  dtype=np.float32)
    mask_y = np.ones(height, dtype=np.float32)

    # Left and right ramps
    ramp_x = np.linspace(0.0, 1.0, feather_x, dtype=np.float32)
    mask_x[:feather_x]  = ramp_x
    mask_x[-feather_x:] = ramp_x[::-1]

    # Top and bottom ramps
    ramp_y = np.linspace(0.0, 1.0, feather_y, dtype=np.float32)
    mask_y[:feather_y]  = ramp_y
    mask_y[-feather_y:] = ramp_y[::-1]

    # 2D mask = outer product of 1D ramps
    mask_2d = np.outer(mask_y, mask_x)

    # Apply a light Gaussian blur to soften the ramp boundaries
    # PIL GaussianBlur operates on uint8 — convert, blur, convert back
    mask_pil = Image.fromarray((mask_2d * 255).astype(np.uint8))
    mask_pil = mask_pil.filter(ImageFilter.GaussianBlur(radius=max(feather_x, feather_y) // 3))
    mask_2d  = np.array(mask_pil).astype(np.float32) / 255.0

    return mask_2d


def reconstruct_image(
    original_pil:       Image.Image,
    cloaked_high_res_np: np.ndarray,
    routing_data:       dict,
    feather_fraction:   float = 0.12,
) -> Image.Image:
    """
    Blend the cloaked face back into the master image with feathered edges.

    Args:
        original_pil:        Full original image from Module 1.
        cloaked_high_res_np: (H, W, 3) uint8 cloaked face crop from Module 5.
        routing_data:        Dict from Module 2 with 'bbox' key.
        feather_fraction:    Edge fade width as fraction of crop size.
                             0.12 is a good default. Increase for wider blend.

    Returns:
        PIL.Image with cloaked face blended back in. Same size as original.
    """
    x1, y1, x2, y2 = routing_data["bbox"]

    result_np   = np.array(original_pil).astype(np.float32)
    original_np = result_np.copy()

    # Crop dimensions (may be smaller than cloaked_high_res_np if bbox was clamped)
    crop_h = y2 - y1
    crop_w = x2 - x1

    # Slice cloaked array to exact crop size
    cloaked_slice = cloaked_high_res_np[0:crop_h, 0:crop_w].astype(np.float32)

    # Build feather mask (H, W) → expand to (H, W, 1) for broadcasting over RGB
    mask = _build_feather_mask(crop_w, crop_h, feather_fraction)
    mask = mask[:, :, np.newaxis]   # (H, W, 1) — broadcasts over 3 channels

    # Alpha blend: blended = mask * cloaked + (1 - mask) * original
    # At center (mask≈1.0): full cloaked pixels
    # At edges  (mask≈0.0): original pixels — no seam
    blended = mask * cloaked_slice + (1.0 - mask) * original_np[y1:y2, x1:x2]

    result_np[y1:y2, x1:x2] = blended

    result_np = np.clip(result_np, 0, 255).astype(np.uint8)

    logger.info(
        f"Reconstruction complete — bbox [{x1},{y1},{x2},{y2}] | "
        f"feather fraction: {feather_fraction}"
    )

    return Image.fromarray(result_np)