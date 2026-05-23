import { Worker, type Job } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";
import {
  emitJobComplete,
  emitJobFailed,
  emitJobProgress,
} from "../lib/socket.js";
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
  const jobId = job.id ?? "";

  if (jobId) {
    emitJobProgress({ jobId, status: "GENERATING", progress: 0 });
  }

  return runQuestionPaperGeneration(input, async (progress) => {
    await job.updateProgress(progress);

    if (jobId) {
      emitJobProgress({ jobId, status: "GENERATING", progress });
    }
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

  worker.on("completed", (job, result) => {
    const jobId = job.id ?? "";
    console.log(`Question paper job ${jobId} completed`);

    if (jobId && result) {
      emitJobComplete({
        jobId,
        status: "COMPLETED",
        progress: 100,
        questionPaper: result.questionPaper,
        model: result.model,
      });
    }
  });

  worker.on("failed", (job, error) => {
    const jobId = job?.id ?? "";
    console.error(`Question paper job ${jobId} failed:`, error);

    if (jobId) {
      emitJobFailed({
        jobId,
        status: "FAILED",
        error: job?.failedReason ?? error.message ?? "Question paper generation failed",
      });
    }
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
