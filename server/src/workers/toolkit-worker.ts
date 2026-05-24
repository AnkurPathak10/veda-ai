import { Worker, type Job } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";
import {
  emitToolkitJobComplete,
  emitToolkitJobFailed,
  emitToolkitJobProgress,
} from "../lib/socket.js";
import {
  runToolkitGeneration,
  type ToolkitGenerationResult,
  type ToolkitRequest,
} from "../lib/toolkit/generation.js";
import {
  TOOLKIT_QUEUE,
  type ToolkitJobData,
} from "../queues/toolkit-queue.js";

let worker: Worker<ToolkitJobData, ToolkitGenerationResult> | null = null;

async function processToolkitJob(
  job: Job<ToolkitJobData, ToolkitGenerationResult>,
): Promise<ToolkitGenerationResult> {
  const input = job.data as ToolkitRequest;
  const jobId = job.id ?? "";

  if (jobId) {
    emitToolkitJobProgress({ jobId, status: "GENERATING", progress: 0 });
  }

  return runToolkitGeneration(input, async (progress) => {
    await job.updateProgress(progress);

    if (jobId) {
      emitToolkitJobProgress({ jobId, status: "GENERATING", progress });
    }
  });
}

export function startToolkitWorker(): Worker<
  ToolkitJobData,
  ToolkitGenerationResult
> {
  if (worker) {
    return worker;
  }

  worker = new Worker<ToolkitJobData, ToolkitGenerationResult>(
    TOOLKIT_QUEUE,
    processToolkitJob,
    {
      connection: createRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job, result) => {
    const jobId = job.id ?? "";
    console.log(`Toolkit job ${jobId} completed`);

    if (jobId && result) {
      emitToolkitJobComplete({
        jobId,
        status: "COMPLETED",
        progress: 100,
        tool: result.tool,
        result: result.result,
        model: result.model,
      });
    }
  });

  worker.on("failed", (job, error) => {
    const jobId = job?.id ?? "";
    console.error(`Toolkit job ${jobId} failed:`, error);

    if (jobId) {
      emitToolkitJobFailed({
        jobId,
        status: "FAILED",
        error: job?.failedReason ?? error.message ?? "Toolkit generation failed",
      });
    }
  });

  console.log("BullMQ toolkit worker started");

  return worker;
}

export async function closeToolkitWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
