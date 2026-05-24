"use client";

import { subscribeToJobEvents } from "./job-socket";
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

type GenerateOptions = {
  onProgress?: (progress: number) => void;
};

async function waitForJobCompletion(
  jobId: string,
  options?: GenerateOptions,
): Promise<GenerateQuestionPaperResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (action: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      clearInterval(pollIntervalId);
      unsubscribe();
      action();
    };

    const unsubscribe = subscribeToJobEvents(jobId, {
      onProgress: (event) => {
        if (typeof event.progress === "number") {
          options?.onProgress?.(event.progress);
        }
      },
      onComplete: (event) => {
        finish(() => {
          resolve({
            questionPaper: event.questionPaper,
            model: event.model,
          });
        });
      },
      onFailed: (event) => {
        void (async () => {
          try {
            const job = await getJobStatus(jobId);

            if (job.status === "COMPLETED" && job.questionPaper && job.model) {
              finish(() => {
                resolve({
                  questionPaper: job.questionPaper!,
                  model: job.model!,
                });
              });
              return;
            }

            if (job.status === "PENDING" || job.status === "GENERATING") {
              return;
            }
          } catch {
            // Fall through to reject below.
          }

          finish(() => {
            reject(new Error(event.error));
          });
        })();
      },
    });

    const pollIntervalId = setInterval(() => {
      void (async () => {
        try {
          const job = await getJobStatus(jobId);

          if (typeof job.progress === "number") {
            options?.onProgress?.(job.progress);
          }

          if (job.status === "COMPLETED") {
            if (!job.questionPaper || !job.model) {
              finish(() => {
                reject(new Error("Generation completed without a question paper"));
              });
              return;
            }

            finish(() => {
              resolve({
                questionPaper: job.questionPaper!,
                model: job.model!,
              });
            });
            return;
          }

          if (job.status === "FAILED") {
            finish(() => {
              reject(new Error(job.error ?? "Failed to generate question paper"));
            });
          }
        } catch {
          // Ignore transient polling errors; WebSocket or a later poll may succeed.
        }
      })();
    }, POLL_INTERVAL_MS);

    const timeoutId = setTimeout(() => {
      finish(() => {
        reject(
          new Error(
            "Question paper generation timed out. Please try again in a moment.",
          ),
        );
      });
    }, MAX_POLL_DURATION_MS);
  });
}

export async function generateQuestionPaper(
  payload: GenerateQuestionPaperRequest,
  options?: GenerateOptions,
): Promise<GenerateQuestionPaperResponse> {
  const { jobId } = await startQuestionPaperGeneration(payload);
  return waitForJobCompletion(jobId, options);
}
