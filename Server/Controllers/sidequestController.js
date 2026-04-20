/**
 * SidequestController — HTTP layer for sidequest operations.
 * Evaluation logic and reward application are kept as focused helpers.
 */
import { Sidequest } from '../Models/sidequests.js';
import { userRepo } from '../repositories/userRepository.js';
import { ServiceError, handleServiceError } from '../utils/serviceError.js';
import { applySidequestReward } from '../services/rewardService.js';
import eventBus, { Events } from '../events/eventBus.js';
import 'dotenv/config';

// ── Difficulty reward table ──────────────────────────
const DIFFICULTY_TABLE = {
  trivial: { xp: 2, coins: 1 },
  easy: { xp: 5, coins: 2 },
  medium: { xp: 8, coins: 3 },
  hard: { xp: 12, coins: 5 },
};

// ── Mistral API call (direct fetch, no Langchain) ────
async function callMistral(prompt) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Mistral API ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── AI + heuristic evaluation (pure function) ────────
async function evaluateSidequest({ title = '', description = '', hintEffort }) {
  const prompt = `You are an assistant that classifies a short user task for a gamified productivity app.
Return ONLY valid compact JSON with fields: difficulty(one of trivial,easy,medium,hard), stat(one of strength,intelligence,agility,endurance,charisma).
Task title: ${title}\nDescription: ${description || ''}\nEffort hint: ${hintEffort || ''}`;

  let aiChoice = null;
  try {
    const text = await callMistral(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (['trivial', 'easy', 'medium', 'hard'].includes(parsed.difficulty) &&
          ['strength', 'intelligence', 'agility', 'endurance', 'charisma'].includes(parsed.stat)) {
        aiChoice = parsed;
      }
    }
  } catch (_) { /* fallback silently */ }

  if (!aiChoice) {
    const text = `${title} ${description}`.toLowerCase();
    let difficulty = 'easy';
    if (/buy|email|call|wash|clean|list|water plants|trash/.test(text)) difficulty = 'trivial';
    if (/study|homework|organize|write|practice|review/.test(text)) difficulty = 'easy';
    if (/workout|research|prepare|design|refactor|declutter|groceries/.test(text)) difficulty = 'medium';
    if (/presentation|thesis|tax|application|deep clean|resume|portfolio/.test(text)) difficulty = 'hard';
    let stat = 'endurance';
    if (/study|read|research|email|plan|analyze|review/.test(text)) stat = 'intelligence';
    else if (/run|workout|pushup|gym|train|exercise/.test(text)) stat = 'strength';
    else if (/clean|organize|declutter|wash/.test(text)) stat = 'agility';
    else if (/walk|grocer|shopping|errand|carry/.test(text)) stat = 'endurance';
    else if (/call|meet|network|present|interview|email professor|team/.test(text)) stat = 'charisma';
    aiChoice = { difficulty, stat };
  }

  const { difficulty, stat } = aiChoice;
  const { xp, coins } = DIFFICULTY_TABLE[difficulty];
  return { difficulty, xp, coins, stat };
}

// ── Controller handlers ──────────────────────────────

export const createSidequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ServiceError('Unauthorized', 401);

    const { title, description, deadline, hintEffort } = req.body;
    if (!title) throw new ServiceError('Title required', 400);

    const evaluated = await evaluateSidequest({ title, description, hintEffort });
    const doc = await Sidequest.create({
      title, description, userId,
      deadline: deadline ? new Date(deadline) : null,
      evaluated,
    });

    await userRepo.updateOne({ _id: userId }, { $push: { sidequests: doc._id } });

    eventBus.emitAsync(Events.SIDEQUEST_CREATED, {
      userId, sidequestId: doc._id.toString(), title, evaluated,
    });

    return res.status(201).json(doc);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const getUserSidequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ServiceError('Unauthorized', 401);

    const filter = { userId };
    if (req.query.status) filter.status = req.query.status;

    const items = await Sidequest.find(filter).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const completeSidequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ServiceError('Unauthorized', 401);

    const sq = await Sidequest.findOne({ _id: req.params.id, userId });
    if (!sq) throw new ServiceError('Not found', 404);
    if (sq.status === 'completed') return res.json(sq); // idempotent

    sq.status = 'completed';
    sq.completedAt = new Date();
    await sq.save();

    const user = await userRepo.findById(userId);
    let appliedReward = { xp: 0, coins: 0, stat: sq.evaluated.stat, statValueGain: 0 };
    if (user) {
      appliedReward = await applySidequestReward(user, sq.evaluated);
      await userRepo.save(user);
    }

    eventBus.emitAsync(Events.SIDEQUEST_COMPLETED, {
      userId, sidequestId: sq._id.toString(), title: sq.title, evaluated: sq.evaluated,
    });

    return res.json({
      sidequest: sq,
      userReward: appliedReward,
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const _test_evaluateSidequest = evaluateSidequest;
