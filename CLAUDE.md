# CLAUDE.md — System 2.0

> A gamified self-improvement app inspired by Solo Leveling. Players complete real-life quests/missions to level up stats, earn equipment, unlock skills, and climb ranks. Includes an AI Growth Assistant powered by Semantic RAG (Pinecone + Mistral).

## Project Structure

```
System-2.0/
├── Client/          → React 19 + Vite frontend (TailwindCSS, Zustand, Apollo)
├── Server/          → Node.js + Express backend (MongoDB, GraphQL, REST)
├── RAG-Service/     → Python FastAPI microservice (Pinecone + Mistral — semantic RAG)
```

## Quick Start

```bash
# Terminal 1 — Server (port 3000)
cd Server && npm install && npm start

# Terminal 2 — Client (port 5173)
cd Client && npm install && npm run dev

# Terminal 3 — RAG Service (port 8100)
cd RAG-Service && pip install -r requirements.txt && uvicorn server:app --port 8100

# One-time setup — Create Pinecone index:
cd RAG-Service && python scripts/create_index.py
```

## Environment Variables

### Server/.env
| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string (database: `soloLvl`) |
| `JWT_SECRET` | JWT signing secret |
| `MISTRAL_API_KEY` | Mistral AI API key (for page summaries) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `CLIENT_URL` | Frontend URL (`http://localhost:5173`) |
| `SERVER_URL` | Backend URL (`http://localhost:3000`) |
| `RAG_SERVICE_URL` | RAG microservice URL (default: `http://localhost:8100`) |
| `REDIS_URL` | Redis connection (optional — queue/workers disabled without it) |

### RAG-Service/.env
| Variable | Purpose |
|---|---|
| `PINECONE_API_KEY` | Pinecone vector DB API key |
| `PINECONE_INDEX` | Pinecone index name (default: `system2-rag`) |
| `MISTRAL_API_KEY` | Mistral AI API key (for embeddings + chat) |

---

## Architecture

### Backend (SOLID Pattern)

```
Routes → Controllers (thin HTTP) → Services (business logic) → Repositories (data access) → Models
                                         ↓
                                    EventBus (async side-effects)
                                    ├── eventLogger → EventLog (feeds RAG pipeline)
                                    └── Future: notifications, analytics
```

### RAG Pipeline (Microservice Architecture)

```
Node.js Server                          RAG-Service (Python FastAPI)
──────────────                           ──────────────────────────
EventBus → EventLog (MongoDB)           
       ↓                                 
ragService.buildPages()                 
  → Groups 20 events                    
  → Mistral summarizes                  
  → POST /pages/embed ──────────────►   embedding_service.embed_and_store()
                                           → Mistral embed (1024-dim)
                                           → Pinecone upsert
User sends chat message                 
  → assistantService.chat()             
    → GET chat history (MongoDB)        
    → POST /search ──────────────────►   embedding_service.semantic_search()
      (semantic similarity via Pinecone)   → embed query → Pinecone top-5
    → Gather all context                 
    → POST /chat ────────────────────►   chat_service.chat()
      (profile + history + events + RAG)   → layered prompt → Mistral LLM
    ← reply                             
    → Save to ChatHistory               
```

**Clean separation:** Node.js handles data, Python handles AI.

### Frontend

- **Router**: React Router v7 with `createBrowserRouter` in `main.jsx`
- **State**: Zustand stores (`userStore`, `trackerStore`, `notificationStore`)
- **Data fetching**: Mixed — Axios for REST, Apollo Client for GraphQL
- **Styling**: TailwindCSS 3 with dark theme (gray-950/black backgrounds, purple/pink accents)
- **Animations**: Framer Motion
- **Lazy loading**: All pages except Home are lazy-loaded via `React.lazy()`

---

## Server Directory Map

