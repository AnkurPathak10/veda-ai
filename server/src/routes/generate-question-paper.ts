import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { getQuestionPaperQueue } from "../queues/question-paper-queue.js";
import { generateRequestSchema } from "../lib/question-paper-schema.js";

export async function handleGenerateQuestionPaper(
  req: Request,
  res: Response,
) {
  try {
    const parsedBody = generateRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsedBody.error.flatten(),
      });
      return;
    }

    const jobId = randomUUID();
    const queue = getQuestionPaperQueue();

    await queue.add("generate", parsedBody.data, { jobId });

    res.status(202).json({
      jobId,
      status: "GENERATING" as const,
    });
  } catch (error) {
    console.error("Failed to enqueue question paper generation:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to start question paper generation";

    res.status(500).json({ error: message });
  }
}
