import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { extractTextFromUpload } from "../lib/extract-text.js";
import { UPLOADS_DIR, getUploadFilePath } from "../lib/uploads-dir.js";

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF and text files are allowed"));
  },
}).single("file");

function formatUploadProcessingError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Failed to process uploaded file";
  }

  if (
    error.message.toLowerCase().includes("enoent") ||
    error.message.includes("no such file or directory")
  ) {
    return "Could not read the uploaded file on the server. Please try uploading again.";
  }

  return error.message;
}

export async function handleUpload(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    await extractTextFromUpload(req.file.filename, req.file.mimetype);
  } catch (error) {
    try {
      await fs.promises.unlink(getUploadFilePath(req.file.filename));
    } catch {
      // Ignore cleanup errors.
    }

    res.status(400).json({
      error: formatUploadProcessingError(error),
    });
    return;
  }

  res.status(201).json({
    id: randomUUID(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
}

export function handleUploadError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File must be 10MB or smaller" });
      return;
    }
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({ error: error.message });
    return;
  }

  next(error);
}