| Directory | Contents | Pattern |
|---|---|---|
| `Models/` | Mongoose schemas: `user`, `tracker`, `mission`, `quest`, `skill`, `inventory`, `sidequests`, `title`, `eventLog` (+ PageSummary), `chatHistory` (+ ChatSummary), `userState` | Export named `Model` |
| `Controllers/` | Thin HTTP handlers — parse request, call service, return response | Use `handleServiceError()` in catch blocks |
| `services/` | Core business logic — validation, calculations, event emission. `ragService.js` is the HTTP client to RAG-Service. | Throw `ServiceError` for expected failures |
| `repositories/` | Mongoose queries only — easy to swap ORMs | Export object with methods (`findById`, `findByUser`, etc.) |
| `Routes/` | Express routers — map HTTP verbs to controller functions | All protected routes use `isAuthenticated` middleware |
| `events/` | `eventBus.js` (async EventEmitter) + `eventLogger.js` (writes to EventLog + pushes to queue) | 11 event types registered |
| `queue/` | `connection.js` (shared Redis config) + `eventQueue.js` (BullMQ queue + enqueue helper) | Graceful no-op without Redis |
| `workers/` | `ragWorker.js` (proactive page building) + `notificationWorker.js` (WebSocket push) | Each file = one consumer |
| `socket/` | `socketManager.js` (Socket.io setup, user rooms, emitToUser helper) | JWT-authenticated connections |
| `graphql/` | Apollo Server with `typeDefs.js` + `resolvers.js` — provides dashboard data, user stats, missions | Mounted at `/graphql` |
| `libs/` | Pure utility functions: `generateQuest.js`, `adaptiveQuest.js`, `customMissionGenerator.js`, `levelling.js` | Stateless, testable |
| `utils/` | `ServiceError` class, JWT helpers, error handlers | |
| `seeds/` | `addSkills.js`, `addEquipment.js`, `seedEventLogs.js`, `testRagService.js`, `backfillEmbeddings.js` | Run manually with `node seeds/<file>` |
| `Middlewares/` | `authMiddleware.js` — JWT cookie verification | |
| `config/` | `db.js` — MongoDB connection | |

## RAG-Service Directory Map

```
RAG-Service/
├── server.py                  → FastAPI app, all endpoints
├── services/
│   ├── embedding_service.py   → Mistral embeddings + Pinecone upsert/search
│   ├── chat_service.py        → Layered prompt assembly + Mistral LLM chat
│   └── summarize_service.py   → Rolling chat history summarization
├── models/
│   └── schemas.py             → Pydantic request/response models
├── scripts/
│   └── create_index.py        → One-time Pinecone index creation
├── requirements.txt
└── .env
```

### RAG-Service API

| Endpoint | Method | Purpose |
|---|---|---|
| `/pages/embed` | POST | Embed a page summary → store in Pinecone |
| `/search` | POST | Semantic search → Top-K relevant pages |
| `/chat` | POST | Full RAG chat (context → prompt → Mistral → reply) |
| `/history/summarize` | POST | Condense old chat messages into rolling summary |
| `/users/{userId}` | DELETE | GDPR — delete all user vectors from Pinecone |
| `/health` | GET | Health check (Pinecone + Mistral status) |

## Client Directory Map

| Directory | Contents |
|---|---|
| `pages/` | 14 page components: `Home`, `Dashboard`, `Login`, `Signup`, `Activemissions`, `MissionDetails`, `newMission`, `addCustomMission`, `Inventory`, `Skills`, `Ascension`, `Leaderboard`, `Sidequests`, `DemoDash` |
| `components/` | Shared UI: `sidebar`, `ChatWidget`, `MissionCard`, `Skillcard`, `equimentCard`, `Hero`, `Features`, `CtaFooter`, `Loading`, `ProtectedRoute`, `AuthLayout` |
| `store/` | Zustand stores: `userStore` (auth + profile), `trackerStore` (missions), `notificationStore` |
| `utils/` | `axios.js` (interceptor with auth), `apollo.js` (Apollo client), `userLoader.js`, `processQuestres.js`, `trackerUtils.js`, `levelling.js`, `Notification.jsx`, `cn.js` |
| `graphql/` | GQL queries and mutations |

---

## Data Model (Key Entities)

### User
```
level, xp, rank (E→S), coins, stats {strength, intelligence, agility, endurance, charisma}
skills[], equiments[], titles[], trackers[], completed_trackers[], sidequests[]
```

### Tracker (active mission instance)
```
userId, missionId, title, duration, daycount, streak, remainingQuests[], completedQuests[]
```

### PageSummary (RAG page — 20 events each)
```
userId, pageIndex, eventCount, timeRange {from, to}
summary (LLM-generated), keywords[], pineconeId, embeddedAt
```

### ChatMessage (30-day TTL) + ChatSummary (persists forever)
```
ChatMessage: { userId, role, content, timestamp } — auto-deleted after 30 days
ChatSummary: { userId (unique), summary, lastUpdatedAt, messagesCovered } — rolling condensed memory
```

### Stats
Each stat has `value` (XP) and `level`. XP thresholds increase per level. Equipment/artifacts give instant level boosts.

### Rank Progression
E → D → C → B → A → S. Requires all stats at minimum levels + player level thresholds.

---

## EventBus Events

All events are emitted via `eventBus.emitAsync(Events.EVENT_NAME, payload)`.

