
import { Sidequest } from '../Models/sidequests.js';
import { User } from '../Models/user.js';
import { ChatMistralAI } from '@langchain/mistralai';
import { statLevelThresholds, userLevelThresholds } from '../libs/levelling.js';
import 'dotenv/config';

// Difficulty reward table
const DIFFICULTY_TABLE = {
	trivial: { xp: 2, coins: 1 },
	easy: { xp: 5, coins: 2 },
	medium: { xp: 8, coins: 3 },
	hard: { xp: 12, coins: 5 },
};

// Lazy-init LLM client
let mistralClient;
function getModel(){
	if(!mistralClient){
		mistralClient = new ChatMistralAI({ model: 'mistral-small-latest', temperature: 0.2, apiKey: process.env.MISTRAL_API_KEY });
	}
	return mistralClient;
}

// AI + heuristic blended evaluation
async function evaluateSidequest({ title = '', description = '', hintEffort }) {
	const base = { title, description, hintEffort };
	const prompt = `You are an assistant that classifies a short user task for a gamified productivity app.
Return ONLY valid compact JSON with fields: difficulty(one of trivial,easy,medium,hard), stat(one of strength,intelligence,agility,endurance,charisma).
Task title: ${title}\nDescription: ${description || ''}\nEffort hint: ${hintEffort || ''}`;
	let aiChoice = null;
	try {
		const res = await getModel().invoke(prompt);
		const text = res.content?.[0]?.text || res.content || '';
		const match = text.match(/\{[\s\S]*\}/);
		if(match){
			const parsed = JSON.parse(match[0]);
			if(['trivial','easy','medium','hard'].includes(parsed.difficulty) && ['strength','intelligence','agility','endurance','charisma'].includes(parsed.stat)){
				aiChoice = parsed;
			}
		}
	} catch(e){
		// fallback silently
	}
	// Fallback heuristic when AI fails
	if(!aiChoice){
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

function recalcUserLevel(user){
	// simple while to catch multi-level jumps
	while(true){
		const next = user.level + 1;
		const needed = userLevelThresholds[next];
		if(needed && user.xp >= needed){
			user.level = next;
		} else break;
	}
}

function recalcStatLevels(user, statKey){
	const statObj = user.stats?.[statKey];
	if(!statObj) return;
	while(true){
		const next = statObj.level + 1;
		const needed = statLevelThresholds[next];
		if(needed && statObj.value >= needed){
			statObj.level = next;
		} else break;
	}
}

function applySidequestReward(user, sq){
	user.xp = (user.xp||0) + sq.evaluated.xp;
	user.coins = (user.coins||0) + sq.evaluated.coins;
	const incMap = { trivial:0, easy:1, medium:2, hard:3 };
	const gain = incMap[sq.evaluated.difficulty] ?? 1;
	if(user.stats && user.stats[sq.evaluated.stat]){
		user.stats[sq.evaluated.stat].value += gain;
		recalcStatLevels(user, sq.evaluated.stat);
	}
	recalcUserLevel(user);
}

export const createSidequest = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		const { title, description, deadline, hintEffort } = req.body;
		if (!title) return res.status(400).json({ error: 'Title required' });
		const evaluated = await evaluateSidequest({ title, description, hintEffort });
		const doc = await Sidequest.create({ title, description, userId, deadline: deadline ? new Date(deadline) : null, evaluated });
		await User.updateOne({ _id: userId }, { $push: { sidequests: doc._id } });
		return res.status(201).json(doc);
	} catch (e) {
		console.error('createSidequest error', e);
		return res.status(500).json({ error: 'Server error' });
	}
};

export const getUserSidequests = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		const { status } = req.query;
		const filter = { userId };
		if (status) filter.status = status;
		const items = await Sidequest.find(filter).sort({ createdAt: -1 });
		res.json(items);
	} catch (e) {
		console.error('getUserSidequests error', e);
		res.status(500).json({ error: 'Server error' });
	}
};

export const completeSidequest = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		const { id } = req.params;
		const sq = await Sidequest.findOne({ _id: id, userId });
		if (!sq) return res.status(404).json({ error: 'Not found' });
		if (sq.status === 'completed') return res.json(sq); // idempotent

		sq.status = 'completed';
		sq.completedAt = new Date();
		await sq.save();

			const user = await User.findById(userId);
			if(user){
				applySidequestReward(user, sq);
				await user.save();
			}
			res.json({ sidequest: sq, userReward: { xp: sq.evaluated.xp, coins: sq.evaluated.coins, stat: sq.evaluated.stat } });
	} catch (e) {
		console.error('completeSidequest error', e);
		res.status(500).json({ error: 'Server error' });
	}
};

export const _test_evaluateSidequest = evaluateSidequest;

