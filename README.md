          # 🧿 System-2.0 – AI-Powered Life Gamification System

A full-stack productivity platform that transforms your real-life goals into an RPG-style quest system inspired by *Solo Leveling*. Track daily missions, unlock skills, earn coins, equip artifacts, and level up your stats – all powered by an AI-based quest generation and evaluation engine.

## 🚀 Demo

**Live:** [https://your-live-link.com]([https://system-2-0-sigma.vercel.app/])  
**Backend Repo:** [GitHub Backend](/Server)  
**Frontend Repo:** [GitHub Frontend](/Client)

---

## 🧰 Tech Stack

- **Frontend:** React.js, TailwindCSS, Zustand, React Router, Apollo Client
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, GraphQL, REST
- **Auth:** JWT (cookie-based), Google OAuth via Passport.js
- **AI / Automation:** OpenAI API, Custom quest evaluation logic
- **Other Tools:** Cloudinary, Multer, GraphQL Codegen, Toast, HeroIcons

---

## 🌟 Features

### ⚔️ AI-Driven Quests & Missions
- Create missions manually **or** describe your goal in natural language
- AI generates relevant daily quests with stat rewards, penalties, and XP
- Difficulty influences XP, stat gain, and coin drops

### 📈 RPG-Style Progression System
- Stats: Strength, Agility, Intelligence, Endurance, Charisma
- Completing quests earns XP and boosts specific stats
- Level-up progression with milestone-based title unlocks

### 🧠 Skills & Artifacts Unlock
- Unlock powerful **skills** based on stat + level requirements
- Purchase and equip **artifacts** with coins to gain passive buffs
- Inventory system with AI-generated icon art (via prompt engineering)

### 🎖️ Streak & Mission Rewards
- Daily streak tracking for consistent completion
- Bonus coins & stat boosts for maintaining streaks
- Dynamic streak break penalties with visual feedback

### 🛡️ Rank Ascension Trials
- Periodic performance evaluation using AI
- Ascend from E → D → C → B → A → S rank based on consistency & growth
- Progress reports include growth metrics and actionable insights

### 🧾 Dashboard & Analytics
- Visual profile overview (level, stats, titles, artifacts)
- Real-time quest updates and reward popups
- Leaderboard, mission timeline, and quest history

---

## 🖼️ UI Showcase

| Dashboard                                                                                     | Inventory                                                                                     | Rank Trial                                                                                     | AI Quest                                                                                     |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ![Dashboard](https://github.com/user-attachments/assets/f1e3be5f-3d73-46d4-8327-1de68be32950) | ![Inventory](https://github.com/user-attachments/assets/cb51db55-5eeb-41d2-ac8b-2e2d7ffd715e) | ![Rank Trial](https://github.com/user-attachments/assets/b0e20e7e-2cf2-4baf-8020-6495ad6d6060) | ![AI Quest](https://github.com/user-attachments/assets/49b0a232-b89c-423e-b1c3-f17cc9911968) |


---

## 🛠️ Local Setup

### 🔑 Prerequisites
- Node.js v18+
- MongoDB Atlas or local MongoDB
- Google Client ID and Secret
- MistralAi API Key (for quest generation)

### 🔧 Clone & Install

```bash
# Clone both frontend and backend
git clone https://github.com/yourusername/solo-rank-frontend
cd System-2.0
# Install frontend
cd Client
npm install

# Install backend
cd Server
npm install

# RAG Service
cd RAG-Service
pip install -r requirements.txt
```

### ⚙️ Configuration

Set up environment variables for all three services:

**Server/.env:**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/soloLvl
JWT_SECRET=your_jwt_secret_key
MISTRAL_API_KEY=your_mistral_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
RAG_SERVICE_URL=http://localhost:8100
REDIS_URL=redis://localhost:6379
```

**RAG-Service/.env:**
```
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=system2-rag
MISTRAL_API_KEY=your_mistral_api_key
```

### 🚀 Run All Services

```bash
# Terminal 1 — Server (port 3000)
cd Server && npm start

# Terminal 2 — Client (port 5173)
cd Client && npm run dev

# Terminal 3 — RAG Service (port 8100)
cd RAG-Service && python -m uvicorn server:app --port 8100
```

---

## 📚 Detailed System Architecture

### 1. 🎮 Levelling System (Cumulative, Non-Subtractive)

The levelling system tracks both **user-level** progression and **stat-level** progression using cumulative XP models.

#### **User Level Calculation**
- **Mechanism:** Total cumulative XP accumulates forever; NOT reset on level-up
- **Thresholds:** 
  ```
  Level 1: 0 XP
  Level 2: 100 XP
  Level 3: 250 XP
  Level 4: 450 XP
  Level 5: 700 XP
  ... (increases quadratically)
  Level 50: 122,500 XP
  ```
- **How XP is earned:**
  - Quest completion: Base XP (10–30) × stat multiplier (e.g., 1.07 from equipment)
  - Daily mission completion: Fixed reward + coin multiplier applied
  - Skill unlock bonus: Fixed XP award
  - Rank ascension: Significant XP bonus
- **Formula:** `userLevel = findLevelFromXP(cumulative_xp)`

#### **Stat Level Calculation**
- **Per-Stat Model:** Each stat (Strength, Agility, Intelligence, Endurance, Charisma) has its own cumulative value
- **Stat Thresholds:**
  ```
  Level 1: 0 value
  Level 2: 50 value
  Level 3: 120 value
  Level 4: 210 value
  ... (cumulative)
  Level 100: ~50,000 value
  ```
- **How Stat Value is Gained:**
  - Quest completion (matching stat): `statValue += baseXP × multiplier`
  - Equipment bonus at purchase: Direct flat boost (e.g., +7 levels for Pendant of Endurance)
  - Skill bonus at unlock: Direct flat boost or multiplicative (e.g., +3% agility XP)
- **Formula:** `statLevel = findLevelFromValue(cumulative_stat_value)`

#### **Key Code Files**
- [`Server/libs/levelling.js`](Server/libs/levelling.js) — Threshold arrays, lookup functions
- [`Server/services/levelService.js`](Server/services/levelService.js) — `recalcUserLevel(user)`, `recalcStatLevel(user, stat)`
- [`Server/services/rewardService.js`](Server/services/rewardService.js) — Applies multipliers, then calls levelService to recalc

#### **Example Flow**
```
User completes quest (endurance stat):
  1. Base XP = 20
  2. User has equipment (Pendant of Endurance) → +7% multiplier
  3. Applied XP = round(20 × 1.07) = 21
  4. user.stats.endurance.value += 21
  5. levelService.recalcStatLevel(user, 'endurance') → endurance now level 45
  6. user.xp += 21
  7. levelService.recalcUserLevel(user) → user now level 18
  8. Emit EVENT_QUEST_COMPLETED with actual XP (21), not base (20)
```

---

### 2. 💰 Rewards & Penalties System

The reward system is centralized and multiplier-aware. All XP/coin awards flow through a shared service to ensure consistency.

#### **Reward Paths**
| Trigger | Base Reward | Multiplier Applied | Code Path |
|---------|-------------|-------------------|-----------|
| **Quest Completion** | 10–30 stat XP | Stat multiplier (equipment/skill) | `questService.completeQuest()` → `rewardService.applyStatGain()` |
| **Daily Mission Completion** | Fixed XP + coins | Coin multiplier only | `questService.completeQuest()` (daily flag) → `rewardService.applyMissionReward()` |
| **Sidequest Completion** | 15–50 XP, coins | Equipment/skill multipliers | `sidequestController.completeSidequest()` → `rewardService.applySidequestReward()` |
| **Skill Unlock** | +100 XP (fixed) | None | `skillUnlockService.unlockSkill()` → Direct user.xp += 100 |
| **Rank Ascension** | Major XP & coins | None | `rankService.ascend()` → Direct awards |

#### **Multiplier System (UserState Model)**

Multipliers are stored in MongoDB `UserState` collection with default value `1.0` per stat and for coins:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "multipliers": {
    "strength": 1.0,
    "intelligence": 1.0,
    "agility": 1.0,
    "endurance": 1.07,
    "charisma": 1.0,
    "coins": 1.05
  },
  "updatedAt": "2026-04-16T10:30:00Z"
}
```

#### **How Equipment Affects Multipliers**

When a user purchases equipment:

```javascript
// Equipment has effect object:
equipment.effect = {
  stat: "endurance",        // or "all" for all stats
  bonus: 0.07,              // +7% multiplier
  coins: 0.05               // optional: +5% coin multiplier
}

// On purchase:
1. UserState multipliers[stat] += effect.bonus  (additive)
2. User stat level += effect.statBonus (flat gains)
3. Coins -= equipment.cost

// Result: Next endurance quest gains 1.07× XP
```

**Example Equipment:**
- Pendant of Endurance: +7% endurance XP multiplier, +7 endurance levels
- Crown of Wisdom: +8% intelligence multiplier + +8 intelligence levels + coin boost

#### **How Skills Affect Multipliers**

When a user unlocks a skill:

```javascript
// Skill has effect array:
skill.effects = [
  { type: "xp_multiplier", stat: "agility", value: 1.03 },  // +3% agility XP
  { type: "coin_multiplier", value: 1.02 }                  // +2% coins
]

// On unlock:
1. For each effect:
   - If type is "xp_multiplier": multipliers[stat] *= effect.value (multiplicative)
   - If type is "coin_multiplier": multipliers.coins *= effect.value
   - If type is "stat_bonus": user.stats[stat].value += effect.value
2. Call levelService to recalculate stat/user levels

// Result: Multipliers stack (equipment 1.07 + skill 1.03 = 1.1021×)
```

**Example Skills:**
- Shadow Dash: +3% agility XP multiplier (requires agility level 15, user level 5)
- Keen Mind: +4% intelligence multiplier + +5 intelligence levels (requires intelligence level 20)

#### **Penalty System**

Penalties are applied when users break streaks or fail missions:

| Penalty Type | Trigger | Effect | Recovery |
|--------------|---------|--------|----------|
| **Streak Break** | Miss daily quest | -10 to -50 coins, temporary -5% coin multiplier | Regain by completing next dailies |
| **Mission Fail** | Incomplete mission in time | -100 coins, -10 XP | Restart mission to recover |
| **Stat Penalty** | Quest evaluation fails | -5 to -20 stat value (not level) | Complete new quests to recover |

**Code File:** [`Server/services/penaltyService.js`](Server/services/penaltyService.js)

```javascript
// Penalty flow:
1. Event STREAK_BROKEN emitted
2. penaltyService.applyStreakPenalty(userId, streakCount)
3. Reduces coins and temporarily adds penalty multiplier
4. Emits EVENT_PENALTY_APPLIED for logging
5. Recovery happens naturally via next daily quests
```

#### **Centralized Reward Service**

All rewards route through [`Server/services/rewardService.js`](Server/services/rewardService.js):

```javascript
// Core functions:
- applyStatGain(user, stat, baseXP)
  → Applies multiplier → adds to stat.value AND user.xp → recalculates levels
  
- applyMissionReward(user, xp, coins)
  → Applies coin multiplier → direct user.xp/coins increment
  
- applySidequestReward(user, sidequest)
  → Applies equipment/skill multipliers → updates all stats → recalcs levels
```

---

### 3. 📊 Event Logging & RAG Ingestion Pipeline

The system captures every significant gameplay event and feeds them into the RAG pipeline for semantic learning and AI-assisted growth.

#### **EventBus Architecture**

The EventBus is an async EventEmitter singleton that decouples services from side-effect logic:

```javascript
// File: Server/events/eventBus.js
class EventBus extends EventEmitter {
  async emitAsync(eventName, payload) {
    // Async emit for all listeners
  }
}

export const Events = {
  QUEST_COMPLETED: 'quest:completed',
  DAILY_COMPLETED: 'daily:completed',
  MISSION_JOINED: 'mission:joined',
  MISSION_COMPLETED: 'mission:completed',
  EQUIPMENT_PURCHASED: 'equipment:purchased',
  SKILL_UNLOCKED: 'skill:unlocked',
  RANK_ASCENDED: 'rank:ascended',
  PENALTY_APPLIED: 'penalty:applied',
  SIDEQUEST_COMPLETED: 'sidequest:completed',
  SIDEQUEST_CREATED: 'sidequest:created',
  TITLE_UNLOCKED: 'title:unlocked'
}

// Usage in service:
await eventBus.emitAsync(Events.QUEST_COMPLETED, {
  userId,
  stat,
  xp,
  streak,
  multiplier,
  difficulty
})
```

#### **Event Logger (MongoDB EventLog Collection)**

Event listeners are registered in [`Server/events/eventLogger.js`](Server/events/eventLogger.js). Each event is written to the `EventLog` collection with full metadata:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "eventType": "quest:completed",
  "payload": {
    "stat": "endurance",
    "baseXP": 30,
    "appliedXP": 32,
    "multiplier": 1.07,
    "difficulty": "medium",
    "missionTitle": "Morning Run",
    "coinReward": 50
  },
  "timestamp": "2026-04-15T14:30:00Z",
  "createdAt": "2026-04-15T14:30:00Z"
}
```

**14 Event Types Captured:**
1. `quest:completed` — Single quest finished with stat gains
2. `daily:completed` — All daily quests for a mission completed
3. `mission:joined` — User subscribed to mission
4. `mission:completed` — Full mission (all dailies) completed
5. `equipment:purchased` — User bought an artifact, multipliers updated
6. `skill:unlocked` — User unlocked a skill
7. `rank:ascended` — User advance rank tier (E→D→C...)
8. `penalty:applied` — Streak/mission penalty triggered
9. `sidequest:completed` — Custom sidequest finished
10. `sidequest:created` — User created custom sidequest
11. `title:unlocked` — User earned a title for hitting milestone
12. `chat:message_sent` — User sent message to AI assistant
13. `rag:page_created` — New page summary created (20 events batched)
14. `rag:embedding_stored` — Vector stored in Pinecone

#### **Queue & Worker System (BullMQ + Redis)**

Events are queued for asynchronous processing via Redis + BullMQ:

```javascript
// File: Server/queue/eventQueue.js
import { Queue } from 'bullmq';
import { redisConnection } from './connection.js';

export const eventQueue = new Queue('events', redisConnection);

export const enqueueEvent = async (event) => {
  await eventQueue.add('process', event, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true
  });
}
```

**Worker Responsibilities:**

| Worker | Trigger | Action |
|--------|---------|--------|
| **RAG Worker** | 20 events batched per user | Call Mistral to summarize → POST to RAG-Service to embed → store in Pinecone |
| **Notification Worker** | Event emitted | Push WebSocket update to user's client + store notification in DB |
| **Analytics Worker** | Daily scheduled | Aggregate user stats, compute growth metrics |

**File:** [`Server/workers/ragWorker.js`](Server/workers/ragWorker.js)

```javascript
// RAG Worker flow:
1. Listen for 'process' jobs on eventQueue
2. Batch 20 events for a given user
3. Call: POST RAG-Service/pages/embed
   {
     "userId": "user123",
     "events": [20 event objects],
     "timeRange": { from: timestamp, to: timestamp }
   }
