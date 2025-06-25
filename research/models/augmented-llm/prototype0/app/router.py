from app.embed_text import embed_text
from app.embed_image import embed_image

def route_input(text=None, image_path=None):
    if text and not image_path:
        return embed_text(text)
    elif image_path and not text:
        return embed_image(image_path)
    else:
        raise ValueError("Provide either text or image_path")