// controllers/userController.js
// - registerUser
// - loginUser
// - updateStats
// - claimTitle
// - getUserProfile

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../Models/user.js';

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'Lax' })
      .status(201)
      .json({ msg: 'Registered successfully', user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'Lax' })
      .json({ msg: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token').json({ msg: 'Logged out successfully' });
};