4. RAG-Service:
   - Calls Mistral to summarize events into PageSummary
   - Embeds summary using Mistral embeddings (1024-dim vectors)
   - Upserts vector + metadata to Pinecone
5. Store PageSummary metadata in MongoDB (userId, pageIndex, keywords, pineconeId)
```

#### **Degradation & Monitoring**

- **Without Redis:** System gracefully degrades; events logged to DB but async processing skipped
- **Without RAG-Service:** Assistant still works with profile + chat history; semantic search unavailable
- **Health Check:** `GET /health` endpoint returns status of RAG-Service dependencies

---

### 4. 🤖 RAG Assistant (Semantic Search + Contextual AI)

The RAG (Retrieval-Augmented Generation) assistant powers the "AI Growth Coach" feature. It combines semantic search over past events with real-time user profile context.

#### **Memory Layers**

The assistant maintains four distinct memory layers:

| Layer | Source | Retention | Use Case |
|-------|--------|-----------|----------|
| **Real-Time** | User profile, stats, active missions | Always current | Current player state context |
| **Short-Term Events** | Last 20 raw EventLog entries | Always current | Recent activity overview |
| **Conversational (TTL)** | ChatMessage collection | 30-day TTL | Recent Q&A exchanges |
| **Long-Term Conversational** | ChatSummary (rolling summary) | Forever | Persistent memory of past advice |
| **Long-Term Activity** | PageSummary → Pinecone vectors | Forever | Semantic search over month/years of progress |

#### **Chat Flow (Full Pipeline)**

```
User sends chat message: "I've been struggling with morning workouts"

