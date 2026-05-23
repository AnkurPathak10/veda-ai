import { createHash } from "node:crypto";
import { z } from "zod";
import {
  CACHE_KEYS,
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "./cache.js";
import { extractTextFromUpload } from "./extract-text.js";
import { generateStructuredJson } from "./openrouter.js";
import { parseJsonContent } from "./parse-json-content.js";
import { buildQuestionPaperPrompts } from "./prompt-builder.js";
import {
  generateRequestSchema,
  questionPaperSchema,
  type ParsedQuestionPaper,
} from "./question-paper-schema.js";

export type GenerateInput = z.infer<typeof generateRequestSchema>;

export type GenerationResult = {
  questionPaper: ParsedQuestionPaper;
  model: string;
};

function hashPrompts(systemPrompt: string, userPrompt: string): string {
  return createHash("sha256")
    .update(systemPrompt)
    .update("\0")
    .update(userPrompt)
    .digest("hex");
}

export async function runQuestionPaperGeneration(
  input: GenerateInput,
  onProgress?: (progress: number) => void | Promise<void>,
): Promise<GenerationResult> {
  await onProgress?.(10);

  const sourceText = await extractTextFromUpload(
    input.uploadedFile.filename,
    input.uploadedFile.mimeType,
  );

  await onProgress?.(30);

  const { systemPrompt, userPrompt } = buildQuestionPaperPrompts(
    input,
    sourceText,
  );

  await onProgress?.(40);

  const promptHash = hashPrompts(systemPrompt, userPrompt);
  const cacheKey = CACHE_KEYS.questionPaper(promptHash);
  const cached = await cacheGet<GenerationResult>(cacheKey);

  if (cached) {
    await onProgress?.(100);
    return cached;
  }

  const { content, model } = await generateStructuredJson(
    systemPrompt,
    userPrompt,
  );

  await onProgress?.(80);

  const json = parseJsonContent(content);
  const validated = questionPaperSchema.safeParse(json);

  if (!validated.success) {
    console.error("Question paper validation failed:", validated.error);
    throw new Error(
      "AI generated an invalid question paper structure. Please try again.",
    );
  }

  const result: GenerationResult = {
    questionPaper: validated.data,
    model,
  };

  await cacheSet(cacheKey, result, CACHE_TTL.QUESTION_PAPER);
  await onProgress?.(100);

  return result;
}
