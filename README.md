# 🧿 SoloRank – AI-Powered Life Gamification System

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

| Dashboard | Inventory | Rank Trial | AI Quest |
|----------|-----------|------------|----------|
| ![dash](./screenshots/dashboard.png) | ![gear](./screenshots/inventory.png) | ![trial](./screenshots/rank.png) | ![ai](./screenshots/aiquest.png) |

---

## 🛠️ Local Setup

### 🔑 Prerequisites
- Node.js v18+
- MongoDB Atlas or local MongoDB
- OpenAI API Key (for quest generation)

### 🔧 Clone & Install

```bash
# Clone both frontend and backend
git clone https://github.com/yourusername/solo-rank-frontend
git clone https://github.com/yourusername/solo-rank-backend

# Install frontend
cd solo-rank-frontend
npm install

# Install backend
cd ../solo-rank-backend
npm install
