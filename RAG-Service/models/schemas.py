"""
Pydantic request/response models for the RAG-Service API.
"""
from pydantic import BaseModel, Field
from typing import Optional


# ── Page Embedding ────────────────────────────────────

class EmbedPageRequest(BaseModel):
    userId: str
    pageIndex: int
    summary: str
    keywords: list[str] = []
    timeFrom: str  # ISO datetime
    timeTo: str    # ISO datetime
    eventCount: int = 0


class EmbedPageResponse(BaseModel):
    success: bool
    pineconeId: str
    dimensions: int = 1024


# ── Semantic Search ───────────────────────────────────

class SearchRequest(BaseModel):
    userId: str
    query: str
    topK: int = 5


class SearchResult(BaseModel):
    pageIndex: int
    summary: str
    score: float
    timeFrom: str = ""
    timeTo: str = ""


class SearchResponse(BaseModel):
    results: list[SearchResult]


# ── Chat ──────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    userProfile: str
    activeMissions: str = "No active missions."
    chatHistory: list[ChatMessage] = []
    chatSummary: str = ""
    recentEvents: list[str] = []
    semanticContext: list[SearchResult] = []
    message: str


class ChatResponse(BaseModel):
    reply: str
    source: str = "semantic"


# ── History Summarization ─────────────────────────────

class SummarizeRequest(BaseModel):
    messages: list[ChatMessage]
    existingSummary: str = ""


class SummarizeResponse(BaseModel):
    summary: str


# ── Health ────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    pinecone: bool
    mistral: bool
