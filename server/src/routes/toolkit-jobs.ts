import type { Request, Response } from "express";
import type { JobState } from "bullmq";
import { getToolkitQueue } from "../queues/toolkit-queue.js";
import type { JobStatus } from "../lib/socket.js";

function mapJobState(state: JobState | "unknown"): JobStatus {
  switch (state) {
    case "waiting":
    case "delayed":
    case "waiting-children":
      return "PENDING";
    case "active":
      return "GENERATING";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}

function getRouteJobId(req: Request): string | null {
  const raw = req.params.jobId;

  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return null;
}

export async function handleGetToolkitJobStatus(req: Request, res: Response) {
  try {
    const jobId = getRouteJobId(req);

    if (!jobId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    const job = await getToolkitQueue().getJob(jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const state = await job.getState();
    const status = mapJobState(state);
    const progress =
      typeof job.progress === "number" ? job.progress : undefined;

    if (status === "COMPLETED") {
      const result = job.returnvalue;

      res.json({
        jobId,
        status,
        progress: progress ?? 100,
        tool: result?.tool,
        result: result?.result,
        model: result?.model,
      });
      return;
    }

    if (status === "FAILED") {
      res.json({
        jobId,
        status,
        progress,
        error: job.failedReason ?? "Toolkit generation failed",
      });
      return;
    }

    res.json({
      jobId,
      status,
      progress,
    });
  } catch (error) {
    console.error("Failed to get toolkit job status:", error);
    res.status(500).json({ error: "Failed to get job status" });
  }
}
