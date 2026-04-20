/**
 * Redis Connection — shared by all queues, workers, and publishers.
 *
 * Exports:
 *   connection  — BullMQ-compatible config object (for queues/workers)
 *   redisClient — Raw IORedis instance (for Redis PUBLISH to RAG-Service)
 *
 * If REDIS_URL is not set, both export null — system degrades gracefully.
 */
import 'dotenv/config';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let connection = null;
let redisClient = null;

if (REDIS_URL) {
  try {
    // BullMQ connection config
    const url = new URL(REDIS_URL);
    connection = {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      username: url.username !== 'default' ? url.username : undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
    };

    // Raw IORedis client for PUBLISH (cross-service communication)
    redisClient = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      lazyConnect: true,
    });

    redisClient.connect().catch(err =>
      console.error('[Redis] Connection failed:', err.message)
    );

    console.log(`[Queue] Redis configured: ${url.hostname}:${url.port}`);
  } catch (err) {
    console.error('[Queue] Invalid REDIS_URL:', err.message);
  }
} else {
  console.warn('[Queue] REDIS_URL not set — queue features disabled. Server runs normally without Redis.');
}

export { connection, redisClient };