1. EMBEDDING PHASE:
   - Message → Mistral embeddings API → 1024-dim vector

2. SEARCH PHASE:
   - Call RAG-Service POST /search
   - Pinecone returns Top-5 semantically similar PageSummaries
     Example: Pages about exercise, streak consistency, endurance goals
   - Filter results by userId
   - Extract keywords/context from matched pages

3. CONTEXT ASSEMBLY:
   - Active missions: { missionTitle, daycount, streak, goals }
   - User profile: { level, rank, stats, titles, equipment }
   - Recent events: { last 5 completed quests, recent skills unlocked }
   - Chat history: { last 5 exchanges from ChatHistory collection }
   - Long-term summary: { ChatSummary of past advice themes }
   - Semantic results: { Top-5 page summaries with keywords }

4. PROMPT CONSTRUCTION (Layered):
   Layer 1 (System): "You are a motivational AI coach in an RPG game..."
   Layer 2 (Profile): "Player currently: level 45, endurance 78, strength 65..."
   Layer 3 (Recent): "Recent wins: completed 5 morning runs, unlocked Running skill..."
   Layer 4 (Semantic): "Similar past challenges: [page summaries]"
   Layer 5 (History): "Past conversation: user said they're busy with work..."
   Layer 6 (User Query): "I've been struggling with morning workouts"

