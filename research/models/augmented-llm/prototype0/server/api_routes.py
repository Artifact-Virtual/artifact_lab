from fastapi import APIRouter, UploadFile, File
from app.embed_text import embed_text
from app.embed_image import embed_image

router = APIRouter()

@router.post("/embed/text")
def api_embed_text(text: str):
    return {"vector": embed_text(text).tolist()}

@router.post("/embed/image")
async def api_embed_image(file: UploadFile = File(...)):
    path = f"/tmp/{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"vector": embed_image(path).tolist()}