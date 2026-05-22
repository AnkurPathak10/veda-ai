import type { Request, Response } from "express";
import { extractTextFromUpload } from "../lib/extract-text.js";
import { generateStructuredJson } from "../lib/openrouter.js";
import { buildQuestionPaperPrompts } from "../lib/prompt-builder.js";
import {
  generateRequestSchema,
  questionPaperSchema,
} from "../lib/question-paper-schema.js";

function parseJsonContent(raw: string): unknown {
  const trimmed = raw.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response was not valid JSON");
    }

    return JSON.parse(candidate.slice(start, end + 1));
  }
}

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

    const input = parsedBody.data;
    const sourceText = await extractTextFromUpload(
      input.uploadedFile.filename,
      input.uploadedFile.mimeType,
    );

    const { systemPrompt, userPrompt } = buildQuestionPaperPrompts(
      input,
      sourceText,
    );

    const { content, model } = await generateStructuredJson(
      systemPrompt,
      userPrompt,
    );

    const json = parseJsonContent(content);
    const validated = questionPaperSchema.safeParse(json);

    if (!validated.success) {
      console.error("Question paper validation failed:", validated.error);
      res.status(502).json({
        error:
          "AI generated an invalid question paper structure. Please try again.",
      });
      return;
    }

    res.json({
      questionPaper: validated.data,
      model,
    });
  } catch (error) {
    console.error("Question paper generation failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate question paper";

    res.status(500).json({ error: message });
  }
}
