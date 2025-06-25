import faiss
import numpy as np

index = faiss.IndexFlatL2(512)

def store_vector(vec: np.ndarray):
    index.add(np.array([vec]))

def search_vector(query: np.ndarray, k=5):
    D, I = index.search(np.array([query]), k)
    return I.tolist(), D.tolist()