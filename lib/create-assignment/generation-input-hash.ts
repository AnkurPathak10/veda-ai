import type { QuestionTypeRow, UploadedFileInfo } from "./types";

type GenerationInput = {
  uploadedFile: UploadedFileInfo;
  questionRows: QuestionTypeRow[];
  additionalInfo: string;
  dueDate: string;
};

export function computeGenerationInputHash(input: GenerationInput): string {
  const normalized = {
    uploadedFile: {
      filename: input.uploadedFile.filename,
      originalName: input.uploadedFile.originalName,
      mimeType: input.uploadedFile.mimeType,
    },
    questionRows: input.questionRows.map(({ type, count, marks }) => ({
      type,
      count,
      marks,
    })),
    additionalInfo: input.additionalInfo.trim(),
    dueDate: input.dueDate,
  };

  return JSON.stringify(normalized);
}
