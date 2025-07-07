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
