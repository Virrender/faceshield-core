"""
Phase 1 Surrogate Model: FaceNet (InceptionResnetV1)
"""

import logging
import numpy as np
import torch
import torch.nn.functional as F
from facenet_pytorch import InceptionResnetV1

from .base import FaceRecognitionBackend

logger = logging.getLogger(__name__)

class FaceNetBackend(FaceRecognitionBackend):
    def __init__(self, device: str = 'cpu'):
        super().__init__(device)
        logger.info(f"Initializing FaceNetBackend on {self.device.upper()}...")
        
        # Load pre-trained VGGFace2 weights
        self.model = InceptionResnetV1(pretrained='vggface2').to(self.device)
        
        # CRITICAL: We are attacking the image, not training the model.
        # Force evaluation mode and freeze all model weights to save VRAM
        # and prevent gradient leakage.
        self.model.eval()
        for param in self.model.parameters():
            param.requires_grad = False
            
        logger.info("FaceNet loaded and weights frozen.")

    def _preprocess(self, x: torch.Tensor) -> torch.Tensor:
        """
        Normalizes input tensor [0, 255] to FaceNet's expected roughly [-1, 1] range.
        FaceNet-pytorch uses (x - 127.5) / 128.0 as its standard normalization.
        """
        return (x - 127.5) / 128.0

    def get_embedding(self, face_np_112: np.ndarray) -> np.ndarray:
        # Convert numpy (H, W, C) -> torch (1, C, H, W)
        face_tensor = torch.from_numpy(face_np_112).permute(2, 0, 1).unsqueeze(0).float().to(self.device)
        
        with torch.no_grad():
            face_tensor_norm = self._preprocess(face_tensor)
            
            # FaceNet requires 160x160. We uphold our 112x112 architecture contract
            # by handling this discrepancy completely internally.
            face_tensor_resized = F.interpolate(
                face_tensor_norm, 
                size=(160, 160), 
                mode='bilinear',
                align_corners=False,
                antialias=True
            )
            
            embedding = self.model(face_tensor_resized)
            
        # Return as a flattened 1D numpy array
        return embedding.cpu().numpy().flatten()

    def forward(self, face_tensor_112: torch.Tensor) -> torch.Tensor:
        # Differentiable pipeline: NO torch.no_grad() here!
        face_tensor_norm = self._preprocess(face_tensor_112)
        
        face_tensor_resized = F.interpolate(
            face_tensor_norm, 
            size=(160, 160), 
            mode='bilinear',
            align_corners=False,
            antialias=True
        )
        
        return self.model(face_tensor_resized)