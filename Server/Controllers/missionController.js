// import necessary modules
import { generateMissionWithLLM } from '../libs/generateQuest.js';
import { Mission } from '../Models/mission.js';
import { Quest } from '../Models/quest.js';
import { createTrackerForUser } from './trackerController.js';


/**
 * Generates a mission using LLM and saves it to the database.
 * Expects: req.body.description (string), req.body.days (number)
 */

export const addGeneratedMission = async (req, res) => {
  try {
    const { description, days } = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user

    if (!description || !days) {
      return res.status(400).json({ error: 'Description and days are required.' });
    }

    // 1. Generate mission using LangChain-powered function
    const generated = await generateMissionWithLLM(description, days);

    const {
      title,
      refinedDescription,
      quests,
      reward,
      penalty,
      rank
    } = generated;

    // 2. Create Quest documents
    const questDocs = await Promise.all(
      quests.map(async (quest) => {
        const newQuest = new Quest({
          title: quest.title,
          statAffected: quest.statAffected,
          xp: quest.xp
        });
        return await newQuest.save();
      })
    );

    const questIds = questDocs.map((q) => q._id);

    // 3. Create and save the Mission document
    const mission = new Mission({
      title,
      description: refinedDescription,
      duration:days,
      quests: questIds,
      reward,
      penalty,
      rank,
      public: true,
      participants: []
    });

    await mission.save();
//create user Tracker
    // const tracker = await createTrackerForUser(userId, mission);
    // if (!tracker) {
    //   return res.status(500).json({ error: 'Failed to create tracker for user.' });
    // }

    res.status(201).json({
      message: 'Mission generated and saved successfully.',
      mission,
      quests
    });

  } catch (error) {
    console.error('Error generating mission:', error.message);
    res.status(500).json({ error: 'Failed to generate mission.' });
  }
};
