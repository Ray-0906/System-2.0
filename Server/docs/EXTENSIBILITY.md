# System 2.0 — Extensibility Guide

How to add new features without breaking existing code.

## Architecture Overview

```
Routes → Controllers (HTTP only) → Services (business logic) → Repositories (DB)
                                          ↓
                                     EventBus (async)
                                     ├── EventLogger → EventLog (for Semantic RAG → Pinecone)
                                     ├── Future: NotificationService
                                     └── Future: AnalyticsService
```

---

## 1. Adding a New Feature (e.g., Achievements)

### Step 1: Create the Model
```bash
Server/Models/achievement.js
```

### Step 2: Create a Repository
```javascript
// Server/repositories/achievementRepository.js
import { Achievement } from '../Models/achievement.js';

export const achievementRepo = {
  findById: (id) => Achievement.findById(id),
  findByUser: (userId) => Achievement.find({ userId }),
  create: (data) => Achievement.create(data),
};
```

### Step 3: Create a Service
```javascript
// Server/services/achievementService.js
import { ServiceError } from '../utils/serviceError.js';
import { achievementRepo } from '../repositories/achievementRepository.js';
import eventBus, { Events } from '../events/eventBus.js';

export const unlockAchievement = async (userId, achievementId) => {
  // business logic here...
  eventBus.emitAsync('achievement:unlocked', { userId, achievementId });
  return result;
};
```

### Step 4: Create a thin Controller
```javascript
// Server/Controllers/achievementController.js
import { unlockAchievement } from '../services/achievementService.js';
import { handleServiceError } from '../utils/serviceError.js';

export const unlock = async (req, res) => {
  try {
    const result = await unlockAchievement(req.user.id, req.body.achievementId);
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};
```

### Step 5: Create a Route
```javascript
// Server/Routes/achievementRoutes.js
import express from 'express';
import { unlock } from '../Controllers/achievementController.js';
const router = express.Router();
router.post('/unlock', unlock);
export default router;
```

### Step 6: Wire into index.js
```javascript
import achievementRoutes from './Routes/achievementRoutes.js';
app.use('/achievement', isAuthenticated, achievementRoutes);
```

---

## 2. Adding Notifications (WhatsApp, Discord, Email)

Zero changes to controllers or services. Just add a listener:

```javascript
// Server/events/whatsappNotifier.js
import eventBus, { Events } from './eventBus.js';

eventBus.on(Events.MISSION_COMPLETED, async ({ userId, missionTitle }) => {
  // Send WhatsApp message
  await sendWhatsApp(userId, `🎉 You completed "${missionTitle}"!`);
});

eventBus.on(Events.DAILY_COMPLETED, async ({ userId, streak }) => {
  await sendWhatsApp(userId, `🔥 Day streak: ${streak}! Keep going!`);
});
```

Then import once in `index.js`:
```javascript
import './events/whatsappNotifier.js';
```

### Available Events
| Event | When it fires |
|---|---|
| `quest:completed` | Quest finished |
| `daily:completed` | All daily quests done |
| `mission:completed` | Full mission finished |
| `mission:joined` | User joins a mission |
| `equipment:purchased` | Equipment bought |
| `skill:unlocked` | Skill obtained |
| `rank:ascended` | Rank promotion |
| `penalty:applied` | Streak broken |
| `sidequest:completed` | Sidequest finished |
| `sidequest:created` | Sidequest created |
| `title:unlocked` | Title earned |

---

## 3. Adding a New Event Type

### Step 1: Register in eventBus.js
```javascript
// events/eventBus.js → Events object
export const Events = {
  ...existingEvents,
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
};
```

### Step 2: Emit from your service
```javascript
eventBus.emitAsync(Events.ACHIEVEMENT_UNLOCKED, {
  userId, achievementId, name: 'First Blood',
});
```

### Step 3: Add logger for AI context
```javascript
// events/eventLogger.js — add to the summaries object
[Events.ACHIEVEMENT_UNLOCKED]: (d) =>
  `Unlocked achievement "${d.name}".`,
```

The AI assistant will automatically know about this event in future conversations.

---

## 4. Replacing a Component

### Example: Swap Mongoose for Prisma
Only change the repository files:
```javascript
// repositories/userRepository.js
// Before (Mongoose):
import { User } from '../Models/user.js';
export const userRepo = { findById: (id) => User.findById(id) };

// After (Prisma):
import { prisma } from '../config/prisma.js';
export const userRepo = { findById: (id) => prisma.user.findUnique({ where: { id } }) };
```

Services and controllers remain untouched.

### Example: Swap Mistral → OpenAI for the assistant
Only change `RAG-Service/services/chat_service.py` (the LLM lives in the RAG microservice):
```python
# Before:
from mistralai.client import Mistral
client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))
response = client.chat.complete(model="mistral-small-latest", ...)

# After:
from openai import OpenAI
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
response = client.chat.completions.create(model="gpt-4o-mini", ...)
```

Node.js server remains untouched — it only sends HTTP requests to the RAG-Service.

---

## 5. Adding Background Tasks

Use the event bus for non-blocking tasks:

```javascript
// Server/events/analyticsLogger.js
import eventBus, { Events } from './eventBus.js';

eventBus.on(Events.QUEST_COMPLETED, async ({ userId, stat, xp }) => {
  // Heavy analytics processing — non-blocking
  await updateDailyAnalytics(userId, stat, xp);
  await checkWeeklyGoals(userId);
});
```

The event bus swallows errors silently, so a failing listener never crashes the main request.

---

## 6. Testing Services in Isolation

Services receive plain arguments (no `req`/`res`). Easy to unit test:

```javascript
import { purchaseEquipment } from '../services/shopService.js';

test('purchase deducts coins', async () => {
  // Mock the repositories
  const user = { coins: 1000, equiments: [], stats: { strength: { level: 1, value: 0 } } };
  // Test the service directly...
});
```

---

## Directory Structure

```
System-2.0/
├── Client/              # React frontend
├── Server/              # Node.js backend
│   ├── Controllers/     # Thin HTTP handlers (parse req, call service, send res)
│   ├── services/        # Business logic + ragService.js (HTTP client to RAG-Service)
│   ├── repositories/    # Data access (Mongoose queries, easy to swap)
│   ├── events/          # EventBus + listeners (logging, notifications)
│   ├── Models/          # Mongoose schemas (eventLog, chatHistory, user, etc.)
│   ├── Routes/          # Express route definitions
│   ├── libs/            # Utilities (quest generation, leveling math)
│   ├── utils/           # ServiceError, validators
│   ├── seeds/           # Seeding + migration scripts
│   └── docs/            # This file
└── RAG-Service/         # Python FastAPI microservice (Pinecone + Mistral)
    ├── server.py        # FastAPI app (port 8100)
    ├── services/        # embedding_service, chat_service, summarize_service
    ├── models/          # Pydantic schemas
    ├── scripts/         # One-time setup scripts
    └── requirements.txt
```
