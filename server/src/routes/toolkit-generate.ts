import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { getToolkitQueue } from "../queues/toolkit-queue.js";
import { toolkitRequestSchema } from "../lib/toolkit/schemas.js";

export async function handleGenerateToolkit(req: Request, res: Response) {
  try {
    const parsedBody = toolkitRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsedBody.error.flatten(),
      });
      return;
    }

    const jobId = randomUUID();
    const queue = getToolkitQueue();

    await queue.add("generate", parsedBody.data, { jobId });

    res.status(202).json({
      jobId,
      status: "GENERATING" as const,
    });
  } catch (error) {
    console.error("Failed to enqueue toolkit generation:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to start toolkit generation";

    res.status(500).json({ error: message });
  }
}
