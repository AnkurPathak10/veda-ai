import { Queue } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";
import type { ToolkitRequest } from "../lib/toolkit/generation.js";

export const TOOLKIT_QUEUE = "toolkit-generation";

export type ToolkitJobData = ToolkitRequest;

let queue: Queue<ToolkitJobData> | null = null;

export function getToolkitQueue(): Queue<ToolkitJobData> {
  if (!queue) {
    queue = new Queue<ToolkitJobData>(TOOLKIT_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 4,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  }

  return queue;
}

export async function closeToolkitQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
