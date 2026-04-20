/**
 * Socket Manager — WebSocket infrastructure via Socket.io.
 *
 * Single responsibility: manage WebSocket connections and user rooms.
 * Workers call emitToUser() to push real-time notifications.
 *
 * Connection flow:
 *   1. Client connects with auth token (JWT in query param or cookie)
 *   2. Server verifies JWT → extracts userId
 *   3. User auto-joins room "user:{userId}"
 *   4. Workers push events to rooms via emitToUser()
 */
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

let io = null;

/**
 * Initialize Socket.io on the HTTP server.
 * Call once from index.js after creating the HTTP server.
 *
 * @param {import('http').Server} httpServer
 * @returns {Server} Socket.io instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── Auth middleware ──
  io.use((socket, next) => {
    try {
      // Accept token from query param (fallback for environments without cookies)
      const token = socket.handshake.auth?.token
        || socket.handshake.query?.token
        || socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ──
  io.on('connection', (socket) => {
    const { userId } = socket;
    const room = `user:${userId}`;

    socket.join(room);
    console.log(`[Socket] User ${userId} connected (room: ${room})`);

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  console.log('[Socket] WebSocket server initialized');
  return io;
};

/**
 * Get the Socket.io server instance.
 * Returns null if not initialized yet.
 */
export const getIO = () => io;

/**
 * Push an event to a specific user's room.
 * No-op if Socket.io isn't initialized or user isn't connected.
 *
 * @param {string} userId
 * @param {string} eventName - e.g. 'event:logged', 'notification'
 * @param {Object} data - payload to send
 */
export const emitToUser = (userId, eventName, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(eventName, data);
};
