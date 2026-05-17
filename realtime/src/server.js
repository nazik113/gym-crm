import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import { setupPresenceHandlers } from './handlers/presence.js';
import { setupNotificationHandlers } from './handlers/notifications.js';
import { RedisAdapter } from './services/redis.js';
import { logger } from './services/logger.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling
const redis = new RedisAdapter();
await redis.init(io);

// Auth middleware
io.use(authMiddleware);

// Namespace: Admin
const adminNs = io.of('/admin');
adminNs.use(authMiddleware);

// Namespace: Trainers
const trainerNs = io.of('/trainer');
trainerNs.use(authMiddleware);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.user?.id} [${socket.user?.role}]`);

  // Join personal room
  socket.join(`user:${socket.user.id}`);

  // Join role room
  socket.join(`role:${socket.user.role}`);

  setupPresenceHandlers(io, socket);
  setupNotificationHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.user?.id} — ${reason}`);
  });
});

// Listen for Laravel broadcast events via Redis
redis.subscribeLaravelEvents(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Realtime server running on port ${PORT}`);
});
