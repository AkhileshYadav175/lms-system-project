import { connection as redis } from '../config/queue.js';

// Tier 1 ultra-fast in-memory cache
const memoryCache = new Map();

/**
 * Get cached value from Tier 1 (Memory) or Tier 2 (Redis)
 */
export const getCache = async (key) => {
  try {
    // 1. Check memory cache first (< 0.05ms)
    if (memoryCache.has(key)) {
      const item = memoryCache.get(key);
      if (Date.now() < item.expiresAt) {
        return item.data;
      }
      memoryCache.delete(key);
    }

    // 2. Check Redis
    if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
      const data = await redis.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Populate L1 cache
        memoryCache.set(key, { data: parsed, expiresAt: Date.now() + 45000 });
        return parsed;
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }
  return null;
};

/**
 * Set cache in both Memory and Redis
 */
export const setCache = async (key, val, ttlSeconds = 45) => {
  try {
    memoryCache.set(key, { data: val, expiresAt: Date.now() + (ttlSeconds * 1000) });
    if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
      await redis.set(key, JSON.stringify(val), 'EX', ttlSeconds);
    }
  } catch (err) {
    // Non-blocking fallback
  }
};

/**
 * Delete cache matching user
 */
export const deleteUserCache = async (userId) => {
  try {
    if (!userId) return;
    const strUserId = String(userId);
    for (const k of memoryCache.keys()) {
      if (k.includes(strUserId)) {
        memoryCache.delete(k);
      }
    }
    if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
      const keys = await redis.keys(`*${strUserId}*`);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }
};
