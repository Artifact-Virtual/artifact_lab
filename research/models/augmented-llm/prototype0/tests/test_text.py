from app.embed_text import embed_text

def test_embed_text():
    vec = embed_text("test string")
    assert isinstance(vec.tolist(), list)