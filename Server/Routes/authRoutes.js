import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../Models/user.js';
import { login, logout, signup, testAuth } from '../Controllers/userController.js';
import { isAuthenticated } from '../Middlewares/authMiddleware.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Modern Google Auth — verify credential from @react-oauth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ msg: 'Missing Google credential' });
    }

    let email, name, picture, googleId;

    // Try verifying as an ID token first
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } catch {
      // If ID token verification fails, treat as an access token
      // and fetch user info from Google's userinfo endpoint
      const userInfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${credential}` } }
      );
      if (!userInfoRes.ok) {
        return res.status(401).json({ msg: 'Invalid Google credential' });
      }
      const userInfo = await userInfoRes.json();
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
      googleId = userInfo.sub;
    }

    if (!email) {
      return res.status(400).json({ msg: 'Google account has no email' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name || email.split('@')[0],
        email,
        avatar: picture || '',
        googleId,
      });
    } else if (!user.googleId) {
      // Link Google account to existing email user
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res
      .cookie('token', token, cookieOptions)
      .status(200)
      .json({ msg: 'Google login successful', user: userResponse });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ msg: 'Invalid Google credential' });
  }
});

// Normal auth
router.post('/register', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/test', isAuthenticated, testAuth);

export default router;
