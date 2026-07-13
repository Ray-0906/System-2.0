"""
Summarize Service — Condenses old chat messages into a rolling summary.

Used to preserve long-term conversational memory after the 30-day TTL
deletes raw messages from MongoDB. The summary persists forever.
"""

import logging
from langchain_core.messages import HumanMessage
from services.llm import get_chat_model

logger = logging.getLogger("rag.summarize")


def summarize_chat_history(
    messages: list[dict],
    existing_summary: str = "",
) -> str:
    """
    Condense a batch of chat messages into a short summary paragraph.
    If an existing summary is provided, the new summary incorporates it.

    The result is a rolling summary that carries forward the key topics,
    preferences, and patterns the player has discussed.
    """
    conversation = "\n".join(
        f"{'Player' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
        for m in messages
    )

    prompt = f"""Summarize the following conversation between a player and their AI Growth Assistant in a gamified self-improvement app. 

Focus on:
- Key topics discussed (stats, missions, goals, concerns)
- Player preferences and patterns mentioned
- Advice given and commitments made
- Any emotional context (frustrated, motivated, curious)

Keep it under 200 words. Write in third person ("The player...").

{"## Previous Summary (incorporate this context):" + chr(10) + existing_summary + chr(10) if existing_summary else ""}
## Conversation to Summarize:
{conversation}

## Summary:"""

    try:
        response = get_chat_model().invoke([HumanMessage(content=prompt)])
        summary = response.content.strip()
        logger.info(f"Summarized {len(messages)} messages → {len(summary)} chars")
        return summary

    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return existing_summary or "No conversation history available."