| Event | Payload | Emitted From |
|---|---|---|
| `quest:completed` | `{userId, stat, xp, streak}` | `questService` |
| `daily:completed` | `{userId, daycount, streak, xp, coins}` | `trackerService` |
| `mission:completed` | `{userId, missionTitle, duration}` | `trackerService` |
| `mission:joined` | `{userId, missionTitle}` | `missionService` |
| `equipment:purchased` | `{userId, itemName, cost, effect}` | `shopService` |
| `skill:unlocked` | `{userId, skillName}` | `skillUnlockService` |
| `rank:ascended` | `{userId, oldRank, newRank, xpReward, coinReward}` | `rankService` |
| `penalty:applied` | `{userId, type, statPenalty, coinPenalty}` | `penaltyService` |
| `sidequest:completed` | `{userId, title, difficulty, stat}` | `sidequestController` |
| `sidequest:created` | `{userId, title, difficulty, stat}` | `sidequestController` |
| `title:unlocked` | `{userId, title}` | `titleController` |

---

## AI Assistant (Semantic RAG)

### How It Works
1. **Events** → `eventLogger` → `EventLog` collection (MongoDB)
2. **Page Building** → ragService groups 20 events → Mistral summarizes → RAG-Service embeds → Pinecone stores vector
3. **Chat Query** → embed user message → Pinecone Top-5 similarity search → filter by userId
4. **Context Assembly** → profile + chat history + recent events + semantic results → layered system prompt
5. **Response** → Mistral LLM generates reply → saved to ChatHistory

### Memory Architecture
| Memory Type | Source | Retention |
|---|---|---|
| Real-time | Player profile, stats, active missions | Always current |
| Short-term | Last 20 raw events | Always current |
| Conversational | ChatMessage (last 5 exchanges) | 30-day TTL |
| Long-term conversational | ChatSummary (rolling condensed summary) | Forever |
| Long-term activity | PageSummary → Pinecone (semantic search) | Forever |

### API: `POST /assistant/chat` → `{ message }` → `{ reply, source }`
- `source: 'semantic'` — full pipeline worked
- `source: 'degraded'` — RAG-Service was down, only profile + recent events used

---

## API Routes

| Prefix | Auth | Purpose |
|---|---|---|
| `/auth` | No | Login, signup, Google OAuth, logout, verification |
| `/mission` | Yes | Browse catalog, join missions |
| `/tracker` | Yes | Daily quest management, mark complete, mission progress |
| `/quest` | Yes | Complete individual quests |
| `/inventory` | Yes | Browse/purchase equipment |
| `/skill` | Yes | View/unlock skills |
| `/rank` | Yes | Check rank eligibility, ascend |
| `/sidequest` | Yes | Create/complete custom sidequests |
| `/titles` | Yes | View/equip titles |
| `/user` | Yes | Profile, stats, leaderboard |
| `/assistant` | Yes | AI chat (POST /chat) |
| `/graphql` | No* | Apollo Server — dashboard queries |

---

## Code Conventions

1. **ES Modules** throughout (both `Client/` and `Server/` use `"type": "module"`)
2. **Named exports** for models (`export const User`), services, repositories
3. **Default exports** for routes, components, pages
4. **ServiceError pattern**: Services throw `ServiceError(message, statusCode)`, controllers catch with `handleServiceError(res, err)`
5. **EventBus decoupling**: Never import side-effect logic into services directly. Emit an event, add a listener in `events/`
6. **Repository pattern**: Services import from `repositories/`, never import Models directly
7. **Thin controllers**: Max ~20 lines. Parse req, call service, send res. No business logic.
8. **Zustand stores**: Client state management. `userStore` handles auth, `trackerStore` handles mission data
9. **GraphQL + REST coexistence**: GraphQL for complex reads (dashboard), REST for mutations
10. **TailwindCSS dark theme**: `bg-gray-950`, `bg-black`, purple/pink gradient accents
11. **Note the typo**: Equipment is spelled `equiments` (without the 'p') in the User model and throughout the codebase. **Do not fix this** — it would break the database.

## How to Add a New Feature

1. Create Model in `Models/`
2. Create Repository in `repositories/`
3. Create Service in `services/` (emit events via EventBus)
4. Create thin Controller in `Controllers/`
5. Create Route in `Routes/`
6. Wire route in `index.js`: `app.use('/prefix', isAuthenticated, newRoutes)`
7. (Optional) Add event listener in `events/` for side-effects
8. (Optional) Add logger entry in `events/eventLogger.js` for AI context

See `Server/docs/EXTENSIBILITY.md` for detailed examples.

## Testing

```bash
cd Server && npm test  # Vitest
```

## Seeding Data

```bash
# Uncomment in index.js or run directly:
node seeds/addSkills.js         # Seed skill catalog
node seeds/addEquipment.js      # Seed equipment catalog
node seeds/seedEventLogs.js     # Seed 60 demo events for AI testing
node seeds/backfillEmbeddings.js # Embed existing pages into Pinecone
node seeds/testRagService.js    # Test AI assistant with demo questions
```
