# target embedding generation
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║ MODULE 4: TARGET GENERATION                                                  ║
║                                                                              ║
║ Purpose: Generate a target identity embedding that the attack will pull      ║
║          the original image towards.                                         ║
║                                                                              ║
║ Strategy A (Default): Generate a random unit vector on the hypersphere       ║
║                       that is mathematically distinct from the original      ║
║                       identity (Cosine Similarity < -0.1).                   ║
║                                                                              ║
║ This eliminates the need for external celebrity image datasets entirely.     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

def generate_target_embedding(
    original_embedding: np.ndarray, 
    max_attempts: int = 1000
) -> np.ndarray:
    """
    Generates a random identity target that is distinctly different from the original.
    
    Args:
        original_embedding: (N,) float32 numpy array
        max_attempts: Safety limit for the while loop
        
    Returns:
        (N,) float32 numpy array representing the target identity
        
    Raises:
        RuntimeError: If a valid orthogonal vector cannot be found (mathematically rare).
    """
    dim = original_embedding.shape[0]
    
    # Normalize original embedding to unit length (L2 norm = 1)
    orig_norm = original_embedding / np.linalg.norm(original_embedding)

    logger.info(f"Generating distinct target embedding (Dimension: {dim})...")

    for attempt in range(max_attempts):
        # 1. Sample from a standard normal distribution
        target = np.random.randn(dim)
        
        # 2. Project onto the unit hypersphere
        target = target / np.linalg.norm(target)

        # 3. Measure angular distance (Cosine Similarity)
        # Cosine similarity range: [-1, 1].
        # 1 = Identical, 0 = Orthogonal, -1 = Opposite
        cos_sim = np.dot(orig_norm, target)
        
        # We want a vector that points in a different direction.
        # < -0.1 ensures it is comfortably distinct.
        if cos_sim < -0.1:
            logger.info(f"Target locked on attempt {attempt + 1}. Cosine Similarity to original: {cos_sim:.4f}")
            return target.astype(np.float32)
            
    raise RuntimeError("Failed to generate a distinctly different target embedding.")

if __name__ == "__main__":
    print("Module 4: Target Generation")
    print("=" * 60)
    
    # Test with a dummy 512-dim vector (like FaceNet/ArcFace)
    dummy_orig = np.random.randn(512)
    target = generate_target_embedding(dummy_orig)
    print(f"Target shape: {target.shape}")