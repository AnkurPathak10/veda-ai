import { Redis } from "ioredis";

let sharedClient: Redis | null = null;

function createClient(): Redis {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("REDIS_URL is not configured. Add it to your .env file.");
  }

  return new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

/** Shared Redis client for caching and general use. */
export function getRedis(): Redis {
  if (!sharedClient) {
    sharedClient = createClient();
  }

  return sharedClient;
}

/** Separate connection for BullMQ queue/worker (each needs its own). */
export function createRedisConnection(): Redis {
  return createClient();
}

export async function connectRedis(): Promise<void> {
  const redis = getRedis();

  if (redis.status === "ready") {
    return;
  }

  await redis.connect();
}

export async function pingRedis(): Promise<boolean> {
  try {
    const result = await getRedis().ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (sharedClient) {
    await sharedClient.quit();
    sharedClient = null;
  }
}
