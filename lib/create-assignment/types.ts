import type { QuestionTypeValue } from "./constants";

export type UploadedFileInfo = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
};

export type QuestionTypeRow = {
  id: string;
  type: QuestionTypeValue;
  count: number;
  marks: number;
};

export type CreateAssignmentErrors = {
  file?: string;
  dueDate?: string;
  questionTypes?: string;
  rows?: Record<string, { type?: string; count?: string; marks?: string }>;
  additionalInfo?: string;
};
