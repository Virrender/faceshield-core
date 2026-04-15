import sys
import os
import time


# Tell Python where to find your existing modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'faceshield'))

import io
import json
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image as PILImage

from module1_ingestion import ingest_image_from_bytes
from module2_detection import detect_and_crop
from module3_backends import FaceNetBackend
from module4_target import generate_target_embedding
from module5_attack import run_attack
from module6_evaluation import evaluate
from module7_reconstruction import reconstruct_image

import torch

app = FastAPI()

# Allow Node.js to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Load model ONCE at startup — not on every request
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading FaceNet on {device}...")
BACKEND = FaceNetBackend(device=device)
print("Model loaded. Ready.")

MODE_PARAMS = {
    "fast":     {"steps": 40,  "epsilon": 0.05, "lr": 0.08},
    "balanced": {"steps": 150, "epsilon": 0.02, "lr": 0.08},
    "strong":   {"steps": 300, "epsilon": 0.03, "lr": 0.05},
}


@app.post("/cloak")
async def cloak_image(
    file: UploadFile = File(...),
    mode: str = Form("balanced"),
):
    """
    Receives one image, returns cloaked PNG + metrics in response headers.
    """
    params = MODE_PARAMS.get(mode, MODE_PARAMS["balanced"])
    start_time = time.time()
    try:
        image_bytes = await file.read()

        # Module 1 — ingest from bytes (no file path needed)
        master_pil, _ = ingest_image_from_bytes(image_bytes, filename=file.filename)

        # Module 2 — detect face
        high_res_face_np, routing_data = detect_and_crop(master_pil, device=device)

        # Module 4 — target embedding
        face_112 = np.array(
            PILImage.fromarray(high_res_face_np).resize((112, 112), PILImage.Resampling.LANCZOS)
        )
        orig_embedding   = BACKEND.get_embedding(face_112)
        target_embedding = generate_target_embedding(orig_embedding)

        # Module 5 — attack
        cloaked_np = run_attack(
            high_res_face_np, target_embedding, BACKEND,
            device=device,
            steps=params["steps"],
            epsilon=params["epsilon"],
            lr=params["lr"],
        )

        # Module 6 — evaluate
        metrics = evaluate(high_res_face_np, cloaked_np, BACKEND, backend_name="facenet")

        # Module 7 — reconstruct
        final_image = reconstruct_image(master_pil, cloaked_np, routing_data)

        # Convert PIL image to PNG bytes
        buf = io.BytesIO()
        final_image.save(buf, format="PNG")
        png_bytes = buf.getvalue()
        elapsed = round(time.time() - start_time, 1) 

        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={"X-Metrics": json.dumps(metrics)},
        )

    except Exception as e:
        import traceback
        return Response(
            content=json.dumps({"error": str(e), "trace": traceback.format_exc()}),
            media_type="application/json",
            status_code=500,
        )


@app.get("/health")
def health():
    return {"status": "ok", "device": device}