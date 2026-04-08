import os
import json
import re

# ─── Configuration ──────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")

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

def embed_and_store(documents: list[dict]):
    """
    Simulates semantic storage by building a JSON metadata store for keyword search.
    This bypasses semantic model downloads for zero-dependency reliability.
    """
    if os.path.exists(META_PATH):
        with open(META_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
    else:
        meta = []
    
    for doc in documents:
        text = f"{doc.get('title', '')} {doc.get('summary', '')}"
        if not text.strip():
            continue
            
        chunks = chunk_text(text)
        for i, snippet in enumerate(chunks):
            meta.append({
                "id": doc.get('id', 'unknown'),
                "title": doc.get('title', ''),
                "url": doc.get('url', ''),
                "chunk_index": i,
                "text": snippet
            })
            
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

def retrieve_context(query: str, k: int = 4) -> list[dict]:
    """
    Retrieves the top k chunks using keyword frequency analysis.
    Implements a robust local TF-IDF style ranking without external models.
    """
    if not os.path.exists(META_PATH):
        return []

    with open(META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    if not meta:
        return []

    # Simple Keyword Scoring
    keywords = re.findall(r'\w+', query.lower())
    scored_meta = []

    for chunk in meta:
        score = 0
        text_lower = chunk["text"].lower()
        title_lower = chunk["title"].lower()
        
        for kw in keywords:
            if kw in text_lower:
                score += text_lower.count(kw)
            if kw in title_lower:
                score += (title_lower.count(kw) * 2) # Weighted boost for title matches
                
        if score > 0:
            scored_meta.append((score, chunk))

    # Sort by score descending
    scored_meta.sort(key=lambda x: x[0], reverse=True)
    
    # Return top k unique documents
    unique_docs = []
    seen_ids = set()
    for _, chunk in scored_meta:
        if chunk["id"] not in seen_ids:
            unique_docs.append(chunk)
            seen_ids.add(chunk["id"])
            if len(unique_docs) >= k:
                break
                
    return unique_docs
