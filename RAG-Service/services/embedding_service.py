"""
Embedding Service — Mistral embeddings + Pinecone vector storage.

Handles:
  - Text → 1024-dim vector (Mistral 'mistral-embed')
  - Vector upsert to Pinecone with metadata
  - Semantic similarity search with userId filtering
  - User vector deletion (GDPR)
"""

import os
import time
import logging
from pinecone import Pinecone, ServerlessSpec
from mistralai.client import Mistral

logger = logging.getLogger("rag.embedding")

# ── Lazy clients ──────────────────────────────────────

_pinecone: Pinecone | None = None
_index = None
_mistral: Mistral | None = None

PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX", "system2-rag")
EMBED_MODEL = "mistral-embed"  # 1024 dimensions
EMBED_DIMENSIONS = 1024


def get_pinecone():
    global _pinecone, _index
    if _pinecone is None:
        api_key = os.environ.get("PINECONE_API_KEY", "")
        if not api_key:
            raise RuntimeError("PINECONE_API_KEY not set")
        _pinecone = Pinecone(api_key=api_key)
        _index = _pinecone.Index(PINECONE_INDEX_NAME)
        logger.info(f"Pinecone connected: index={PINECONE_INDEX_NAME}")
    return _index


def get_mistral():
    global _mistral
    if _mistral is None:
        api_key = os.environ.get("MISTRAL_API_KEY", "")
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY not set")
        _mistral = Mistral(api_key=api_key)
        logger.info("Mistral client initialized")
    return _mistral


# ── Embedding ─────────────────────────────────────────


def embed_text(text: str, retries: int = 3) -> list[float]:
    """
    Embed text into a 1024-dim vector using Mistral.
    Retries with exponential backoff on failure.
    """
    client = get_mistral()
    for attempt in range(retries):
        try:
            response = client.embeddings.create(
                model=EMBED_MODEL,
                inputs=[text],
            )
            vector = response.data[0].embedding
            logger.debug(f"Embedded {len(text)} chars → {len(vector)}-dim vector")
            return vector
        except Exception as e:
            wait = 2**attempt
            logger.warning(
                f"Embed attempt {attempt + 1}/{retries} failed: {e}. Retrying in {wait}s..."
            )
            if attempt < retries - 1:
                time.sleep(wait)
            else:
                raise RuntimeError(f"Embedding failed after {retries} attempts: {e}")


def embed_texts(texts: list[str], retries: int = 3) -> list[list[float]]:
    """Batch embed multiple texts."""
    client = get_mistral()
    for attempt in range(retries):
        try:
            response = client.embeddings.create(
                model=EMBED_MODEL,
                inputs=texts,
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            wait = 2**attempt
            logger.warning(f"Batch embed attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(wait)
            else:
                raise RuntimeError(
                    f"Batch embedding failed after {retries} attempts: {e}"
                )


# ── Pinecone Storage ──────────────────────────────────


def embed_and_store(
    pinecone_id: str,
    text: str,
    metadata: dict,
    retries: int = 3,
) -> bool:
    """
    Embed text and upsert vector to Pinecone.
    Uses deterministic IDs so re-upserts are idempotent.
    """
    index = get_pinecone()
    vector = embed_text(text)

    # Include the summary text in metadata for retrieval
    full_metadata = {**metadata, "summary": text}

    for attempt in range(retries):
        try:
            index.upsert(
                vectors=[
                    {
                        "id": pinecone_id,
                        "values": vector,
                        "metadata": full_metadata,
                    }
                ]
            )
            logger.info(f"Upserted vector: {pinecone_id}")
            return True
        except Exception as e:
            wait = 2**attempt
            logger.warning(f"Upsert attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(wait)
            else:
                logger.error(f"Upsert failed after {retries} attempts: {e}")
                return False


def semantic_search(
    query: str,
    user_id: str,
    top_k: int = 5,
    retries: int = 3,
) -> list[dict]:
    """
    Embed query and search Pinecone for the most relevant page summaries.
    Filters by userId metadata. Returns results sorted by similarity score.
    """
    index = get_pinecone()
    query_vector = embed_text(query)

    for attempt in range(retries):
        try:
            results = index.query(
                vector=query_vector,
                top_k=top_k,
                filter={"userId": {"$eq": user_id}},
                include_metadata=True,
            )

            matches = []
            for match in results.get("matches", []):
                meta = match.get("metadata", {})
                matches.append(
                    {
                        "pageIndex": meta.get("pageIndex", -1),
                        "summary": meta.get("summary", ""),
                        "score": match.get("score", 0.0),
                        "timeFrom": meta.get("timeFrom", ""),
                        "timeTo": meta.get("timeTo", ""),
                    }
                )

            logger.info(
                f"Search for user {user_id}: {len(matches)} results (top score: {matches[0]['score']:.3f})"
                if matches
                else f"Search for user {user_id}: 0 results"
            )
            return matches

        except Exception as e:
            wait = 2**attempt
            logger.warning(f"Search attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(wait)
            else:
                logger.error(
                    f"Search failed after {retries} attempts, returning empty: {e}"
                )
                return []  # Graceful degradation


def delete_user_vectors(user_id: str) -> int:
    """Delete all vectors for a user (GDPR compliance)."""
    index = get_pinecone()
    try:
        # Pinecone doesn't support delete by metadata filter on serverless.
        # We use a list + delete approach: query all user vectors, then delete by ID.
        results = index.query(
            vector=[0.0] * EMBED_DIMENSIONS,  # dummy vector
            top_k=10000,
            filter={"userId": {"$eq": user_id}},
            include_metadata=False,
        )
        ids = [m["id"] for m in results.get("matches", [])]
        if ids:
            index.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} vectors for user {user_id}")
        return len(ids)
    except Exception as e:
        logger.error(f"Failed to delete vectors for user {user_id}: {e}")
        return 0


# ── Index Management ──────────────────────────────────


def create_index_if_not_exists():
    """Create the Pinecone index if it doesn't exist. Run once during setup."""
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY", ""))
    existing = [idx.name for idx in pc.list_indexes()]

    if PINECONE_INDEX_NAME in existing:
        logger.info(f"Index '{PINECONE_INDEX_NAME}' already exists")
        return False

    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=EMBED_DIMENSIONS,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    logger.info(
        f"Created Pinecone index: {PINECONE_INDEX_NAME} ({EMBED_DIMENSIONS}-dim, cosine)"
    )
    return True


def is_pinecone_healthy() -> bool:
    """Check if Pinecone is reachable."""
    try:
        index = get_pinecone()
        index.describe_index_stats()
        return True
    except Exception:
        return False


def is_mistral_healthy() -> bool:
    """Check if Mistral API is reachable."""
    try:
        client = get_mistral()
        client.models.list()
        return True
    except Exception:
        return False
