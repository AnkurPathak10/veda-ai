import { Worker, type Job } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";
import {
  runQuestionPaperGeneration,
  type GenerateInput,
  type GenerationResult,
} from "../lib/question-paper-generation.js";
import {
  QUESTION_PAPER_QUEUE,
  type QuestionPaperJobData,
} from "../queues/question-paper-queue.js";

let worker: Worker<QuestionPaperJobData, GenerationResult> | null = null;

async function processQuestionPaperJob(
  job: Job<QuestionPaperJobData, GenerationResult>,
): Promise<GenerationResult> {
  const input = job.data as GenerateInput;

  return runQuestionPaperGeneration(input, async (progress) => {
    await job.updateProgress(progress);
  });
}

export function startQuestionPaperWorker(): Worker<
  QuestionPaperJobData,
  GenerationResult
> {
  if (worker) {
    return worker;
  }

  worker = new Worker<QuestionPaperJobData, GenerationResult>(
    QUESTION_PAPER_QUEUE,
    processQuestionPaperJob,
    {
      connection: createRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`Question paper job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Question paper job ${job?.id} failed:`, error);
  });

  console.log("BullMQ question paper worker started");

  return worker;
}

export async function closeQuestionPaperWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
