"""
Chat Service — Builds layered prompts and calls Mistral LLM.

Prompt assembly order (priority):
  1. System persona
  2. Player profile (real-time stats)
  3. Active missions
  4. Chat summary (condensed older history)
  5. Chat history (recent exchanges)
  6. Recent events (last 20 raw)
  7. Semantic context (Top-K page summaries)
  8. Instructions
"""

import os
import logging
from mistralai.client import Mistral

logger = logging.getLogger("rag.chat")

CHAT_MODEL = "mistral-small-latest"

_client: Mistral | None = None


def get_client() -> Mistral:
    global _client
    if _client is None:
        api_key = os.environ.get("MISTRAL_API_KEY", "")
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY not set")
        _client = Mistral(api_key=api_key)
    return _client


def build_system_prompt(
    user_profile: str,
    active_missions: str,
    chat_summary: str,
    chat_history: list[dict],
    recent_events: list[str],
    semantic_context: list[dict],
) -> str:
    """
    Assemble the layered system prompt.
    Each layer adds progressively deeper context.
    """

    # ── Layer 1: Persona ──
    prompt = """You are the **Growth Assistant** for "System 2.0" — a gamified self-improvement app inspired by Solo Leveling. You are the player's personal AI coach and analyst.

"""

    # ── Layer 2: Real-time player state ──
    prompt += f"""## Player Profile (Real-Time)
{user_profile}

## Active Missions
{active_missions}

"""

    # ── Layer 3: Conversation memory ──
    if chat_summary:
        prompt += f"""## Conversation Summary (Older History)
{chat_summary}

"""

    if chat_history:
        history_text = "\n".join(
            f"{'Player' if m['role'] == 'user' else 'You'}: {m['content']}"
            for m in chat_history
        )
        prompt += f"""## Recent Conversation
{history_text}

"""

    # ── Layer 4: Short-term memory (raw events) ──
    if recent_events:
        events_text = "\n".join(f"• {e}" for e in recent_events)
        prompt += f"""## Recent Activity (Latest First)
{events_text}

"""

    # ── Layer 5: Long-term semantic memory ──
    if semantic_context:
        ctx_text = "\n".join(
            f"• [{c.get('timeFrom', '?')[:10]} → {c.get('timeTo', '?')[:10]}] "
            f"(relevance: {c.get('score', 0):.0%}) {c.get('summary', '')}"
            for c in semantic_context
        )
        prompt += f"""## Historical Context (Semantically Retrieved)
{ctx_text}

"""

    # ── Layer 6: Instructions ──
    prompt += """## Your Role
- Analyze the player's progress, patterns, and habits using ALL the data above
- Give specific, data-driven growth suggestions — never generic advice
- Answer questions about their missions, stats, streaks, equipment, skills
- Suggest missions aligned with their weakest stats or stated goals
- Reference specific events, dates, and numbers when available
- Be motivating and encouraging — you're their personal growth coach
- Keep responses concise (2-4 paragraphs max)
- Use game terms naturally (XP, level up, rank, streak, quest)
- If asked about something not in the data, say so honestly
- When conversation history exists, maintain continuity (understand "that", "it", etc.)"""

    return prompt


def chat(
    user_profile: str,
    active_missions: str,
    chat_history: list[dict],
    chat_summary: str,
    recent_events: list[str],
    semantic_context: list[dict],
    message: str,
) -> str:
    """
    Run the full chat pipeline: build prompt → call Mistral → return reply.
    """
    client = get_client()

    system_prompt = build_system_prompt(
        user_profile=user_profile,
        active_missions=active_missions,
        chat_summary=chat_summary,
        chat_history=chat_history,
        recent_events=recent_events,
        semantic_context=semantic_context,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    logger.info(
        f"Chat request: {len(system_prompt)} char prompt, message: '{message[:80]}...'"
    )

    try:
        response = client.chat.complete(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.6,
            max_tokens=1024,
        )
        reply = response.choices[0].message.content
        logger.info(f"Chat response: {len(reply)} chars")
        return reply

    except Exception as e:
        logger.error(f"Mistral chat error: {e}")
        raise RuntimeError(f"Chat completion failed: {e}")
