-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for text/image embeddings
CREATE TABLE embeddings (
    id SERIAL PRIMARY KEY,
    source TEXT,
    modality TEXT, -- 'text' | 'image' | 'audio'
    content TEXT,
    embedding vector(384) -- or 768, 1024 based on model
);
