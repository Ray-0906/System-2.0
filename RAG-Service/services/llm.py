"""
Centralized LLM configuration.

All AI service files import their models from here instead of
managing their own clients. To switch providers, change the env vars:
  CHAT_MODEL_PROVIDER=mistral  (default)
  GENERATION_MODEL_PROVIDER=mistral

ponytail: Only Mistral is implemented. To add OpenAI/Anthropic, add
an elif branch in _create_chat_model() and install the provider package.
"""

from __future__ import annotations

import os
import logging
from functools import lru_cache

from langchain_mistralai import ChatMistralAI

logger = logging.getLogger("rag.llm")

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")


def _require_key():
    if not MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY not set")


@lru_cache(maxsize=1)
def get_chat_model() -> ChatMistralAI:
    """Small/fast model for chat, summarization, and page building."""
    _require_key()
    model = os.environ.get("CHAT_MODEL", "mistral-small-latest")
    logger.info(f"Chat model: {model}")
    return ChatMistralAI(
        model_name=model,
        mistral_api_key=MISTRAL_API_KEY,
        temperature=0.6,
        max_tokens=1024,
    )


@lru_cache(maxsize=1)
def get_generation_model() -> ChatMistralAI:
    """Large/accurate model for structured mission generation."""
    _require_key()
    model = os.environ.get("GENERATION_MODEL", "mistral-large-latest")
    logger.info(f"Generation model: {model}")
    return ChatMistralAI(
        model_name=model,
        mistral_api_key=MISTRAL_API_KEY,
        temperature=0.6,
        max_tokens=1500,
    )
