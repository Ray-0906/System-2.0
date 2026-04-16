"""
RAG-Service — Semantic RAG Microservice for System 2.0

A standalone FastAPI service that handles all AI operations:
  - Pinecone vector storage and semantic search
  - Mistral embeddings (1024-dim)
  - Mistral LLM chat completion with layered prompts
  - Chat history summarization for long-term memory

Run:
  pip install -r requirements.txt
  uvicorn server:app --port 8100

The Node.js server calls this service via HTTP.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import logging
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    EmbedPageRequest, EmbedPageResponse,
    SearchRequest, SearchResponse, SearchResult,
    ChatRequest, ChatResponse,
    SummarizeRequest, SummarizeResponse,
    HealthResponse,
)
from services import embedding_service, chat_service, summarize_service, page_builder
from workers.event_consumer import start_consumer

# ── Logging ───────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("rag.server")


def _resolve_allowed_origins() -> list[str]:
    """Build allowed origins from env; avoid wildcard by default."""
    raw = os.environ.get(
        "RAG_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173",
    )
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:3000", "http://localhost:5173"]


def verify_internal_request(x_rag_secret: str | None = Header(default=None)):
    """Optional shared-secret protection for internal service endpoints."""
    expected = os.environ.get("RAG_SERVICE_SECRET", "")
    if expected and x_rag_secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ── App ───────────────────────────────────────────────
app = FastAPI(
    title="System 2.0 RAG Service",
    description="Semantic RAG microservice — Pinecone + Mistral",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup ───────────────────────────────────────────

@app.on_event("startup")
async def startup():
    """Start the Redis event consumer in a background thread."""
    start_consumer()
    logger.info("RAG-Service ready")


# ── Endpoints ─────────────────────────────────────────

@app.post("/pages/embed", response_model=EmbedPageResponse)
async def embed_page(req: EmbedPageRequest, _: None = Depends(verify_internal_request)):
    """
    Embed a page summary and store its vector in Pinecone.
    Called by Node.js after building a page from 20 events.
    """
    pinecone_id = f"{req.userId}__page_{req.pageIndex}"

    try:
        success = embedding_service.embed_and_store(
            pinecone_id=pinecone_id,
            text=req.summary,
            metadata={
                "userId": req.userId,
                "pageIndex": req.pageIndex,
                "timeFrom": req.timeFrom,
                "timeTo": req.timeTo,
                "eventCount": req.eventCount,
                "keywords": ",".join(req.keywords),
            },
        )

        if not success:
            raise HTTPException(500, "Failed to store vector in Pinecone")

        return EmbedPageResponse(
            success=True,
            pineconeId=pinecone_id,
            dimensions=embedding_service.EMBED_DIMENSIONS,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embed page error: {e}")
        raise HTTPException(500, f"Embedding failed: {str(e)}")


@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest, _: None = Depends(verify_internal_request)):
    """
    Semantic search for a user's most relevant page summaries.
    Returns Top-K results sorted by similarity score.
    """
    try:
        results = embedding_service.semantic_search(
            query=req.query,
            user_id=req.userId,
            top_k=req.topK,
        )

        return SearchResponse(
            results=[
                SearchResult(
                    pageIndex=r["pageIndex"],
                    summary=r["summary"],
                    score=r["score"],
                    timeFrom=r.get("timeFrom", ""),
                    timeTo=r.get("timeTo", ""),
                )
                for r in results
            ]
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        # Graceful degradation — return empty results, don't crash
        return SearchResponse(results=[])


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, _: None = Depends(verify_internal_request)):
    """
    Full RAG chat — receives assembled context from Node.js,
    builds layered prompt, calls Mistral LLM, returns reply.
    """
    try:
        reply = chat_service.chat(
            user_profile=req.userProfile,
            active_missions=req.activeMissions,
            chat_history=[{"role": m.role, "content": m.content} for m in req.chatHistory],
            chat_summary=req.chatSummary,
            recent_events=req.recentEvents,
            semantic_context=[
                {
                    "summary": c.summary,
                    "score": c.score,
                    "timeFrom": c.timeFrom,
                    "timeTo": c.timeTo,
                }
                for c in req.semanticContext
            ],
            message=req.message,
        )

        return ChatResponse(reply=reply, source="semantic")

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, f"Chat failed: {str(e)}")


@app.post("/history/summarize", response_model=SummarizeResponse)
async def summarize_history(req: SummarizeRequest, _: None = Depends(verify_internal_request)):
    """
    Condense old chat messages into a rolling summary.
    Called periodically by Node.js when messages exceed 30 days.
    """
    try:
        summary = summarize_service.summarize_chat_history(
            messages=[{"role": m.role, "content": m.content} for m in req.messages],
            existing_summary=req.existingSummary,
        )
        return SummarizeResponse(summary=summary)

    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(500, f"Summarization failed: {str(e)}")


@app.delete("/users/{user_id}")
async def delete_user(user_id: str, _: None = Depends(verify_internal_request)):
    """Delete all vectors for a user (GDPR compliance)."""
    try:
        count = embedding_service.delete_user_vectors(user_id)
        return {"deleted": count, "userId": user_id}
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        raise HTTPException(500, f"Deletion failed: {str(e)}")


@app.post("/pages/build/{user_id}")
async def build_pages(user_id: str, _: None = Depends(verify_internal_request)):
    """
    HTTP safety net — trigger page building for a user.
    Called by Node.js assistantService as a fallback if Redis missed events.
    """
    try:
        result = page_builder.build_pages(user_id)
        return result
    except Exception as e:
        logger.error(f"Build pages error: {e}")
        raise HTTPException(500, f"Page building failed: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check — reports Pinecone and Mistral status."""
    return HealthResponse(
        status="ok",
        pinecone=embedding_service.is_pinecone_healthy(),
        mistral=embedding_service.is_mistral_healthy(),
    )
