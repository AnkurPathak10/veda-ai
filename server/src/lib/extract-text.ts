import fs from "node:fs/promises";
import path from "node:path";

const MAX_SOURCE_CHARS = 14_000;

export async function extractTextFromUpload(
  filename: string,
  mimeType: string,
): Promise<string> {
  const filePath = path.join(process.cwd(), "uploads", filename);
  const buffer = await fs.readFile(filePath);

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

  if (normalized.length <= MAX_SOURCE_CHARS) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_SOURCE_CHARS)}\n\n[Source truncated for length]`;
}
