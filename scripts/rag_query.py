import os
import sys
import json
import anthropic
from dotenv import load_dotenv

# Let's import retrieve_context
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from vector_store import retrieve_context

# Load exact environment variables
ENV_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), ".env.local")
load_dotenv(ENV_PATH)

def query_rag(user_query: str):
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        print(json.dumps({"error": "ANTHROPIC_API_KEY is not set."}))
        sys.exit(1)

    # 1. Retrieve the strict context from our verified FAISS index
    context_chunks = retrieve_context(user_query, k=4)
    
    if not context_chunks:
        # FAISS is empty or no context found
        print(json.dumps({"answer": "Insufficient verified intelligence to answer this query."}))
        sys.exit(0)

    # 2. Build the context body
    context_text = ""
    for idx, chunk in enumerate(context_chunks):
        ref_id = chunk.get("id", f"source-{idx}")
        url = chunk.get("url", "unknown url")
        text = chunk.get("text", "")
        context_text += f"\n--- Source [{ref_id}] ({url}) ---\n{text}\n"

    # 3. Formulate strict system prompt and user prompt
    client = anthropic.Anthropic(api_key=anthropic_key)
    
    system_prompt = (
        "You are an IMEC intelligence analyst. Answer queries using ONLY the retrieved context. "
        "If the answer is not in the context, state: 'Insufficient verified intelligence to answer this query.' "
        "Always cite the source document."
    )

    user_message = f"Retrieved Context:\n{context_text}\n\nUser Query: {user_query}"

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=600,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        answer = response.content[0].text
        print(json.dumps({"answer": answer}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a query string."}))
        sys.exit(1)
    
    query_rag(sys.argv[1])
