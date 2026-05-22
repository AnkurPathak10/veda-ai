import { API_BASE_URL } from "./constants";
import type {
  GenerateQuestionPaperRequest,
  GenerateQuestionPaperResponse,
} from "./question-paper";

export async function generateQuestionPaper(
  payload: GenerateQuestionPaperRequest,
): Promise<GenerateQuestionPaperResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assignments/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as GenerateQuestionPaperResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to generate question paper");
  }

  return data;
}
