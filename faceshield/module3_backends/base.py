"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 3: ABSTRACT BACKEND INTERFACE                                         ║
║                                                                              ║
║ Purpose: Define the strict contract that every face recognition model        ║
║          (FaceNet, ArcFace, AdaFace) MUST follow.                            ║
║                                                                              ║
║ Contract:                                                                    ║
║   - Inputs are ALWAYS strictly 112x112 pixels.                               ║
║   - get_embedding(): Returns a pure NumPy array for Module 6 (Evaluation).   ║
║   - forward(): Returns a PyTorch Tensor WITH gradients for Module 5 (Attack).║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from abc import ABC, abstractmethod
import numpy as np
import torch

class FaceRecognitionBackend(ABC):
    """
    Abstract Base Class for all face recognition surrogate models.
    Forces all future models to implement the exact same interface.
    """
    
    def __init__(self, device: str = 'cpu'):
        self.device = device

    @abstractmethod
    def get_embedding(self, face_np_112: np.ndarray) -> np.ndarray:
        """
        Calculates the feature embedding without tracking gradients.
        
        Args:
            face_np_112: (112, 112, 3) uint8 numpy array in RGB space [0, 255]
            
        Returns:
            (N,) float32 numpy array representing the identity vector.
        """
        pass

    @abstractmethod
    def forward(self, face_tensor_112: torch.Tensor) -> torch.Tensor:
        """
        Differentiable forward pass for the PGD attack engine.
        
        Args:
            face_tensor_112: (1, 3, 112, 112) float32 torch tensor in [0, 255]
            
        Returns:
            (1, N) float32 torch tensor representing the identity vector.
            MUST maintain the computational graph (requires_grad=True upstream).
        """
        pass