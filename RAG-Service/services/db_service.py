import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

_client = None
_db = None

def get_db():
    global _client, _db
    if _client is None:
        mongo_uri = os.environ.get("MONGO_URI")
        if not mongo_uri:
            raise RuntimeError("MONGO_URI not set")
        _client = AsyncIOMotorClient(mongo_uri)
        # Parse database name from URI, default to soloLvl
        # Assuming URI like mongodb+srv://.../soloLvl
        db_name = mongo_uri.split('/')[-1].split('?')[0]
        if not db_name:
            db_name = "soloLvl"
        _db = _client[db_name]
    return _db

async def build_user_context(user_id: str) -> tuple[str, str]:
    db = get_db()
    import asyncio
    user_obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

    # Fetch user and trackers in parallel
    user_task = db.users.find_one({"_id": user_obj_id})
    trackers_task = db.trackers.find({"userId": user_obj_id}).to_list(length=100)
    
    user, trackers = await asyncio.gather(user_task, trackers_task)

    if not user:
        return ("", "No active missions.")

    stats_list = []
    stats = user.get("stats", {})
    for stat_name, data in stats.items():
        stats_list.append(f"{stat_name}: Level {data.get('level', 1)}, XP {data.get('value', 0)}")
    stats_str = " | ".join(stats_list)

    active_missions_list = []
    for t in trackers:
        title = t.get("title", "Unknown")
        daycount = t.get("daycount", 0)
        duration = t.get("duration", 0)
        streak = t.get("streak", 0)
        remaining = len(t.get("remainingQuests", []))
        active_missions_list.append(f'"{title}" — Day {daycount}/{duration}, Streak {streak}, {remaining} quests remaining')
    active_missions_str = "\n  ".join(active_missions_list) or "No active missions."

    equip_count = len(user.get("equiments", []))
    skill_count = len(user.get("skills", []))
    completed_count = len(user.get("completed_trackers", []))

    profile = f'''Username: {user.get("username", "Unknown")}
Level: {user.get("level", 1)} | XP: {user.get("xp", 0)} | Rank: {user.get("rank", "E")} | Coins: {user.get("coins", 0)}
Stats: {stats_str}
Equipment owned: {equip_count} | Skills unlocked: {skill_count}
Missions completed: {completed_count} | Active missions: {len(trackers)}
Titles: {", ".join(user.get("titles", [])) if user.get("titles") else "None"}'''

    return profile, active_missions_str

async def get_chat_history(user_id: str) -> dict:
    db = get_db()
    import asyncio
    user_obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    
    messages_cursor = db.chatmessages.find({"userId": user_obj_id}).sort([("timestamp", -1), ("_id", -1)]).limit(10)
    
    messages_task = messages_cursor.to_list(length=10)
    summary_task = db.chatsummaries.find_one({"userId": user_obj_id})

    messages, summary_doc = await asyncio.gather(messages_task, summary_task)
    messages.reverse()
    
    out_messages = [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in messages]

    summary = summary_doc.get("summary", "") if summary_doc else ""
    
    return {
        "messages": out_messages,
        "summary": summary
    }

async def get_recent_events(user_id: str, limit: int = 20) -> list[str]:
    db = get_db()
    user_obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    
    cursor = db.eventlogs.find({"userId": user_obj_id}).sort("timestamp", -1).limit(limit)
    events = await cursor.to_list(length=limit)
    events.reverse()  # Oldest first locally or you can just return
    
# In Node.js, we returned summaries. Let's return the string summaries of the events.
    return [e.get("summary", "") for e in events]
