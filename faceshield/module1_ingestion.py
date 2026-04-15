"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 1: IMAGE INGESTION (PHASE 1 SECURE)                                   ║
║                                                                              ║
║ Purpose: Load any image, apply EXIF rotation, convert to RGB, and globally   ║
║          downscale massive 4K photos to VRAM-safe dimensions.                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import io
import logging
import os
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPPORTED_FORMATS = {'JPEG', 'PNG'}
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
EXIF_ORIENTATION_TAG = 274

class ImageIngestionError(Exception):
    pass

class ImageMetadata:
    def __init__(self, width: int, height: int, format: str, has_exif: bool, exif_orientation: int):
        self.width = width
        self.height = height
        self.format = format
        self.has_exif = has_exif
        self.exif_orientation = exif_orientation

def _get_exif_orientation(image: Image.Image) -> Tuple[int, bool]:
    try:
        exif_data = image.getexif()
        if exif_data:
            orientation = exif_data.get(EXIF_ORIENTATION_TAG, 1)
            return int(orientation), True
    except Exception:
        pass
    return 1, False

def _apply_exif_rotation(image: Image.Image, orientation: int) -> Image.Image:
    TRANSFORMS = {
        2: Image.Transpose.FLIP_LEFT_RIGHT, 3: Image.Transpose.ROTATE_180,
        4: Image.Transpose.FLIP_TOP_BOTTOM, 5: Image.Transpose.TRANSPOSE,
        6: Image.Transpose.ROTATE_270, 7: Image.Transpose.TRANSVERSE,
        8: Image.Transpose.ROTATE_90,
    }
    if orientation in TRANSFORMS:
        return image.transpose(TRANSFORMS[orientation])
    return image

def _convert_to_rgb(image: Image.Image) -> Image.Image:
    if image.mode == 'RGB':
        return image
    if image.mode == 'RGBA':
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        return background
    if image.mode == 'P':
        rgba = image.convert('RGBA')
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[3])
        return background
    if image.mode in ('L', 'LA'):
        return image.convert('RGB')
    return image.convert('RGB')

def _enforce_max_resolution(image: Image.Image, max_res: int = 1920) -> Image.Image:
    """
    CRITICAL ARCHITECTURE FIX: Downscale the master image globally to prevent 
    VRAM exhaustion in Module 5, while preventing resolution mismatch in Module 7.
    """
    if max(image.width, image.height) > max_res:
        logger.info(f"Image exceeds {max_res}px. Downscaling to fit safely in VRAM.")
        # thumbnail modifies in-place and preserves aspect ratio mathematically
        image.thumbnail((max_res, max_res), Image.Resampling.LANCZOS)
    return image

def _validate_image(image: Image.Image, source_label: str = "") -> None:
    if image.width <= 0 or image.height <= 0:
        raise ImageIngestionError(f"Image has invalid dimensions {image.size}. Source: {source_label}")
    try:
        image.load()
    except Exception as e:
        raise ImageIngestionError(f"Image data failed to decode: {e}. Source: {source_label}")

def ingest_image(image_path: str, max_res: int = 1920) -> Tuple[Image.Image, ImageMetadata]:
    """
    Main entry point. Loads image, fixes EXIF, forces RGB, clamps resolution.
    """
    image_path = str(image_path)
    if not os.path.exists(image_path): raise ImageIngestionError(f"File not found: {image_path}")
    if not os.path.isfile(image_path): raise ImageIngestionError(f"Path is not a file: {image_path}")

    try: image = Image.open(image_path)
    except Exception as e: raise ImageIngestionError(f"PIL failed to open image: {e}")

    file_format = image.format or "UNKNOWN"
    if file_format not in SUPPORTED_FORMATS:
        raise ImageIngestionError(f"Unsupported format '{file_format}'. Only {SUPPORTED_FORMATS} allowed.")

    exif_orientation, has_exif = _get_exif_orientation(image)
    image = _apply_exif_rotation(image, exif_orientation)
    image = _convert_to_rgb(image)
    
    # Apply the VRAM safety valve here
    image = _enforce_max_resolution(image, max_res)
    _validate_image(image, source_label=image_path)

    metadata = ImageMetadata(image.width, image.height, file_format, has_exif, exif_orientation)
    return image, metadata

def ingest_image_from_bytes(image_bytes: bytes, filename: str = "unknown", max_res: int = 1920) -> Tuple[Image.Image, ImageMetadata]:
    if not image_bytes: raise ImageIngestionError(f"Empty bytes provided ({filename})")
    try: image = Image.open(io.BytesIO(image_bytes))
    except Exception as e: raise ImageIngestionError(f"Failed to open image from bytes: {e}")

    file_format = image.format or "UNKNOWN"
    if file_format not in SUPPORTED_FORMATS: raise ImageIngestionError(f"Unsupported format '{file_format}'.")

    exif_orientation, has_exif = _get_exif_orientation(image)
    image = _apply_exif_rotation(image, exif_orientation)
    image = _convert_to_rgb(image)
    
    # Apply the VRAM safety valve here
    image = _enforce_max_resolution(image, max_res)
    _validate_image(image, source_label=filename)

    metadata = ImageMetadata(image.width, image.height, file_format, has_exif, exif_orientation)
    return image, metadata