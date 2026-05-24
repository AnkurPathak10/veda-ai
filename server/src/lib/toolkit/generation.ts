import { createHash } from "node:crypto";
import {
  CACHE_KEYS,
  CACHE_TTL,
  cacheGet,
  cacheSet,
} from "../cache.js";
import { extractTextFromUpload } from "../extract-text.js";
import { generateStructuredJson } from "../openrouter.js";
import { parseJsonContent } from "../parse-json-content.js";
import { buildToolkitPrompts } from "./prompt-builders.js";
import {
  type ToolkitGenerationResult,
  type ToolkitRequest,
  validateToolkitResult,
} from "./schemas.js";

function hashPrompts(systemPrompt: string, userPrompt: string): string {
  return createHash("sha256")
    .update(systemPrompt)
    .update("\0")
    .update(userPrompt)
    .digest("hex");
}

export type { ToolkitRequest, ToolkitGenerationResult };

export async function runToolkitGeneration(
  input: ToolkitRequest,
  onProgress?: (progress: number) => void | Promise<void>,
): Promise<ToolkitGenerationResult> {
  await onProgress?.(10);

  const sourceText = await extractTextFromUpload(
    input.uploadedFile.filename,
    input.uploadedFile.mimeType,
  );

  await onProgress?.(30);

  const { systemPrompt, userPrompt } = buildToolkitPrompts(input, sourceText);

  await onProgress?.(40);

  const promptHash = hashPrompts(systemPrompt, userPrompt);
  const cacheKey = CACHE_KEYS.toolkitResult(input.tool, promptHash);
  const cached = await cacheGet<ToolkitGenerationResult>(cacheKey);

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
  const result = validateToolkitResult(input.tool, json);

  const generationResult: ToolkitGenerationResult = {
    tool: input.tool,
    result,
    model,
  };

  await cacheSet(cacheKey, generationResult, CACHE_TTL.TOOLKIT_RESULT);
  await onProgress?.(100);

  return generationResult;
}
