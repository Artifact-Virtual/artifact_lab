from app.embed_text import embed_text
from app.embed_image import embed_image
import numpy as np

def process_multimodal_query(text: str, image_path: str):
    text_vector = embed_text(text)
    image_vector = embed_image(image_path)
    return (text_vector + image_vector) / 2