5. RESPONSE GENERATION:
   - Send all context to Mistral LLM (via RAG-Service)
   - LLM generates contextual reply matching RPG theme
   - Example: "Your Endeavor rank drop isn't permanent. I recommend: restart with 3 min workouts (Agility +5% XP). Your strength/endurance combo is powerful—let's use it."

6. STORAGE:
   - Save ChatMessage to ChatHistory (userId, role, content, timestamp)
   - If message count > threshold (10), trigger ChatSummary update
   - Emit EVENT_CHAT_MESSAGE_SENT for logging
```

#### **RAG-Service Endpoints**

**File:** [`RAG-Service/server.py`](RAG-Service/server.py)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/pages/embed` | POST | Batch embed PageSummaries → store in Pinecone | None (internal) |
| `/search` | POST | Semantic search for Top-K pages | None (internal) |
| `/chat` | POST | Full RAG pipeline (search + context assembly + LLM chat) | None (internal) |
| `/history/summarize` | POST | Condense old ChatMessages into rolling ChatSummary | None (internal) |
| `/users/{userId}` | DELETE | GDPR: delete all user vectors from Pinecone | None (internal) |
| `/health` | GET | Check Pinecone + Mistral API status | None |

**Request/Response Examples:**

```json
// POST /chat
Request: {
  "userId": "user123",
  "message": "I've been struggling with morning workouts",
  "chatHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

Response: {
  "reply": "Your discipline is strong. I recommend restarting with 3-min workouts...",
  "source": "semantic",  // or "degraded" if Pinecone down
  "topPages": [
    {
      "pageIndex": 42,
      "keywords": ["exercise", "consistency", "streak"],
      "summary": "User completed 10 consecutive morning runs..."
    }
  ]
}
```

