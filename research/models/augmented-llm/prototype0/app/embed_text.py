from sentence_transformers import SentenceTransformer

model = SentenceTransformer("intfloat/e5-small-v2")

def embed_text(text: str):
    return model.encode([text])[0]