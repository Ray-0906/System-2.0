"""
Page Builder — Complete page building pipeline in Python.

Owns the entire flow:
  1. Read unassigned events from MongoDB (pageIndex: -1)
  2. Group into pages of 20
  3. Summarize with Mistral LLM
  4. Embed with Mistral (1024-dim)
  5. Upsert to Pinecone
  6. Update MongoDB (EventLog.pageIndex, PageSummary, embeddedAt)

This replaces the Node.js buildPages() function that used Langchain.
All AI work now lives in Python.
"""

import os
import logging
from datetime import datetime, timezone
from pymongo import MongoClient
from mistralai.client import Mistral

from services.embedding_service import embed_and_store

logger = logging.getLogger("rag.page_builder")

PAGE_SIZE = 20

# ── Lazy clients ──────────────────────────────────────

_mongo_client: MongoClient | None = None
_db = None
_mistral: Mistral | None = None


def get_db():
    """Get MongoDB database connection (lazy init)."""
    global _mongo_client, _db
    if _db is None:
        uri = os.environ.get("MONGO_URI", "")
        if not uri:
            raise RuntimeError("MONGO_URI not set in RAG-Service .env")
        _mongo_client = MongoClient(uri)
        db_name = uri.rsplit("/", 1)[-1].split("?")[0] or "soloLvl"
        _db = _mongo_client[db_name]
        logger.info(f"MongoDB connected: {db_name}")
    return _db


def get_mistral():
    """Get Mistral client for summarization."""
    global _mistral
    if _mistral is None:
        api_key = os.environ.get("MISTRAL_API_KEY", "")
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY not set")
        _mistral = Mistral(api_key=api_key)
    return _mistral


# ── Summarization ─────────────────────────────────────


def summarize_events(events: list[dict]) -> dict:
    """
    Summarize a page of events into 2-3 sentences + keywords using Mistral.
    Returns { summary: str, keywords: list[str] }
    """
    event_text = "\n".join(
        f"[{e.get('timestamp', '')}] {e.get('summary', e.get('type', ''))}"
        for e in events
    )

    prompt = (
        "Summarize these user activity events for a gamified self-improvement app "
        "in 2-3 sentences. Focus on patterns, achievements, and areas of activity. "
        'Also extract 5-8 keywords.\n\n'
        f"Events:\n{event_text}\n\n"
        'Respond in JSON: {"summary": "...", "keywords": ["..."]}'
    )

    try:
        client = get_mistral()
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )

        text = response.choices[0].message.content or ""

        # Parse JSON from response
        import json
        import re

        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            parsed = json.loads(match.group(0))
            return {
                "summary": parsed.get("summary", ""),
                "keywords": parsed.get("keywords", []),
            }
    except Exception as e:
        logger.error(f"Summarization failed: {e}")

    # Fallback: combine first and last event summaries
    fallback_summary = (
        f"Events from '{events[0].get('summary', '')}' "
        f"to '{events[-1].get('summary', '')}'"
    )
    fallback_keywords = list(
        set(e.get("type", "").replace(":", " ").split()[0] for e in events if e.get("type"))
    )
    return {"summary": fallback_summary, "keywords": fallback_keywords}


# ── Page Building ─────────────────────────────────────


def build_pages(user_id: str) -> dict:
    """
    Build pages from unassigned events for a user.

    Returns { pagesBuilt: int, errors: int }
    """
    from bson import ObjectId

    try:
        db = get_db()
        event_log = db["eventlogs"]
        page_summary = db["pagesummaries"]

        # Find unassigned events
        unassigned = list(
            event_log.find({"userId": ObjectId(user_id), "pageIndex": -1})
            .sort("timestamp", 1)
        )

        if len(unassigned) < PAGE_SIZE:
            return {"pagesBuilt": 0, "unassigned": len(unassigned)}

        # Find next page index
        last_page = page_summary.find_one(
            {"userId": ObjectId(user_id)},
            sort=[("pageIndex", -1)],
        )
        next_page_index = (last_page["pageIndex"] + 1) if last_page else 0

        pages_built = 0
        errors = 0

        # Process in chunks of PAGE_SIZE
        for i in range(0, len(unassigned) - PAGE_SIZE + 1, PAGE_SIZE):
            chunk = unassigned[i : i + PAGE_SIZE]
            page_idx = next_page_index + pages_built
            ids = [e["_id"] for e in chunk]

            try:
                # 1. Assign events to page in MongoDB
                event_log.update_many(
                    {"_id": {"$in": ids}},
                    {"$set": {"pageIndex": page_idx}},
                )

                # 2. Summarize with Mistral
                result = summarize_events(chunk)
                summary = result["summary"]
                keywords = result["keywords"]

                # 3. Time range
                time_from = chunk[0].get("timestamp")
                time_to = chunk[-1].get("timestamp")
                pinecone_id = f"{user_id}__page_{page_idx}"

                # 4. Create PageSummary in MongoDB
                page_doc = page_summary.insert_one(
                    {
                        "userId": ObjectId(user_id),
                        "pageIndex": page_idx,
                        "eventCount": len(chunk),
                        "timeRange": {"from": time_from, "to": time_to},
                        "summary": summary,
                        "keywords": keywords,
                        "pineconeId": pinecone_id,
                        "createdAt": datetime.now(timezone.utc),
                    }
                )

                # 5. Embed + Pinecone upsert
                time_from_str = time_from.isoformat() if time_from else ""
                time_to_str = time_to.isoformat() if time_to else ""

                embedded = embed_and_store(
                    pinecone_id=pinecone_id,
                    text=summary,
                    metadata={
                        "userId": user_id,
                        "pageIndex": page_idx,
                        "timeFrom": time_from_str,
                        "timeTo": time_to_str,
                        "eventCount": len(chunk),
                        "keywords": ",".join(keywords),
                    },
                )

                # 6. Update embeddedAt
                if embedded:
                    page_summary.update_one(
                        {"_id": page_doc.inserted_id},
                        {"$set": {"embeddedAt": datetime.now(timezone.utc)}},
                    )
                    logger.info(f"Page {page_idx} for user {user_id[-6:]}: summarized + embedded → {pinecone_id}")
                else:
                    logger.warning(f"Page {page_idx} for user {user_id[-6:]}: summarized but embed failed")

                pages_built += 1

            except Exception as e:
                logger.error(f"Page {page_idx} for user {user_id[-6:]} failed: {e}")
                # Rollback: unassign events
                event_log.update_many(
                    {"_id": {"$in": ids}},
                    {"$set": {"pageIndex": -1}},
                )
                errors += 1

        if pages_built > 0:
            logger.info(f"Built {pages_built} pages for user {user_id[-6:]} ({errors} errors)")

        return {"pagesBuilt": pages_built, "errors": errors}
    except Exception as e:
        logger.error(f"Failed to build pages for {user_id}: {e}")
        return {"pagesBuilt": 0, "errors": 1}
