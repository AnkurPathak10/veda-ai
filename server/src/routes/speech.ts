import type { Request, Response } from "express";
import { z } from "zod";
import { transcribeAudioWithOpenRouter } from "../lib/speech-to-text.js";

const transcribeRequestSchema = z.object({
  audio: z.string().min(1),
  format: z.enum(["wav", "mp3", "flac", "m4a", "ogg", "webm", "aac"]),
  language: z.string().min(2).max(5).optional(),
});

export async function handleTranscribeSpeech(req: Request, res: Response) {
  try {
    const parsedBody = transcribeRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsedBody.error.flatten(),
      });
      return;
    }

    const { audio, format, language } = parsedBody.data;

    const text = await transcribeAudioWithOpenRouter(audio, format, language);

    res.json({ text });
  } catch (error) {
    console.error("Speech transcription failed:", error);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Speech transcription failed. Please try again.",
    });
  }
}
