import json
import os
import sys

# Add script dir to path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from vector_store import embed_and_store

SOURCES_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), "public", "data", "sources.json")

def sync():
    if not os.path.exists(SOURCES_PATH):
        print(f"Error: {SOURCES_PATH} not found.")
        return

    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        sources = json.load(f)

    print(f"Syncing {len(sources)} sources from sources.json to Vector DB...")
    
    # Process in batches to avoid memory issues
    batch_size = 100
    for i in range(0, len(sources), batch_size):
        batch = sources[i:i + batch_size]
        embed_and_store(batch)
        print(f"  Indexed sources {i} to {min(i + batch_size, len(sources))}")

    print("Sync complete. FAISS index and metadata updated.")

if __name__ == "__main__":
    sync()
