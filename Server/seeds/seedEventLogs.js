/**
 * Seed demo EventLog data for testing the RAG service.
 *
 * Usage:  node seeds/seedEventLogs.js
 *
 * This inserts ~60 realistic player events spanning 30 days for the
 * first user found in the database. After running, the RAG service
 * will have enough events to build pages and answer questions.
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { EventLog } from '../Models/eventLog.js';
import { User } from '../Models/user.js';

config(); // load .env

const MONGO_URI = process.env.MONGO_URI;

// ── Demo events (30 days of realistic player activity) ────────

function generateDemoEvents(userId) {
  const now = Date.now();
  const DAY = 86400000;
  const events = [];

  const push = (daysAgo, type, summary) => {
    events.push({
      userId,
      type,
      summary,
      data: {},
      timestamp: new Date(now - daysAgo * DAY + Math.random() * DAY * 0.5),
      pageIndex: -1,
    });
  };

  // ── Day 1-5: Getting started ─────────
  push(30, 'mission:joined',       'Joined mission "Morning Warrior" — 7-day fitness challenge.');
  push(30, 'quest:completed',      'Completed a quest. Gained 15 strength XP. Current streak: 1.');
  push(29, 'quest:completed',      'Completed a quest. Gained 10 endurance XP. Current streak: 2.');
  push(29, 'sidequest:created',    'Created sidequest "Read 20 pages of Atomic Habits" (easy, intelligence).');
  push(28, 'quest:completed',      'Completed a quest. Gained 12 strength XP. Current streak: 3.');
  push(28, 'sidequest:completed',  'Completed sidequest "Read 20 pages of Atomic Habits" (easy). Stat: intelligence.');
  push(27, 'daily:completed',      'Finished all daily quests! Streak: 4, Day 4. Earned 25 XP and 10 coins.');
  push(27, 'quest:completed',      'Completed a quest. Gained 20 agility XP. Current streak: 4.');
  push(26, 'quest:completed',      'Completed a quest. Gained 15 strength XP. Current streak: 5.');
  push(26, 'equipment:purchased',  'Purchased "Iron Gauntlets" for 50 coins. Gained: strength +3 levels.');

  // ── Day 6-10: Building momentum ──────
  push(25, 'daily:completed',      'Finished all daily quests! Streak: 6, Day 6. Earned 30 XP and 12 coins.');
  push(25, 'quest:completed',      'Completed a quest. Gained 18 intelligence XP. Current streak: 6.');
  push(24, 'quest:completed',      'Completed a quest. Gained 22 endurance XP. Current streak: 7.');
  push(24, 'mission:completed',    'Completed mission "Morning Warrior". Full duration achieved!');
  push(23, 'skill:unlocked',       'Unlocked skill "Focus Mastery".');
  push(23, 'mission:joined',       'Joined mission "Mind Sharpener" — 14-day intelligence challenge.');
  push(22, 'quest:completed',      'Completed a quest. Gained 25 intelligence XP. Current streak: 1.');
  push(22, 'sidequest:created',    'Created sidequest "Organize desk and files" (medium, agility).');
  push(21, 'quest:completed',      'Completed a quest. Gained 20 intelligence XP. Current streak: 2.');
  push(21, 'sidequest:completed',  'Completed sidequest "Organize desk and files" (medium). Stat: agility.');

  // ── Day 11-15: Streak and growth ─────
  push(20, 'daily:completed',      'Finished all daily quests! Streak: 3, Day 3. Earned 35 XP and 15 coins.');
  push(20, 'title:unlocked',       'Earned title "Streak Adept".');
  push(19, 'quest:completed',      'Completed a quest. Gained 30 intelligence XP. Current streak: 4.');
  push(18, 'quest:completed',      'Completed a quest. Gained 28 intelligence XP. Current streak: 5.');
  push(18, 'rank:ascended',        'Ascended to rank D! Reward: 400 XP, 1500 coins.');
  push(17, 'penalty:applied',      'Penalty applied (streak break). Lost 10 stat XP and 5 coins.');
  push(17, 'quest:completed',      'Completed a quest. Gained 15 endurance XP. Current streak: 1.');
  push(16, 'quest:completed',      'Completed a quest. Gained 22 intelligence XP. Current streak: 2.');
  push(16, 'equipment:purchased',  'Purchased "Scholar\'s Tome" for 120 coins. Gained: intelligence +5 levels.');
  push(15, 'daily:completed',      'Finished all daily quests! Streak: 3, Day 8. Earned 40 XP and 18 coins.');

  // ── Day 16-20: Mixed activity ────────
  push(14, 'quest:completed',      'Completed a quest. Gained 35 intelligence XP. Current streak: 4.');
  push(14, 'sidequest:created',    'Created sidequest "30-min workout session" (medium, strength).');
  push(13, 'sidequest:completed',  'Completed sidequest "30-min workout session" (medium). Stat: strength.');
  push(13, 'quest:completed',      'Completed a quest. Gained 18 charisma XP. Current streak: 5.');
  push(12, 'daily:completed',      'Finished all daily quests! Streak: 6, Day 11. Earned 45 XP and 20 coins.');
  push(12, 'quest:completed',      'Completed a quest. Gained 40 intelligence XP. Current streak: 6.');
  push(11, 'quest:completed',      'Completed a quest. Gained 25 endurance XP. Current streak: 7.');
  push(11, 'skill:unlocked',       'Unlocked skill "Iron Will".');
  push(10, 'quest:completed',      'Completed a quest. Gained 32 strength XP. Current streak: 8.');
  push(10, 'sidequest:created',    'Created sidequest "Call mom and catch up" (trivial, charisma).');

  // ── Day 21-25: Peak performance ──────
  push(9,  'sidequest:completed',  'Completed sidequest "Call mom and catch up" (trivial). Stat: charisma.');
  push(9,  'daily:completed',      'Finished all daily quests! Streak: 9, Day 14. Earned 50 XP and 25 coins.');
  push(9,  'mission:completed',    'Completed mission "Mind Sharpener". Full duration achieved!');
  push(8,  'title:unlocked',       'Earned title "Iron Challenger".');
  push(8,  'mission:joined',       'Joined mission "Shadow Endurance" — 21-day endurance challenge.');
  push(7,  'quest:completed',      'Completed a quest. Gained 28 endurance XP. Current streak: 1.');
  push(7,  'equipment:purchased',  'Purchased "Shadow Cloak" for 200 coins. Gained: agility +4 levels.');
  push(6,  'quest:completed',      'Completed a quest. Gained 35 endurance XP. Current streak: 2.');
  push(6,  'sidequest:created',    'Created sidequest "Write journal reflection" (easy, intelligence).');
  push(5,  'quest:completed',      'Completed a quest. Gained 30 endurance XP. Current streak: 3.');

  // ── Day 26-30: Recent activity ───────
  push(4,  'sidequest:completed',  'Completed sidequest "Write journal reflection" (easy). Stat: intelligence.');
  push(4,  'daily:completed',      'Finished all daily quests! Streak: 4, Day 4. Earned 40 XP and 18 coins.');
  push(3,  'quest:completed',      'Completed a quest. Gained 40 endurance XP. Current streak: 5.');
  push(3,  'quest:completed',      'Completed a quest. Gained 22 strength XP. Current streak: 5.');
  push(2,  'daily:completed',      'Finished all daily quests! Streak: 6, Day 6. Earned 55 XP and 28 coins.');
  push(2,  'skill:unlocked',       'Unlocked skill "Endurance Aura".');
  push(1,  'quest:completed',      'Completed a quest. Gained 45 endurance XP. Current streak: 7.');
  push(1,  'quest:completed',      'Completed a quest. Gained 38 strength XP. Current streak: 7.');
  push(0,  'daily:completed',      'Finished all daily quests! Streak: 8, Day 8. Earned 60 XP and 30 coins.');
  push(0,  'sidequest:created',    'Created sidequest "Prepare presentation for Monday" (hard, intelligence).');

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

// ── Main ─────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected ✓');

  // Find first user
  const user = await User.findOne();
  if (!user) {
    console.error('No users found in database. Create a user first.');
    process.exit(1);
  }

  console.log(`Using user: ${user.username} (${user._id})`);

  // Clear existing demo logs for this user
  const deleted = await EventLog.deleteMany({ userId: user._id });
  console.log(`Cleared ${deleted.deletedCount} existing event logs.`);

  // Generate and insert
  const events = generateDemoEvents(user._id);
  await EventLog.insertMany(events);
  console.log(`✅ Inserted ${events.length} demo events spanning 30 days.`);

  console.log('\nSample events:');
  events.slice(0, 5).forEach(e => {
    console.log(`  [${e.timestamp.toISOString().split('T')[0]}] ${e.type}: ${e.summary}`);
  });
  console.log(`  ... and ${events.length - 5} more`);

  console.log('\n🎯 Now test the RAG service:');
  console.log('   The chat widget on the frontend should work.');
  console.log('   Or run: node seeds/testRagService.js');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
