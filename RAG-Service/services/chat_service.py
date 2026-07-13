"""
Chat Service — LangChain-based growth assistant.

The assistant stays read-only, but the implementation is intentionally simple:
    1. Build compact context snapshots from the assembled player state
    2. Construct a single prompt from those snapshots
    3. Call the model once for the reply

LangGraph is useful when the assistant needs branches, loops, or tool planning.
For this request/response flow, the graph was adding overhead without benefit.
"""

from __future__ import annotations

import json
import logging
import os

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_mistralai import ChatMistralAI
from langchain.agents import create_agent
from services import mission_service

logger = logging.getLogger("rag.chat")

CHAT_MODEL = "mistral-small-latest"
MAX_HISTORY_MESSAGES = 6
MAX_RECENT_EVENTS = 8
MAX_SEMANTIC_RESULTS = 3



_client: ChatMistralAI | None = None


def get_client() -> ChatMistralAI:
    global _client
    if _client is None:
        api_key = os.environ.get("MISTRAL_API_KEY", "")
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY not set")
        _client = ChatMistralAI(
            model_name=CHAT_MODEL,
            mistral_api_key=api_key,
            temperature=0.6,
            max_tokens=1024,
        )
    return _client


def summarize_player_state(user_profile: str, active_missions: str) -> str:
    """Summarize the player's live status for the assistant."""
    return (
        "Player profile snapshot:\n"
        f"{user_profile}\n\n"
        f"Active missions:\n{active_missions or 'No active missions.'}"
    )


def summarize_memory(
    chat_summary: str,
    chat_history: list[dict],
    recent_events: list[str],
    semantic_context: list[dict],
) -> str:
    """Summarize short-term and long-term memory for the assistant."""
    history_text = "\n".join(
        f"- {'Player' if item.get('role') == 'user' else 'Assistant'}: {item.get('content', '')}"
        for item in chat_history
    ) or "- No recent chat history."

    events_text = "\n".join(f"- {event}" for event in recent_events) or "- No recent events."
    semantic_text = "\n".join(
        f"- [score {entry.get('score', 0):.2f}] {entry.get('summary', '')}"
        for entry in semantic_context
    ) or "- No semantic matches."

    return (
        "Rolling conversation summary:\n"
        f"{chat_summary or 'No stored summary.'}\n\n"
        "Recent chat history:\n"
        f"{history_text}\n\n"
        "Recent events:\n"
        f"{events_text}\n\n"
        "Semantic memory:\n"
        f"{semantic_text}"
    )


def suggest_next_actions(
    user_profile: str,
    active_missions: str,
    recent_events: list[str],
    semantic_context: list[dict],
) -> str:
    """Suggest the next practical actions the assistant should emphasize."""
    signals = []
    profile_lower = user_profile.lower()
    if "endurance" in profile_lower:
        signals.append("endurance")
    if "strength" in profile_lower:
        signals.append("strength")
    if "agility" in profile_lower:
        signals.append("agility")
    if "intelligence" in profile_lower:
        signals.append("intelligence")

    top_signal = signals[0] if signals else "balance"
    event_hint = recent_events[0] if recent_events else "no recent activity"
    semantic_hint = semantic_context[0].get("summary", "") if semantic_context else "no semantic memory"

    return (
        f"Primary focus: {top_signal}. "
        f"Recent signal: {event_hint}. "
        f"Memory cue: {semantic_hint}. "
        f"Active mission context: {active_missions or 'No active missions.'}"
    )


def _limit(items: list, limit: int):
    return items[:limit] if items else []

@tool(response_format="content_and_artifact")
def generate_mission(description: str, days: int) -> tuple[str, dict]:
    """Call this tool to design and generate a new mission for the user based on their goals.
    You MUST inform the user about the generated mission and ask for confirmation.
    """
    try:
        # Enforce limits natively so tool doesn't crash the graph
        parsed_days = max(1, min(30, int(days)))
        if len(description.strip()) < 10:
            description = f"{description.strip()} detailed mission plan"

        mission_dict = mission_service.generate_mission_from_description(description, parsed_days)
        return "Mission structured and returned successfully inside invisible artifact.", {
            "intent": "propose_mission",
            "days": parsed_days,
            "mission": mission_dict
        }
    except Exception as e:
        return f"System Error generating mission: {str(e)}. Tell the user you couldn't generate it.", {}

@tool(response_format="content_and_artifact")
def confirm_mission() -> tuple[str, dict]:
    """Call this tool ONLY when the user explicitly confirms they want to save/add the pending mission proposal."""
    return "Mission confirmed by user.", {"intent": "confirm_mission"}

@tool(response_format="content_and_artifact")
def cancel_mission() -> tuple[str, dict]:
    """Call this tool ONLY when the user rejects or wants to cancel the pending mission draft."""
    return "Mission canceled.", {"intent": "cancel_mission"}