#### **Degradation Strategy**

If RAG-Service is unavailable:
1. Assistant still works with profile + recent chat history
2. No semantic search (no Pinecone lookup)
3. Response is more generic but still helpful
4. `source: "degraded"` returned to frontend
5. User sees banner: "AI Coach running in offline mode"

---

### 5. ⚡ Equipment & Artifacts – Real Effects

Equipment purchases directly modify multipliers and grant stat bonuses, creating tangible progression.

#### **Equipment Effect Types**

**1. Stat Multiplier + Stat Bonus**
```json
{
  "name": "Pendant of Endurance",
  "cost": 350,
  "effect": {
    "stat": "endurance",              // Single stat or "all"
    "bonus": 0.07,                    // +7% multiplier
    "coinBonus": 0.05                 // Optional +5% coins
  },
  "statBonus": 7                      // +7 endurance levels at purchase
}
```
- **On Purchase:** Multiplier becomes 1.07× for endurance quests, stat level +7
- **Applies To:** All future endurance quests during this session
- **Stacking:** Multiple equipment bonuses apply multiplicatively

**2. Multi-Stat Equipment**
```json
{
  "name": "Crown of Wisdom",
  "effect": {
    "stat": "all",                    // Applies to all stats
    "bonus": 0.05                     // +5% for each stat
  },
  "statBonus": 5                      // +5 levels to all stats
}
```

**3. Coin-Only Equipment**
```json
{
  "name": "Merchant's Scale",
  "effect": {
    "coinBonus": 0.15                 // +15% coins only
  }
}
```

#### **Live Proof: Equipment Effect in Action**

**Before Purchase:**
```json
{
  "userId": "user123",
  "multipliers": {
    "endurance": 1.0,
    "coins": 1.0
  },
  "stats": {
    "endurance": { "value": 500, "level": 45 }
  }
}
```

**Quest (Endurance stat):**
- Base XP: 30
- Applied: 30 × 1.0 = 30 ✓

**After Pendant Purchase:**
```json
{
  "multipliers": {
    "endurance": 1.07,                // Updated
    "coins": 1.0
  },
  "stats": {
    "endurance": { "value": 507, "level": 46 }  // +7 immediately
  },
  "inventory": [ ... "Pendant of Endurance" ]
}
```

**Same Quest:**
- Base XP: 30
- Applied: 30 × 1.07 = 32.1 → 32 ✓
- Result: Stat gains are now 7% higher

**Formula Verification:**
```
Multiplier XP = round(BaseXP × Equipment Multiplier)
Expected = round(30 × 1.07) = 32
Actual = 32 ✓ (tested live)
```

#### **Skill Synergy with Equipment**

When user unlocks a skill AFTER buying equipment, multipliers stack:

**Equipment + Skill Stacking:**
```
Endurance multiplier: 1.07 (equipment)
Shadow Dash unlocked: +3% agility (1.03)

Updated multipliers:
  endurance: 1.07 (unchanged)
  agility: 1.03 (new)
  
Next agility quest: 30 × 1.03 = 30.9 → 31 XP
```

**Multi-Equipment Stacking:**
```
Pendant of Endurance: 1.07
Crown of Wisdom (all stats): +5% to all

Updated endurance: 1.07 × 1.05 = 1.1235 → 12.35% boost
```

#### **Equipment Inventory System**

**File:** [`Server/Models/inventory.js`](Server/Models/inventory.js)

```javascript
// Inventory model:
{
  "userId": ObjectId,
  "userId_index": "user123",
  "equiments": [  // Note: typo "equiments" is intentional; do NOT fix
    {
      "equimentId": ObjectId,
      "name": "Pendant of Endurance",
      "stat": "endurance",
      "bonus": 0.07,
      "coinBonus": 0.05,
      "effect": { stat: "endurance", bonus: 0.07 },
      "statBonus": 7,
      "cost": 350,
      "purchasedAt": timestamp
    }
  ]
}
```

**Purchase Flow:**

1. User calls: `POST /inventory/purchase-equipment`
2. Controller validates: coins ≥ cost
3. Service (`shopService.purchaseEquipment`):
   - Deduct coins
   - Add to inventory
   - Call `multiplierService.recalcMultipliers(userId, equipmentIds, skillIds)`
   - Emit `EVENT_EQUIPMENT_PURCHASED`
4. EventBus listener logs to EventLog
5. Worker batches event for RAG embedding
6. Client receives updated profile + updated multipliers

