import numpy as np
import os

class IndexFlatL2:
    def __init__(self, d):
        self.d = d
        self.vectors = np.empty((0, d), dtype=np.float32)
        self.ntotal = 0
        
    def add(self, x):
        self.vectors = np.vstack([self.vectors, x.astype(np.float32)])
        self.ntotal = len(self.vectors)
        
    def search(self, x, k):
        if self.ntotal == 0:
            return np.array([[]]), np.array([[]])
        
        # Calculate L2 distance for x (1, d) against all vectors (N, d)
        dist = np.sum((self.vectors - x[0]) ** 2, axis=1)
        k_actual = min(k, self.ntotal)
        indices = np.argsort(dist)[:k_actual]
        distances = dist[indices]
        return np.array([distances]), np.array([indices])

def write_index(index, filename):
    np.save(filename + ".npy", index.vectors)

def read_index(filename):
    if os.path.exists(filename + ".npy"):
        vectors = np.load(filename + ".npy")
        index = IndexFlatL2(vectors.shape[1])
        index.vectors = vectors
        index.ntotal = len(vectors)
        return index
    return IndexFlatL2(384)  # Default dimension for all-MiniLM-L6-v2
