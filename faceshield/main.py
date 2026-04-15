"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ FACESHIELD — PHASE 1 ORCHESTRATOR                                            ║
║                                                                              ║
║ Usage:                                                                       ║
║   python main.py inputs/img.jpg outputs/cloaked.png                         ║
║   python main.py inputs/img.jpg --steps 300                                 ║
║   python main.py inputs/img.jpg --cpu                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import argparse
import logging
import os
import sys

import numpy as np
import torch
from PIL import Image

from module1_ingestion import ingest_image
from module2_detection import FaceDetectionError, detect_and_crop
from module3_backends import FaceNetBackend
from module4_target import generate_target_embedding
from module5_attack import run_attack
from module6_evaluation import evaluate
from module7_reconstruction import reconstruct_image

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("FaceShield")

BACKEND_NAME = 'facenet'  # Phase 1. Change to 'arcface' in Phase 2.


def main():
    parser = argparse.ArgumentParser(
        description="FaceShield Phase 1 — EOT Adversarial Face Cloaking"
    )
    parser.add_argument(
        "input",
        help="Path to input image (JPG or PNG)"
    )
    parser.add_argument(
        "output",
        nargs='?',
        default="outputs/cloaked_output.png",
        help="Path to save cloaked image (must be PNG, default: outputs/cloaked_output.png)"
    )
    parser.add_argument(
        "--steps",
        type=int,
        default=200,
        help="Optimization steps: 40=fast, 150=balanced, 300=strong (default: 150)"
    )
    parser.add_argument(
        "--cpu",
        action="store_true",
        help="Force CPU even if CUDA is available"
    )
    args = parser.parse_args()

    input_path  = args.input
    output_path = args.output

    # ── Validate input path ───────────────────────────────────────────────────
    if not os.path.exists(input_path):
        logger.error(f"Input file not found: '{input_path}'")
        sys.exit(1)

    # ── Enforce PNG output ────────────────────────────────────────────────────
    # JPEG compression destroys adversarial noise. PNG is mandatory.
    if not output_path.lower().endswith(".png"):
        logger.warning(
            "Output must be PNG — JPEG compression destroys adversarial noise. "
            "Forcing .png extension."
        )
        output_path = os.path.splitext(output_path)[0] + ".png"

    # ── Ensure output directory exists ───────────────────────────────────────
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    # ── Device selection ──────────────────────────────────────────────────────
    device = 'cpu' if args.cpu else ('cuda' if torch.cuda.is_available() else 'cpu')

    print("\n" + "═" * 60)
    print(f"  FACESHIELD  |  Phase 1  |  {device.upper()}")
    print("═" * 60)

    try:
        # ── Module 1: Ingestion ───────────────────────────────────────────────
        print("\n[1/7] Loading and sanitizing image...")
        master_pil, metadata = ingest_image(input_path)
        print(f"      ↳ {metadata.width}×{metadata.height} | {metadata.format}")

        # ── Module 2: Detection ───────────────────────────────────────────────
        print("\n[2/7] Detecting face and extracting native crop...")
        high_res_face_np, routing_data = detect_and_crop(master_pil, device=device)
        bbox = routing_data['bbox']
        print(
            f"      ↳ Bbox: {bbox} | "
            f"Crop: {routing_data['original_crop_size'][0]}×"
            f"{routing_data['original_crop_size'][1]} | "
            f"Confidence: {routing_data['confidence']:.2%}"
        )

        # ── Module 3: Backend ─────────────────────────────────────────────────
        print("\n[3/7] Loading FaceNet surrogate model...")
        backend = FaceNetBackend(device=device)

        # ── Module 4: Target generation ───────────────────────────────────────
        print("\n[4/7] Generating target identity vector...")
        # Resize to 112×112 for embedding extraction — Module 3 contract
        face_pil_112 = Image.fromarray(high_res_face_np).resize(
            (112, 112), Image.Resampling.LANCZOS
        )
        orig_embedding    = backend.get_embedding(np.array(face_pil_112))
        target_embedding  = generate_target_embedding(orig_embedding)
        print("      ↳ Target vector generated.")

        # ── Module 5: Attack ──────────────────────────────────────────────────
        print(f"\n[5/7] Running EOT attack ({args.steps} steps)...")
        cloaked_high_res_np = run_attack(
            high_res_face_np,
            target_embedding,
            backend,
            device=device,
            steps=args.steps,
        )
        print("      ↳ Attack complete.")

        # ── Module 6: Evaluation ──────────────────────────────────────────────
        print("\n[6/7] Evaluating results...")
        metrics = evaluate(
            high_res_face_np,
            cloaked_high_res_np,
            backend,
            backend_name=BACKEND_NAME,
        )
        print(f"      ↳ Cosine similarity: {metrics['cosine_similarity']:.4f}  "
              f"(threshold: {metrics['threshold']} — goal: below this)")
        print(f"      ↳ SSIM:              {metrics['ssim']:.4f}  (goal: > 0.90)")
        print(f"      ↳ PSNR:              {metrics['psnr']:.2f} dB  (goal: > 30 dB)")
        print(f"      ↳ Verdict:           {metrics['verdict']}")

        # ── Module 7: Reconstruction ──────────────────────────────────────────
        print("\n[7/7] Reconstructing full image...")
        final_image = reconstruct_image(master_pil, cloaked_high_res_np, routing_data)
        final_image.save(output_path, format="PNG")
        print(f"      ↳ Saved: {output_path}")

        print("\n" + "═" * 60)
        if metrics['verdict'] == "Protected":
            print("  ✅  PIPELINE COMPLETE — IMAGE PROTECTED")
        else:
            print("  ⚠️   PIPELINE COMPLETE — PROTECTION WEAK (try --steps 300)")
        print("═" * 60 + "\n")

    except FaceDetectionError as e:
        logger.error(f"\nPipeline halted — face detection failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()