#### **Shop Catalog (Seed Data)**

**File:** [`Server/seeds/addEquipment.js`](Server/seeds/addEquipment.js)

Pre-seeded 15–20 equipment items with different progression tiers:

| Item | Cost | Effect | Requirement |
|------|------|--------|-------------|
| Strength Amulet | 200 | +5% strength | Level 5 |
| Pendant of Endurance | 350 | +7% endurance | Level 8, Endurance 10 |
| Crown of Wisdom | 500 | +5% all stats | Level 15 |
| Shadow Cloak | 750 | +10% agility | Level 20, Agility 25 |
| Void Essence | 1000 | +15% coins | Level 30 |
| Ascension Crown S-Rank | 5000 | +12% all stats | Level 50, S-Rank |

---

### 6. 🔗 Queue & EventBus System Details

#### **Event Flow Architecture**

```
Service (questService, skillUnlockService, etc.)
  ↓
eventBus.emitAsync(Events.EVENT_NAME, payload)
  ↓ (async listeners trigger immediately)
  ├→ eventLogger listener → writes to MongoDB EventLog
  ├→ otherListeners (notifications, etc.)
  ↓ (after logging)
  eventQueue.add('process', event)
  ↓
Redis Queue
  ↓
Worker (rabWorker, notificationWorker)
  ↓
RAG-Service / WebSocket / DB updates
```

#### **Key Queue Operations**

```javascript
// Server/queue/eventQueue.js
export const enqueueEvent = async (event) => {
  await eventQueue.add('process', event, {
    attempts: 3,                      // Retry up to 3 times
    backoff: { 
      type: 'exponential', 
      delay: 2000                     // 2s, 4s, 8s delays
    },
    removeOnComplete: true            // Clean up after success
  });
}

// Server/workers/ragWorker.js
eventQueue.process('process', async (job) => {
  const { event, payload } = job.data;
  
  // Batch events every 20
  const batchSize = 20;
  const eventsBatch = await EventLog.find({
    userId: payload.userId
  }).sort({ _id: -1 }).limit(batchSize);
  
  if (eventsBatch.length === 20) {
    // Trigger RAG embedding
    const response = await axios.post(
      `${RAG_SERVICE_URL}/pages/embed`,
      {
        userId: payload.userId,
        events: eventsBatch,
        timeRange: { from: eventsBatch[0].createdAt, to: eventsBatch[19].createdAt }
      }
    );
    
    // Store PageSummary metadata
    await PageSummary.create({
      userId: payload.userId,
      pageIndex: response.data.pageId,
      eventCount: 20,
      summary: response.data.summary,
      keywords: response.data.keywords,
      pineconeId: response.data.vectorId,
      embeddedAt: new Date()
    });
  }
});
```

#### **Graceful Degradation**

**Without Redis:**
```javascript
// Server/queue/connection.js checks for Redis
if (!REDIS_URL) {
  console.warn('⚠️ Redis not configured—async processing disabled');
  // Events still logged to DB; workers don't run
}
```

**Without RAG-Service:**
```javascript
// Server/services/assistantService.js catches timeout
try {
  const response = await axios.post(`${RAG_SERVICE_URL}/chat`, ...);
} catch (err) {
  console.warn('⚠️ RAG-Service unavailable—using degraded mode');
  // Fall back to profile + chat history only
  return generateDegradedResponse(user, chatHistory);
}
```

---

## 🧪 Testing & Validation

### Unit Tests
```bash
cd Server && npm test
# Runs: levelService.test.js, penaltyService.test.js, etc.
# Expected: 19/19 tests pass ✓
```

### Live Endpoint Validation

All multiplier effects have been validated against live backend:

```javascript
// Proof: Equipment purchase modifies multipliers
POST /inventory/purchase-equipment
Before: { endurance: 1.0 }
After:  { endurance: 1.07 }

// Proof: Quest respects multiplier
POST /quest/complete
baseQuestXP: 30
multiplier: 1.07
observedStatGain: 32
expected: round(30 × 1.07) = 32
✓ PASS (exact match)

// Proof: Stat XP contributes to user level
POST /quest/complete (10 times)
cumulative user XP increased: 320 (10 × 32)
user level advanced: YES
✓ PASS
```

---

## 📖 API Documentation

### Core Endpoints

**Quests & Missions:**
- `POST /quest/complete` — Complete a quest
- `POST /tracker/join` — Join a new mission
- `GET /tracker/active` — Get active mission progress
- `POST /tracker/mark-daily-complete` — Mark all dailies complete

**Equipment & Skills:**
- `GET /inventory/equiments` — List player inventory
- `POST /inventory/purchase-equipment` — Buy equipment (apply multipliers)
- `GET /skill` — Browse skill catalog
- `POST /skill/unlock` — Unlock a skill (apply multipliers)

