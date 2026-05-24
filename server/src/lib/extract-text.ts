import fs from "node:fs/promises";
import { CACHE_KEYS, CACHE_TTL, cacheGet, cacheSet } from "./cache.js";
import { getUploadFilePath } from "./uploads-dir.js";

const MAX_SOURCE_CHARS = 14_000;

async function readUploadBuffer(
  filename: string,
): Promise<Buffer> {
  const filePath = getUploadFilePath(filename);

  try {
    return await fs.readFile(filePath);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        "Uploaded file is no longer available. Please remove the file and upload it again.",
      );
    }

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("enoent")
    ) {
      throw new Error(
        "Uploaded file is no longer available. Please remove the file and upload it again.",
      );
    }

    throw error;
  }
}

async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  let text = "";

  if (mimeType === "text/plain") {
    text = buffer.toString("utf-8");
  } else if (mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    text = parsed.text;
  } else {
    throw new Error("Unsupported file type for text extraction");
  }

  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    throw new Error(
      "Could not extract readable text from the uploaded file. Try a text-based PDF or .txt file.",
    );
  }

  return normalized.length <= MAX_SOURCE_CHARS
    ? normalized
    : `${normalized.slice(0, MAX_SOURCE_CHARS)}\n\n[Source truncated for length]`;
}

export async function extractTextFromUpload(
  filename: string,
  mimeType: string,
): Promise<string> {
  const cacheKey = CACHE_KEYS.extractedText(filename);
  const cached = await cacheGet<string>(cacheKey);

  if (cached) {
    return cached;
  }

  const buffer = await readUploadBuffer(filename);
  const result = await extractTextFromBuffer(buffer, mimeType);

  try {
    await cacheSet(cacheKey, result, CACHE_TTL.EXTRACTED_TEXT);
  } catch (error) {
    console.warn(
      `Failed to cache extracted text for ${filename}. Generation will require the file on disk.`,
      error,
    );
  }

  return result;
}
