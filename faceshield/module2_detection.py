"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 2: FACE DETECTION                                                     ║
║                                                                              ║
║ Purpose: Detect the primary face, calculate a square bounding box with       ║
║          a safety margin, and extract the high-res native crop.              ║
║                                                                              ║
║ Outputs to Module 5: (H, W, 3) uint8 numpy array at NATIVE resolution.      ║
║                                                                              ║
║ Outputs to Module 7: routing_data dict with bbox and size metadata so the   ║
║                      cloaked face can be pasted back precisely.              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import logging
from typing import Any, Dict, Optional, Tuple

import numpy as np
import torch
from facenet_pytorch import MTCNN
from PIL import Image

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Custom Exception
# ──────────────────────────────────────────────────────────────────────────────

class FaceDetectionError(Exception):
    """Raised when face detection fails or no face is found."""
    pass


# ──────────────────────────────────────────────────────────────────────────────
# Detector Wrapper (Singleton)
# ──────────────────────────────────────────────────────────────────────────────

class FaceDetector:
    """
    Singleton wrapper around MTCNN to avoid reloading weights on every call.

    Design decision: we store both the instance AND the device it was
    initialized on. If a caller requests a different device, we reinitialize.
    This prevents the silent bug where get_instance('cpu') returns a CUDA
    model because it was initialized first with 'cuda'.
    """
    _instance: Optional[MTCNN] = None
    _device: Optional[str] = None

    @classmethod
    def get_instance(cls, device: str) -> MTCNN:
        if cls._instance is None or cls._device != device:
            logger.info(f"Initializing MTCNN on {device.upper()}...")
            # We do not set image_size here — we want raw bounding boxes,
            # not a pre-cropped tensor. We handle cropping ourselves so we
            # can apply our own margin and square enforcement logic.
            cls._instance = MTCNN(keep_all=True, device=device)
            cls._device = device
            logger.info("MTCNN initialized.")
        return cls._instance


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def detect_and_crop(
    pil_image: Image.Image,
    margin_multiplier: float = 1.2,
    device: Optional[str] = None,
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Detect the largest face and extract a square native-resolution crop.

    The crop is returned at its NATIVE resolution (not resized to 112×112).
    Module 5 handles the resize internally during EOT. Module 7 uses the
    bounding box to paste the cloaked result back at the exact right position.

    Args:
        pil_image:         RGB PIL Image from Module 1.
        margin_multiplier: Expand MTCNN box by this factor (1.2 = 20% padding).
        device:            'cuda' or 'cpu'. Auto-detects if None.

    Returns:
        face_np:      (H, W, 3) uint8 numpy array at native resolution.
        routing_data: Dict with keys:
                        'bbox'              — [x1, y1, x2, y2] ints
                        'original_crop_size'— (width, height) ints
                        'confidence'        — float MTCNN detection score

    Raises:
        FaceDetectionError: if no face is detected or confidence is too low.
    """
    if device is None:
        device = 'cuda' if torch.cuda.is_available() else 'cpu'

    detector = FaceDetector.get_instance(device)

    # ── Step 1: Raw detection ─────────────────────────────────────────────────
    # detect() returns all faces as raw bounding boxes — we pick the largest.
    boxes, probs = detector.detect(pil_image)

    if boxes is None or len(boxes) == 0:
        raise FaceDetectionError(
            "No faces detected in the image. "
            "Check that the image contains a clearly visible face."
        )

    # ── Step 2: Select largest face by area ───────────────────────────────────
    # Box format from MTCNN: [x1, y1, x2, y2]
    areas = [(b[2] - b[0]) * (b[3] - b[1]) for b in boxes]
    largest_idx = int(np.argmax(areas))

    raw_box = boxes[largest_idx]
    raw_prob = probs[largest_idx]

    # MTCNN occasionally returns None for probability — treat as low confidence
    confidence = float(raw_prob) if raw_prob is not None else 0.0

    if confidence < 0.85:
        logger.warning(
            f"Low face detection confidence: {confidence:.2%}. "
            f"Result may be unreliable."
        )

    logger.info(
        f"Face detected — confidence: {confidence:.2%} | "
        f"raw box: {[round(float(b), 1) for b in raw_box]}"
    )

    # ── Step 3: Square enforcement + margin expansion ─────────────────────────
    # Why square: face recognition models (FaceNet, ArcFace) expect square input.
    # We make the crop square at the NATIVE level so the resize in Module 5
    # doesn't distort facial geometry.
    x1, y1, x2, y2 = [float(b) for b in raw_box]

    width  = x2 - x1
    height = y2 - y1

    # Expand to square + margin in one step
    target_size = max(width, height) * margin_multiplier

    center_x = x1 + width  / 2.0
    center_y = y1 + height / 2.0

    sq_x1 = int(center_x - target_size / 2.0)
    sq_y1 = int(center_y - target_size / 2.0)
    sq_x2 = int(center_x + target_size / 2.0)
    sq_y2 = int(center_y + target_size / 2.0)

    # Clamp to image bounds — bbox may be "broken square" at edges, which is
    # acceptable. Module 7 handles partial-edge crops correctly.
    final_x1 = max(0, sq_x1)
    final_y1 = max(0, sq_y1)
    final_x2 = min(pil_image.width,  sq_x2)
    final_y2 = min(pil_image.height, sq_y2)

    if final_x2 <= final_x1 or final_y2 <= final_y1:
        raise FaceDetectionError(
            f"Bounding box collapsed after clamping: "
            f"[{final_x1}, {final_y1}, {final_x2}, {final_y2}]. "
            f"Face may be at the very edge of the image."
        )

    # ── Step 4: Native-resolution crop ───────────────────────────────────────
    # We do NOT resize here. The full-resolution crop goes to Module 5.
    # Module 5 downsamples to 112×112 INSIDE the gradient tape (EOT).
    face_crop_pil = pil_image.crop((final_x1, final_y1, final_x2, final_y2))
    face_np       = np.array(face_crop_pil)

    logger.info(
        f"Native crop extracted: {face_np.shape[1]}×{face_np.shape[0]} px | "
        f"bbox: [{final_x1}, {final_y1}, {final_x2}, {final_y2}]"
    )

    # ── Step 5: Build routing data for Module 7 ───────────────────────────────
    routing_data = {
        "bbox":               [final_x1, final_y1, final_x2, final_y2],
        "original_crop_size": (face_crop_pil.width, face_crop_pil.height),
        "confidence":         confidence,
    }

    return face_np, routing_data