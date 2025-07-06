import express from 'express';
import passport from 'passport';
import { login, logout, signup, testAuth } from '../Controllers/userController.js';
import jwt from 'jsonwebtoken';
import { isAuthenticated } from '../Middlewares/authMiddleware.js';
const router = express.Router();

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend
   res.redirect(`${process.env.CLIENT_URL}/oauth-transfer?token=${token}`);

  }
);

// Normal auth
router.post('/register', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/test', isAuthenticated,testAuth);


export default router;
