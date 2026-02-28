import express from 'express';
import { User } from '../Models/user.js';
import { isAuthenticated } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// PUT /user/profile — update active title and/or avatar
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activeTitle, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (activeTitle) {
      if (!user.titles.includes(activeTitle)) {
        return res.status(400).json({ error: 'Title not unlocked' });
      }
      user.activeTitle = activeTitle;
      // Reorder: active title first
      user.titles = [activeTitle, ...user.titles.filter(t => t !== activeTitle)];
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ user: userResponse });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
