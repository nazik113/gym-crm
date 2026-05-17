import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from './logger.js';

export class RedisAdapter {
  constructor() {
    this.pubClient = null;
    this.subClient = null;
  }

  async init(io) {
    const opts = {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    };

    this.pubClient = new Redis(opts);
    this.subClient = this.pubClient.duplicate();

    this.pubClient.on('error', (e) => logger.error('Redis pub error:', e.message));
    this.subClient.on('error', (e) => logger.error('Redis sub error:', e.message));

    io.adapter(createAdapter(this.pubClient, this.subClient));
    logger.info('✅ Redis adapter connected');
  }

  subscribeLaravelEvents(io) {
    // Listen for Laravel broadcast events published to Redis
    this.subClient.psubscribe('laravel_database_*', (err, count) => {
      if (err) logger.error('Subscribe error:', err.message);
      else logger.info(`Subscribed to ${count} Laravel channels`);
    });

    this.subClient.on('pmessage', (pattern, channel, message) => {
      try {
        const payload = JSON.parse(message);
        const event = payload.event;
        const data = payload.data;

        // Route Laravel broadcast events to Socket.IO rooms
        if (channel.includes('gym-presence')) {
          io.to('role:admin').emit('presence:update', data);
          io.to('role:trainer').emit('presence:update', data);
        }

        if (channel.includes('private-user')) {
          const userId = channel.split('.').pop();
          io.to(`user:${userId}`).emit('notification:received', data);
        }
      } catch (e) {
        logger.error('Message parse error:', e.message);
      }
    });
  }
}
