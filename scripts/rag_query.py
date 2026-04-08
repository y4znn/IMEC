import os
import sys
import json
import google.generativeai as genai
from anthropic import Anthropic
from dotenv import load_dotenv

# Let's import retrieve_context
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from vector_store import retrieve_context

# Load exact environment variables
ENV_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), ".env.local")
load_dotenv(ENV_PATH)

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

def query_gemini(prompt):
    if not GEMINI_KEY:
        return None
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini Error: {str(e)}"

def query_anthropic(prompt):
    if not ANTHROPIC_KEY:
        return None
    client = Anthropic(api_key=ANTHROPIC_KEY)
    system_prompt = (
        "You are an IMEC intelligence analyst. Answer queries using ONLY the retrieved context. "
        "If the answer is not in the context, state: 'Insufficient verified intelligence to answer this query.' "
        "Always cite the source document."
    )
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1000,
            temperature=0,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        return f"Anthropic Error: {str(e)}"

def query_rag(user_query: str):
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

    # 3. Formulate prompt
    full_prompt = f"Retrieved Context:\n{context_text}\n\nUser Query: {user_query}"

    # Provider Selection
    if GEMINI_KEY:
        answer = query_gemini(full_prompt)
    elif ANTHROPIC_KEY:
        answer = query_anthropic(full_prompt)
    else:
        print(json.dumps({"error": "No LLM provider key set (GEMINI_API_KEY or ANTHROPIC_API_KEY)."}))
        return

    if not answer:
        print(json.dumps({"answer": "Insufficient verified intelligence to answer this query."}))
    else:
        print(json.dumps({"answer": answer}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a query string."}))
        sys.exit(1)
    
    query_rag(sys.argv[1])
