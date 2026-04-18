"""
Pydantic request/response models for the RAG-Service API.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal


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
    userId: str
    message: str
    semanticContext: list[SearchResult] = []
    hasPendingMission: bool = False


class ChatAction(BaseModel):
    type: str
    mission: Optional[dict] = None
    days: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    source: str = "semantic"
    action: Optional[ChatAction] = None


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


# ── Mission Generation ────────────────────────────────

class MissionQuest(BaseModel):
    title: str
    statAffected: Literal['strength', 'intelligence', 'agility', 'endurance', 'charisma']
    xp: int = Field(ge=1, le=50)


class MissionReward(BaseModel):
    xp: int = Field(ge=50, le=500)
    coins: int = Field(ge=10, le=100)
    specialReward: Optional[Literal['common', 'rare', 'epic']] = None


class MissionPenaltyTier(BaseModel):
    coins: int = Field(ge=0)
    stats: int = Field(ge=0)


class MissionPenalty(BaseModel):
    missionFail: MissionPenaltyTier
    skip: MissionPenaltyTier


class MissionGenerationRequest(BaseModel):
    description: str = Field(min_length=10)
    days: int = Field(ge=1, le=30)


class CustomMissionGenerationRequest(BaseModel):
    quests: list[str] = Field(default_factory=list)
    days: int = Field(ge=1, le=30)


class MissionGenerationResponse(BaseModel):
    title: str
    refinedDescription: str
    quests: list[MissionQuest]
    reward: MissionReward
    penalty: MissionPenalty
    rank: Literal['E', 'D', 'C', 'B', 'A', 'S']


# ── Assistant Action Routing ─────────────────────────

class AssistantActionRequest(BaseModel):
    message: str = Field(min_length=1)
    userProfile: str = ""
    activeMissions: str = "No active missions."
    hasPendingMissionAction: bool = False


class AssistantActionResponse(BaseModel):
    action: Literal['none', 'propose_mission', 'confirm_mission', 'cancel_mission'] = 'none'
    missionPrompt: Optional[str] = None
    days: Optional[int] = Field(default=None, ge=1, le=30)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
