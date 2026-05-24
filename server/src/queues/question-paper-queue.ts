import { Queue } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";
import type { GenerateInput } from "../lib/question-paper-generation.js";

export const QUESTION_PAPER_QUEUE = "question-paper-generation";

export type QuestionPaperJobData = GenerateInput;

let queue: Queue<QuestionPaperJobData> | null = null;

export function getQuestionPaperQueue(): Queue<QuestionPaperJobData> {
  if (!queue) {
    queue = new Queue<QuestionPaperJobData>(QUESTION_PAPER_QUEUE, {
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

export async function closeQuestionPaperQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
