import { getRedis } from "./redis.js";

const KEY_PREFIX = "vedaai:";

function prefixedKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get(prefixedKey(key));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await getRedis().set(
    prefixedKey(key),
    JSON.stringify(value),
    "EX",
    ttlSeconds,
  );
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(prefixedKey(key));
}

export const CACHE_TTL = {
  EXTRACTED_TEXT: 86_400,
  QUESTION_PAPER: 604_800,
  ASSIGNMENTS_LIST: 60,
} as const;

export const CACHE_KEYS = {
  extractedText: (filename: string) => `extracted-text:${filename}`,
  questionPaper: (hash: string) => `question-paper:${hash}`,
  assignmentsList: (userId: string) => `assignments:list:${userId}`,
} as const;
