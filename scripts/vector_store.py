import os
import json
import faiss
import numpy as np

class MockEmbedder:
    def get_sentence_embedding_dimension(self):
        return 384
    def encode(self, sentences, convert_to_numpy=True):
        return np.random.rand(len(sentences), 384).astype(np.float32)

embedder = MockEmbedder()

# ─── Configuration ──────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")

INDEX_PATH = os.path.join(DATA_DIR, "vector_index.faiss")
META_PATH = os.path.join(DATA_DIR, "vector_meta.json")

# Chunking Config
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Splits text into overlapping chunks to preserve complex context."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += (chunk_size - overlap)
    return chunks


def load_index():
    if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
        index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
        return index, meta
    else:
        dimension = embedder.get_sentence_embedding_dimension()
        return faiss.IndexFlatL2(dimension), []


def embed_and_store(documents: list[dict]):
    """
    Takes a list of document dicts (with 'title', 'summary', 'url', 'id'),
    chunks them, embeds them, and adds to the local FAISS index.
    """
    index, meta = load_index()
    
    new_chunks = []
    new_meta = []
    
    for doc in documents:
        text = f"{doc.get('title', '')} {doc.get('summary', '')}"
        if not text.strip():
            continue
            
        chunks = chunk_text(text)
        for i, snippet in enumerate(chunks):
            new_chunks.append(snippet)
            new_meta.append({
                "id": doc.get('id', 'unknown'),
                "title": doc.get('title', ''),
                "url": doc.get('url', ''),
                "chunk_index": i,
                "text": snippet
            })
            
    if new_chunks:
        embeddings = embedder.encode(new_chunks, convert_to_numpy=True)
        index.add(embeddings)
        meta.extend(new_meta)
        
        faiss.write_index(index, INDEX_PATH)
        with open(META_PATH, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)


def retrieve_context(query: str, k: int = 4) -> list[dict]:
    """Retrieves the top k chunks closing to the query."""
    index, meta = load_index()
    if index.ntotal == 0:
        return []

    q_embed = embedder.encode([query], convert_to_numpy=True)
    distances, indices = index.search(q_embed, k)
    
    results = []
    for idx in indices[0]:
        if idx < len(meta) and idx != -1:
            results.append(meta[idx])
            
    return results
