"""
Summarize Service — Condenses old chat messages into a rolling summary.

Used to preserve long-term conversational memory after the 30-day TTL
deletes raw messages from MongoDB. The summary persists forever.
"""

import os
import logging
from mistralai.client import Mistral

logger = logging.getLogger("rag.summarize")

_client: Mistral | None = None


def get_client() -> Mistral:
    global _client
    if _client is None:
        api_key = os.environ.get("MISTRAL_API_KEY", "")
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY not set")
        _client = Mistral(api_key=api_key)
    return _client


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
    client = get_client()

    # Format messages for the summarizer
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
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )
        summary = response.choices[0].message.content.strip()
        logger.info(f"Summarized {len(messages)} messages → {len(summary)} chars")
        return summary

    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        # Fallback: return existing summary unchanged
        return existing_summary or "No conversation history available."
