"""
Mission service — generates structured missions inside the RAG service.

The Node server keeps validation and persistence. This service only:
  1. Calls Mistral with a structured prompt
  2. Validates the JSON output with Pydantic
  3. Returns the normalized mission payload
"""

from __future__ import annotations

import json
import logging
import os
import re
from functools import lru_cache

from langchain_core.messages import HumanMessage
from langchain_mistralai import ChatMistralAI

from models.schemas import (
    CustomMissionGenerationRequest,
    MissionGenerationResponse,
    MissionQuest,
)

logger = logging.getLogger("rag.mission")

MISSION_MODEL = "mistral-large-latest"


@lru_cache(maxsize=1)
def get_client() -> ChatMistralAI:
    api_key = os.environ.get("MISTRAL_API_KEY", "")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY not set")
    return ChatMistralAI(
        model_name=MISSION_MODEL,
        mistral_api_key=api_key,
        temperature=0.6,
        max_tokens=1500,
    )


def _escape_curly_braces(text: str) -> str:
    return text.replace("{", "{{").replace("}", "}}").replace("{{{{", "{{").replace("}}}}", "}}")


def _schema_text() -> str:
    return json.dumps(MissionGenerationResponse.model_json_schema(), indent=2)


def _extract_json(content: str) -> str:
    match = re.search(r"```json\n([\s\S]*?)\n```", content)
    if match:
        return match.group(1).strip()
    content = content.strip()
    if not content.startswith("{") or not content.endswith("}"):
        raise ValueError("Output is not valid JSON")
    return content


def _call_mistral(prompt_text: str) -> str:
    response = get_client().invoke([HumanMessage(content=prompt_text)])
    return response.content or ""


def _parse_and_validate(content: str) -> dict:
    json_text = _extract_json(content)
    parsed = json.loads(json_text)
    mission = MissionGenerationResponse.model_validate(parsed)
    return mission.model_dump()


def _build_description_prompt(description: str, days: int) -> str:
    return f"""
You are a mission generator for a life gamification app like Solo Leveling. Your task is to generate a structured JSON response based on the user's input description and number of days.

Inputs:
- Raw user description: {description}
- Number of days: {days}

Instructions:
1. Refine the user's raw description into a polished, concise mission description (50-100 words).
2. Generate a mission title (5-10 words) that summarizes the mission.
3. Generate 1-4 unique daily quests. Each quest MUST have:
   - title: A short, actionable task name (5-15 words)
   - statAffected: Exactly one of: strength, intelligence, agility, endurance, charisma
   - xp: A positive integer (1-50 based on quest difficulty)
4. Set a rank from: E, D, C, B, A, S (S is hardest), based on mission difficulty.
5. Set mission rewards scaled with difficulty:
   - xp: A positive integer (50-500 based on rank, sum of quest XP or higher)
   - coins: A positive integer (10-100 based on rank)
   - specialReward: "common", "rare", or "epic" for ranks B, A, S; null for E, D, C
6. Generate penalties based on mission rank:
   - missionFail: {{ coins: number, stats: number }}
   - skip: {{ coins: number, stats: number }}
7. Ensure ALL fields in the schema are included.
8. Output MUST be valid JSON wrapped in a markdown code block (```json\n<your_json>\n```).

The JSON MUST strictly follow this schema:
{_escape_curly_braces(_schema_text())}

Example output for reference:
```json
{{
  "title": "Fitness Journey",
  "refinedDescription": "Embark on a week-long fitness quest to boost endurance and strength.",
  "quests": [
    {{ "title": "Run 5km daily", "statAffected": "endurance", "xp": 50 }},
    {{ "title": "Complete 20 push-ups", "statAffected": "strength", "xp": 30 }}
  ],
  "reward": {{ "xp": 100, "coins": 20, "specialReward": null }},
  "penalty": {{
    "missionFail": {{ "coins": 10, "stats": 2 }},
    "skip": {{ "coins": 5, "stats": 1 }}
  }},
  "rank": "D"
}}
```
""".strip()