def build_system_prompt(state: dict) -> str:
    """Assemble a compact system prompt from the request state."""
    semantic_context = _limit(state.get("semantic_context", []), MAX_SEMANTIC_RESULTS)

    semantic_block = ""
    if semantic_context:
        semantic_block = "\n".join(
            f"• [{entry.get('timeFrom', '?')[:10]} → {entry.get('timeTo', '?')[:10]}] "
            f"(relevance: {entry.get('score', 0):.0%}) {entry.get('summary', '')}"
            for entry in semantic_context
        )

    chat_history = _limit(state.get("chat_history", []), MAX_HISTORY_MESSAGES)
    history_block = "\n".join(
        f"{'Player' if item.get('role') == 'user' else 'You'}: {item.get('content', '')}"
        for item in chat_history
    )

    recent_events = "\n".join(f"• {event}" for event in _limit(state.get("recent_events", []), MAX_RECENT_EVENTS))

    prompt = f"""You are the **Growth Assistant** for System 2.0 — a gamified self-improvement app inspired by Solo Leveling.
You are the player's personal AI coach and analyst.

## Player Profile (Real-Time)
{state.get('user_profile', '')}

## Active Missions
{state.get('active_missions', 'No active missions.')}

## Tool-Derived Insights
Profile insight:
{state.get('profile_insights', '')}

Memory insight:
{state.get('memory_insights', '')}

Action guidance:
{state.get('mission_guidance', '')}

## Conversation Summary (Older History)
{state.get('chat_summary', '') or 'No stored summary.'}

## Recent Conversation
{history_block or 'No recent conversation.'}

## Recent Activity (Latest First)
{recent_events or 'No recent events.'}

## Historical Context (Semantically Retrieved)
{semantic_block or 'No semantic matches.'}

## Your Role
- Analyze the player's progress, patterns, and habits using ALL the data above
- Give specific, data-driven growth suggestions — never generic advice
- Answer questions about their missions, stats, streaks, equipment, skills
- Suggest missions aligned with their weakest stats or stated goals
- Reference specific events, dates, and numbers when available
- Be motivating and encouraging — you're their personal growth coach
- Keep responses concise (2-4 paragraphs max)
- Use game terms naturally (XP, level up, rank, streak, quest)
- If asked about something not in the data, say so honestly
- When conversation history exists, maintain continuity (understand 'that', 'it', etc.)

**CRITICAL TOOL INSTRUCTIONS:**
  You are a strict tool-calling AI agent. You CANNOT mutate user state or databases through text.
  1. If you are generating, proposing, or refining a mission, YOU MUST ALWAYS CALL the generate_mission tool IMMEDIATELY. DO NOT write out hallucinated missions in text! If you output a mission in text without calling the tool, THE GAME WILL BREAK and the user won't get it.
  2. If there is a pending mission proposal and the user agrees to it, YOU MUST CALL the confirm_mission tool IMMEDIATELY. Saying "it is added" does not add it. The tool adds it!
  3. Never assume a mission is active unless it shows up in "Active Missions" above. If it's not there, they haven't joined it yet.
  """
    if state.get("has_pending_mission"):
        prompt += "\n## Pending Mission Alert\nThere is currently a mission proposal waiting for user confirmation! If the user says 'yes', 'ok', or confirms, ALWAYS call the `confirm_mission` tool. If they reject, call the `cancel_mission` tool.\n"

    return prompt


def _compose_reply(state: dict):
    client = get_client()
    system_prompt = build_system_prompt(state)

    tools = [generate_mission, confirm_mission, cancel_mission]
    agent = create_agent(model=client, tools=tools, system_prompt=system_prompt)

    messages = []
    for msg in state.get("chat_history", []):
        content = msg.get("content", "")
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=state.get("message", "")))

    logger.info("Chat request: %s char prompt, message: '%s...'", len(system_prompt), state.get("message", "")[:80])

    result = agent.invoke({"messages": messages})
    out_messages = result["messages"]
    reply = out_messages[-1].content or ""

    action = None
    for msg in reversed(out_messages):
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for call in reversed(msg.tool_calls):
                intent = call.get("name")
                if intent == "generate_mission":
                    # Tool returns the artifact directly, but the agent's tool_call doesn't have it natively here.
                    # We can fetch the structured output from the ToolMessage that followed it.
                    pass
        
        # Or even simpler, check the ToolMessage directly
        if isinstance(msg, ToolMessage) and msg.artifact:
            artifact = msg.artifact
            intent = artifact.get("intent")
            if intent == "propose_mission":
                action = {
                    "type": "propose_mission",
                    "mission": artifact.get("mission"),
                    "days": artifact.get("days")
                }
                break
            elif intent == "confirm_mission":
                action = {"type": "confirm_mission"}
                break
            elif intent == "cancel_mission":
                action = {"type": "cancel_mission"}
                break

    logger.info("Chat response: %s chars, Action: %s", len(reply), action)
    return {"reply": reply, "action": action}


def chat(
    user_profile: str,
    active_missions: str,
    chat_history: list[dict],
    chat_summary: str,
    recent_events: list[str],
    semantic_context: list[dict],
    message: str,
    has_pending_mission: bool = False,
) -> dict:
    """
    Run the full chat pipeline and return the assistant reply.
    """
    state = {
        "user_profile": user_profile,
        "active_missions": active_missions,
        "chat_history": chat_history,
        "chat_summary": chat_summary,
        "recent_events": recent_events,
        "semantic_context": semantic_context,
        "message": message,
        "has_pending_mission": has_pending_mission,
    }
    return _compose_reply(state)
