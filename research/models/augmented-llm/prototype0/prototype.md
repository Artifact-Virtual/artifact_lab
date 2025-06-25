# Multi-Modal Embedding System with FAISS, Qdrant & pgvector

## Overview

This project is a multi-modal, language-aware, vector-based intelligence engine designed to process and embed text, images, and language-specific data using compact open-source models. It supports search, clustering, and contextual reasoning via FAISS, Qdrant, and pgvector as interchangeable vector databases.

The system is modular, extensible, and deployable for use in:

- Chatbots with memory
- AI assistants with screenshot vision
- Multi-lingual search engines
- Visual question answering
- Embedded AI apps on low-resource hardware

## Architecture Overview

```
                          +------------------+
                          |    User Input    |
                          +--------+---------+
                                   |
                        +----------v----------+
                        | Language Detection  |
                        | (LaBSE, FastText)   |
                        +----------+----------+
                                   |
    +--------------------+---------+----------+---------------------+
    |                    |                    |                     |
+---v---+          +-----v-----+        +-----v------+        +-----v-----+
| Text  |          | Image     |        | Audio (Future)       | Metadata  |
| Embed |          | Embed     |        | Speech-to-Text       | OCR/NLP   |
| (E5,  |          | (CLIP)    |        | (Whisper)            | Enricher  |
| BGE)  |          +-----------+        +----------------------+-----------+
+---+---+                                                          |
    |                                                           +--v--+
    +-----------------+      Unified Vector      +-------------->     |
                      |       Representation     |    FAISS / Qdrant / pgvector
                      +--------------------------+
                                    |
                             +------v-------+
                             |  Retrieval    |
                             |  QA / RAG     |
                             +--------------+
```

## Features

- **Text Embedding**  
  Supports E5-Small, BGE-Small, MiniLM-L6-v2  
  Instruction-tuned (query: / passage:)

- **Image Embedding**  
  OpenAI CLIP (or any ViT compatible encoder)  
  Future support for BLIP2 / Flamingo / Fuyu

- **Language Detection**  
  LaBSE, langdetect, or FastText  
  Routes to appropriate models based on language

- **Vector Databases**  
  - FAISS: In-memory, fast similarity search  
  - Qdrant: Distributed, production-grade with filtering  
  - pgvector: Native PostgreSQL extension for SQL-vector hybrid

- **Multi-modal Queries**  
  Accepts text and image together  
  Returns unified or ranked results

- **Extendable**  
  Add speech, documents (PDF/OCR), audio/video transcription  
  Add keyword filters or tags

## Project Structure

```
project/
├── app/
│   ├── __init__.py
│   ├── embed_text.py       # Text embedding logic
│   ├── embed_image.py      # Image embedding logic
│   ├── lang_detect.py      # Language detection
│   ├── router.py           # Model routing logic
│   └── multimodal.py       # Combined query handling
│
├── vector_store/
│   ├── faiss_index.py
│   ├── qdrant_client.py
│   ├── pgvector_client.py
│
├── server/
│   ├── main.py             # FastAPI server
│   └── api_routes.py       # REST endpoints
│
├── data/
│   └── sample_texts.json
├── README.md
└── requirements.txt
```

## Setup Instructions

1. Clone the Repo:

   ```bash
   git clone https://github.com/your-org/multimodal-embed-system.git
   cd multimodal-embed-system
   ```

2. Install Dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Install & Run Vector Databases:

   - **FAISS** (In-memory, No setup):  
     No action needed, runs in-process.

   - **Qdrant**:  
     ```bash
     docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
     ```

   - **pgvector**:  
     Install PostgreSQL and add the extension:  
     ```sql
     CREATE EXTENSION vector;
     ```
     Connect with psycopg2 or SQLAlchemy.

## Usage

### Embed & Search Text

```python
from app.embed_text import embed_text
from vector_store.faiss_index import store_and_search_faiss

vector = embed_text("query: What is quantum gravity?")
results = store_and_search_faiss(vector)
```

### Embed Image

```python
from app.embed_image import embed_image

vector = embed_image("./images/sample.jpg")
```

### Multi-modal Query

```python
from app.multimodal import process_multimodal_query

results = process_multimodal_query(text="Explain a red panda", image_path="./red_panda.jpg")
```

## Configurable Options

| Parameter            | Description                        | Default         |
|----------------------|------------------------------------|-----------------|
| `model.text_model`   | Embedding model for text           | `e5-small-v2`   |
| `model.image_model`  | Embedding model for images         | `clip-vit-base` |
| `vector_backend`     | One of faiss, qdrant, pgvector     | `faiss`         |
| `normalize_embeddings` | Normalize to unit vectors         | `True`          |

## Security / Privacy

- No external API calls required.  
- All models run locally.  
- Optional anonymization or encryption for sensitive queries.

## Roadmap

- Add support for audio and video embeddings.  
- Expand multi-modal capabilities with advanced models.  
- Improve scalability and performance for large datasets.

## Testing

Run tests using:

```bash
pytest tests/
```

## License

Open-source under Apache 2.0 / MIT (confirm with your dependencies).

## Contributing

Pull requests are welcome! For major changes, open an issue first to discuss your vision.

1. Fork the project.  
2. Create your feature branch.  
3. Commit your changes.  
4. Push to the branch.  
5. Open a pull request.

## Maintainers

Built by Ali A. Shakil and collaborators. Feel free to contact or contribute ideas for multi-modal, multilingual AI projects.

## Related Projects

- FlagEmbedding  
- Qdrant  
- pgvector  
- Sentence-Transformers  
- OpenAI CLIP