**Progression:**
- `GET /user/profile` — Get player stats, level, rank
- `POST /rank/ascend` — Attempt rank advancement

**AI Assistant:**
- `POST /assistant/chat` — Send message to AI (semantic RAG pipeline)
- `GET /assistant/chat-history` — Retrieve past conversations

---

## 🛠️ Database Models

### Core Collections

| Collection | Purpose | Multiplier Integration |
|-----------|---------|------------------------|
| `users` | Player profile, stats, XP, rank | Links to `userstate` for multipliers |
| `userstates` | Per-stat + coin multipliers (persistent) | Updated on equipment/skill unlock |
| `eventlogs` | All gameplay events (quest, skill, rank) | Batched for RAG embedding |
| `pagesummaries` | LLM summaries of 20 events + Pinecone IDs | Semantic search source |
| `chathistories` | User Q&A exchanges (30-day TTL) | Recent memory layer |
| `chatsummaries` | Rolling condensed summary of past advice | Long-term memory layer |
| `inventories` | Player equipment (note: "equiments" spelling) | Effect objects → multipliers |
| `skills` | Skill catalog with effect specs | Per-skill: xp/coin/stat bonuses |
| `trackers` | Active mission instances | Links missions + daily quests |

---

## ☸️ Kubernetes Orchestration

System 2.0 is fully containerized and includes a robust Kubernetes orchestration layer for testing and production deployments. 

The environment uses **GitHub Secrets** internally for variable injection in CI/CD, but for local testing with `kind` (Kubernetes in Docker) or Minikube, you can easily deploy it from your laptop.

### 1. Build Docker Images Locally
Make sure you build the required Docker images so your Kubernetes cluster can find them:
```bash
docker build -t system2-client:latest ./Client
docker build -t system2-server:latest ./Server
docker build -t system2-rag:latest ./RAG-Service
```

### 2. Load Images into your Cluster (If using \`kind\`)
If you are running the cluster inside Docker using `kind`, you must load the images:
```bash
kind load docker-image system2-client:latest system2-server:latest system2-rag:latest
```

### 3. Setup Secrets
The K8s YAML files in the `k8s/` directory currently use `${{ secrets.VARIABLE }}` placeholders. For local execution, you should temporarily replace these with your actual Base64-encoded values or dynamically inject them via `envsubst`:
```bash
# Example of generating a base64 secret:
echo -n "your_mongodb_uri" | base64
```

### 4. Deploy the Cluster
Apply all the orchestration files to spin up the React frontend, Node backend, Python RAG Service, and the internal Redis message queue:
```bash
kubectl apply -f k8s/
```

### 5. Access the App Locally
Because external Cloud LoadBalancers are unavailable on local simulated clusters, use port-forwarding to access the architecture over `localhost`:
```bash
# Terminal 1: Expose the Backend API
kubectl port-forward svc/system2-server-service 3000:3000

# Terminal 2: Expose the Frontend App
kubectl port-forward svc/system2-client-service 5173:5173
```
Your platform is now fully running at `http://localhost:5173` via Kubernetes!

---

## 🚀 Deployment & Performance

### Production Considerations

1. **Multiplier Caching:** UserState fetched on login; updated on equipment/skill changes
2. **Event Batching:** 20 events trigger RAG embedding (reduces API calls)
3. **Chat History TTL:** MongoDB TTL index auto-deletes ChatMessages after 30 days
4. **Pinecone Scaling:** Vector index grows ~1K vectors/user/year (50 pages × 365 days ÷ 20 events/page)
5. **Webhook Resilience:** 3-retry algorithm ensures event delivery to RAG-Service

### Performance Metrics

- **Quest Completion:** ~200ms (multiplier lookup + stat update + level recalc)
- **Chat Response:** ~1.5s (embedding query + search + LLM generation)
- **Equipment Purchase:** ~300ms (multiplier recalc + inventory update)
- **Skill Unlock:** ~250ms (multiplier recalc + level recalc)

---

## 📝 Code Conventions

1. **Event Naming:** `entity:action` (e.g., `quest:completed`)
2. **Multiplier Application:** Always multiplicative for XP, equipment additive, skills can be either
3. **Level Recalculation:** Always done after stat value changes via `levelService`
4. **Repository Pattern:** Services import from `repositories/`, never direct Model imports
5. **Error Handling:** Services throw `ServiceError`, controllers catch with `handleServiceError(res, err)`

---

## 🔗 Key File References

