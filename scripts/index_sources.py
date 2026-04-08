import os
import json
import sys

# Add script directory to path to import vector_store
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from vector_store import embed_and_store

def main():
    """
    Main entry point for indexing the verified IMEC sources.
    Reads from public/data/sources.json and populates the vector store metadata.
    """
    project_root = os.path.dirname(SCRIPT_DIR)
    sources_path = os.path.join(project_root, "public", "data", "sources.json")

    print(f"[*] Initializing Indexing Pipeline: {sources_path}")

    if not os.path.exists(sources_path):
        print(f"[!] Error: Source file not found at {sources_path}")
        sys.exit(1)

    try:
        with open(sources_path, "r", encoding="utf-8") as f:
            sources = json.load(f)
    except Exception as e:
        print(f"[!] Error: Failed to parse sources.json: {e}")
        sys.exit(1)

    print(f"[*] Loaded {len(sources)} documents. Commencing embedding simulation...")
    
    try:
        # Clear existing meta if needed, but embed_and_store manages it.
        # However, for a fresh index, we should probably clear it first or embed all.
        embed_and_store(sources)
        print("[+] Success: Geoeconomic Vector Store updated (public/data/vector_meta.json)")
    except Exception as e:
        print(f"[!] Error: Embedding simulation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
