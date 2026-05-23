import { API_BASE_URL } from "./constants";
import type {
  GenerateQuestionPaperRequest,
  GenerateQuestionPaperResponse,
  JobStatusResponse,
  StartGenerationResponse,
} from "./question-paper";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function startQuestionPaperGeneration(
  payload: GenerateQuestionPaperRequest,
): Promise<StartGenerationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assignments/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as StartGenerationResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to start question paper generation");
  }

  return data;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);

  const data = (await response.json()) as JobStatusResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to get generation status");
  }

  return data;
}

export async function generateQuestionPaper(
  payload: GenerateQuestionPaperRequest,
): Promise<GenerateQuestionPaperResponse> {
  const { jobId } = await startQuestionPaperGeneration(payload);
  const startedAt = Date.now();

  while (Date.now() - startedAt < MAX_POLL_DURATION_MS) {
    const job = await getJobStatus(jobId);

    if (job.status === "COMPLETED") {
      if (!job.questionPaper || !job.model) {
        throw new Error("Generation completed without a question paper");
      }

      return {
        questionPaper: job.questionPaper,
        model: job.model,
      };
    }

    if (job.status === "FAILED") {
      throw new Error(job.error ?? "Failed to generate question paper");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    "Question paper generation timed out. Please try again in a moment.",
  );
}
