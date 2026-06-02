import "server-only";

import Redis from "ioredis";

import { logger } from "@/lib/logger";

const REDIS_URL = process.env.REDIS_URL ?? null;

let redis: Redis | null = null;
let redisError: Error | null = null;

function getClient(): Redis | null {
  if (redis !== null) return redis;
  if (redisError !== null) return null;
  if (!REDIS_URL) {
    redisError = new Error("REDIS_URL not set");
    return null;
  }

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy() {
        return null; // do not reconnect — fail fast
      },
      lazyConnect: true, // connect on first command
    });

    redis.on("error", (err) => {
      logger.error({ err }, "redis connection error");
      redisError = err;
    });
  } catch (err) {
    redisError = err as Error;
    logger.error({ err: redisError }, "redis init failed");
    return null;
  }

  return redis;
}

/**
 * Get a value from the Redis cache. Returns null on any failure.
 */
export async function cacheGet(key: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    return await client.get(key);
  } catch (err) {
    logger.warn({ err, key }, "cacheGet failed");
    return null;
  }
}

/**
 * Set a value in the Redis cache with a TTL in seconds.
 * Silently ignores failures — the caller should fall through to the source.
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(key, value, "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "cacheSet failed");
  }
}

/**
 * Delete a key from the Redis cache.
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err) {
    logger.warn({ err, key }, "cacheDel failed");
  }
}
