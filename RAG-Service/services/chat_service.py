"""
Chat Service — LangChain agent-based growth assistant.

Simple request/response flow:
  1. Build a system prompt from player state
  2. Run create_agent() with mission tools
  3. Extract reply + any tool artifacts
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain.agents import create_agent
from services import mission_service
from services.llm import get_chat_model

logger = logging.getLogger("rag.chat")

MAX_HISTORY_MESSAGES = 6
MAX_RECENT_EVENTS = 8
MAX_SEMANTIC_RESULTS = 3


def _limit(items: list, limit: int):
    return items[:limit] if items else []


# ── Tools ─────────────────────────────────────────────

@tool(response_format="content_and_artifact")
def generate_mission(description: str, days: int) -> tuple[str, dict]:
    """Call this tool to design and generate a new mission for the user based on their goals.
    You MUST inform the user about the generated mission and ask for confirmation.
    """
    try:
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


# ── System Prompt ─────────────────────────────────────

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

    recent_events = "\n".join(f"• {event}" for event in _limit(state.get("recent_events", []), MAX_RECENT_EVENTS))

    prompt = f"""You are the **Growth Assistant** for System 2.0 — a gamified self-improvement app inspired by Solo Leveling.
You are the player's personal AI coach and analyst.

## Player Profile (Real-Time)
{state.get('user_profile', '')}

## Active Missions
{state.get('active_missions', 'No active missions.')}

## Conversation Summary (Older History)
{state.get('chat_summary', '') or 'No stored summary.'}

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


# ── Reply Composition ─────────────────────────────────

def _compose_reply(state: dict):
    client = get_chat_model()
    system_prompt = build_system_prompt(state)

    tools = [generate_mission, confirm_mission, cancel_mission]
    agent = create_agent(model=client, tools=tools, system_prompt=system_prompt)

    # Build messages from chat history (system prompt context is separate — no double-feed)
    messages = []
    for msg in _limit(state.get("chat_history", []), MAX_HISTORY_MESSAGES):
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

    # Extract tool artifacts (mission proposals, confirmations, cancellations)
    action = None
    for msg in reversed(out_messages):
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