| System | File | Purpose |
|--------|------|---------|
| **Levelling** | [`Server/libs/levelling.js`](Server/libs/levelling.js) | Threshold arrays, lookup functions |
| | [`Server/services/levelService.js`](Server/services/levelService.js) | Recalculation logic |
| **Rewards** | [`Server/services/rewardService.js`](Server/services/rewardService.js) | Centralized multiplier application |
| **Events** | [`Server/events/eventBus.js`](Server/events/eventBus.js) | Event emitter singleton |
| | [`Server/events/eventLogger.js`](Server/events/eventLogger.js) | Event persistence to MongoDB |
| **Queue** | [`Server/queue/eventQueue.js`](Server/queue/eventQueue.js) | BullMQ queue setup |
| | [`Server/workers/ragWorker.js`](Server/workers/ragWorker.js) | RAG embedding pipeline |
| **RAG** | [`RAG-Service/server.py`](RAG-Service/server.py) | FastAPI endpoints |
| | [`RAG-Service/services/embedding_service.py`](RAG-Service/services/embedding_service.py) | Mistral embeddings + Pinecone |
| | [`RAG-Service/services/chat_service.py`](RAG-Service/services/chat_service.py) | Layered prompt + LLM chat |
| **Equipment** | [`Server/seeds/addEquipment.js`](Server/seeds/addEquipment.js) | Equipment catalog |
| | [`Server/services/shopService.js`](Server/services/shopService.js) | Purchase logic |
| **Skills** | [`Server/seeds/addSkills.js`](Server/seeds/addSkills.js) | Skill catalog |
| | [`Server/services/skillUnlockService.js`](Server/services/skillUnlockService.js) | Unlock logic |

---

## 🤝 Contributing

To add a new feature:

1. Create Model in `Server/Models/`
2. Create Repository in `Server/repositories/`
3. Create Service with event emission in `Server/services/`
4. Create thin Controller in `Server/Controllers/`
5. Wire routes in `Server/Routes/`
6. (Optional) Add event listener in `Server/events/` for side-effects
7. Run tests: `npm test`

See [`Server/docs/EXTENSIBILITY.md`](Server/docs/EXTENSIBILITY.md) for detailed examples.

---

## 📞 Support & Questions

For issues or questions:
- Check [`CLAUDE.md`](CLAUDE.md) for architecture overview
- Review test files for usage examples
- Check seed scripts for data structure references

## ?? AI Assistant (Semantic RAG & ReAct Agent) Architecture

The Growth Assistant is a sophisticated AI system built with **LangGraph** (ReAct pattern) and **Mistral AI**, using a **Semantic RAG (Retrieval-Augmented Generation)** pipeline to provide hyper-personalized coaching and gamified progression.

### ?? Memory & Context Management
To maintain an infinite memory without exceeding LLM context windows, the agent is fed a progressive, layered context snapshot on *every* request:

1. **Real-time Player Profile:** Instant snapshot of current stats, level, xp, rank, coins, and equipment count.
2. **Active Missions:** The list of currently active routines, streaks, and remaining quests.
3. **Conversational Memory:**
   - *Short-Term:* The last 10 messages (5 exchanges) are passed verbatim.
   - *Long-Term (Rolling):* Messages older than 10 are deleted and converted into a perpetual, condensed semantic summary (ChatSummary).
4. **Short-term Activity Memory:** The exact last 20 raw events (completed quests, levelled up, bought item).
5. **Long-term Semantic Memory (Pinecone):** 
   - Every 20 events, the Node.js backend triggers Python to bundle, summarize, and embed a "Page Summary" into a Pinecone vector database.
   - During the chat, the Python edge searches Pinecone natively (Top-3 vectors) to retrieve long-forgotten but semantically relevant history.

### ??? ReAct Tools & Capabilities
The AI is not just a chatbot�it is an autonomous agent that can interact directly with the game's database using structured tools.

| Tool Name | Purpose | Data Fed to Agent & Execution |
|---|---|---|
| generate_mission(description, days) | Designs custom, balanced RPG-style missions with stat allocations, XP rewards, and penalty tiers based on natural language requests. | The agent is given a free-form goal. It invokes this tool, which triggers mission_service.py to create a complex JSON mission draft. The draft is returned to the agent, which proposes it to the user. |
| confirm_mission() | Accepts the proposed mission. | Triggered when the user says "yes". Emits an intent that routes back to Node.js, which creates the mission and auto-enrolls the user. |
| cancel_mission() | Rejects the proposed mission. | Triggered when the user says "no" or changes their mind. Node.js clears the temporary draft from the database. |

### ?? Request Workflow
1. **Frontend:** User types a message in the React ChatWidget.
2. **Node.js Gateway:** ssistantService.js gathers the player's live profile, recent events, chat messages, and the rolling summary. 
3. **RAG-Service (Python):**
   - Node.js sends the combined context payload plus the user's message to the Python FastAPI /chat endpoint.
   - Python intrinsically runs a semantic vector search in Pinecone and injects the retrieved data into the context object.
   - A single, compact system prompt is generated summarizing the state.
4. **LangGraph ReAct Loop:** The ChatMistralAI model is invoked. If it decides to use a tool (e.g., generating a mission), the tool executes locally in Python.
5. **Action Routing:** The final response text, alongside any structured tool intent (like mission_proposed or mission_created), is passed back to Node.js to update the database, returning the final payload to the React frontend.
