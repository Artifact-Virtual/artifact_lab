from qdrant_client import QdrantClient
import numpy as np

client = QdrantClient(":memory:")

def upsert_vector(id: str, vector: list):
    client.upsert(collection_name="default", points=[{"id": id, "vector": vector}])

def search_vector(query: list):
    return client.search(collection_name="default", vector=query, top=5)