import { z } from 'zod';

export const completeQuestSchema = z.object({
  questId: z.string().min(1, 'questId is required'),
  trackerid: z.string().min(1, 'trackerid is required'),
});

export const buyEquipmentSchema = z.object({
  equipmentId: z.string().min(1, 'equipmentId is required'),
});

export const unlockSkillSchema = z.object({
  skillId: z.string().min(1, 'skillId is required'),
});

export const updateProfileSchema = z.object({
  activeTitle: z.string().optional(),
  avatar: z.string().url().optional(),
}).refine(data => data.activeTitle || data.avatar, {
  message: 'At least one of activeTitle or avatar is required',
});

export const upgradeTrackerSchema = z.object({
  trackerId: z.string().min(1, 'trackerId is required'),
});

export const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
