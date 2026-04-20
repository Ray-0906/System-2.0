"""
One-time script: Create the Pinecone index for System 2.0 RAG.

Run once:
  cd RAG-Service
  python scripts/create_index.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from services.embedding_service import create_index_if_not_exists

if __name__ == "__main__":
    print("Creating Pinecone index for System 2.0 RAG...")
    created = create_index_if_not_exists()
    if created:
        print("✅ Index created successfully! It may take 1-2 minutes to become ready.")
    else:
        print("ℹ️  Index already exists — no action needed.")