def _build_custom_prompt(quests: list[str], days: int) -> str:
    quests_json = json.dumps(quests, indent=2)
    return f"""
You are a mission generator for a life gamification app like Solo Leveling. Your task is to generate a structured JSON response based on the provided quests and number of days. The quest titles MUST NOT be changed and no extra quests should be added.

Inputs:
- Quests: {quests_json}
- Number of days: {days}

Instructions:
1. Generate a mission title (5-10 words) that summarizes the provided quests.
2. Refine the quests into a polished, concise mission description (50-100 words) based on the given quests.
3. Use the provided quests as-is (do not modify titles or add new quests) but generate `statAffected` and `xp` for each. Each quest MUST have:
   - title: The EXACT title provided.
   - statAffected: Exactly one of: strength, intelligence, agility, endurance, charisma
   - xp: A positive integer (1-50 based on quest difficulty)
4. Set a rank from: E, D, C, B, A, S.
5. Set mission rewards scaled with difficulty.
6. Generate penalties based on mission rank.
7. Ensure ALL fields in the schema are included.
8. Output MUST be valid JSON wrapped in a markdown code block (```json\n<your_json>\n```).

The JSON MUST strictly follow this schema:
{_escape_curly_braces(_schema_text())}

Example output for reference:
```json
{{
  "title": "Fitness Challenge",
  "refinedDescription": "Complete a week-long fitness challenge to enhance strength and endurance.",
  "quests": [
    {{ "title": "Run 5km daily", "statAffected": "endurance", "xp": 50 }},
    {{ "title": "Complete 20 push-ups", "statAffected": "strength", "xp": 30 }}
  ],
  "reward": {{ "xp": 100, "coins": 20, "specialReward": null }},
  "penalty": {{
    "missionFail": {{ "coins": 10, "stats": 2 }},
    "skip": {{ "coins": 5, "stats": 1 }}
  }},
  "rank": "D"
}}
```
""".strip()


def generate_mission_from_description(description: str, days: int) -> dict:
    if not isinstance(description, str) or len(description.strip()) < 10:
        raise ValueError("Description must be at least 10 characters long.")
    if not isinstance(days, int) or days < 1 or days > 30:
        raise ValueError("Days must be between 1 and 30.")

    prompt_text = _build_description_prompt(description.strip(), days)
    content = _call_mistral(prompt_text)
    return _parse_and_validate(content)


def generate_custom_mission(quests: list[str], days: int) -> dict:
    if not quests:
        raise ValueError("Quests must be a non-empty array.")
    if not isinstance(days, int) or days < 1 or days > 30:
        raise ValueError("Days must be between 1 and 30.")

    prompt_text = _build_custom_prompt(quests, days)
    content = _call_mistral(prompt_text)
    return _parse_and_validate(content)

def upgrade_quests(quests: list[dict]) -> dict:
    if not quests:
        raise ValueError("Quests must be a non-empty array.")
    
    quests_json = json.dumps(quests)
    prompt = f"""You are a quest designer for a Solo Leveling-style gamification app. Based on the following quests, create upgraded versions with increased difficulty, keeping the original titles as a base and aligning with fitness goals. Do not add new quests, only upgrade the existing ones. Output a JSON array of objects, each with 'title', 'statAffected', and 'xp' (1-50), reflecting a harder challenge. Quests: {quests_json}
Example: If a quest is "20 push-ups" (strength, 20 xp), upgrade to "30 push-ups" (strength, 30 xp) or "10 advanced pike push-ups" (strength, 35 xp)."""

    content = _call_mistral(prompt)
    json_text = _extract_json(content)
    parsed = json.loads(json_text)
    
    validated_quests = []
    for q in parsed:
        quest = MissionQuest.model_validate(q)
        validated_quests.append(quest.model_dump())
        
    return {"quests": validated_quests}