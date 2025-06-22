import jwt from 'jsonwebtoken';
import { User } from '../Models/user.js';

export const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};
