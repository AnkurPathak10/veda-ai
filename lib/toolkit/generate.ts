"use client";

import { subscribeToToolkitJobEvents } from "./job-socket";
import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  GenerateToolkitResponse,
  StartToolkitGenerationResponse,
  ToolkitGenerateRequest,
  ToolkitJobStatusResponse,
} from "./types";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

export async function startToolkitGeneration(
  payload: ToolkitGenerateRequest,
): Promise<StartToolkitGenerationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/toolkit/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as StartToolkitGenerationResponse & {
    error?: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
  };

  if (!response.ok) {
    const fieldMessages = data.details?.fieldErrors
      ? Object.entries(data.details.fieldErrors).flatMap(([field, messages]) =>
          messages.map((message) => `${field}: ${message}`),
        )
      : [];

    const detailMessage =
      fieldMessages[0] ??
      data.details?.formErrors?.[0] ??
      data.error ??
      "Failed to start toolkit generation";

    throw new Error(detailMessage);
  }

  return data;
}

export async function getToolkitJobStatus(
  jobId: string,
): Promise<ToolkitJobStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/toolkit/jobs/${jobId}`);

  const data = (await response.json()) as ToolkitJobStatusResponse & {
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

async function waitForToolkitJobCompletion(
  jobId: string,
  options?: GenerateOptions,
): Promise<GenerateToolkitResponse> {
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

    const unsubscribe = subscribeToToolkitJobEvents(jobId, {
      onProgress: (event) => {
        if (typeof event.progress === "number") {
          options?.onProgress?.(event.progress);
        }
      },
      onComplete: (event) => {
        finish(() => {
          resolve({
            tool: event.tool,
            result: event.result,
            model: event.model,
          });
        });
      },
      onFailed: (event) => {
        finish(() => {
          reject(new Error(event.error));
        });
      },
    });

    const pollIntervalId = setInterval(() => {
      void (async () => {
        try {
          const job = await getToolkitJobStatus(jobId);

          if (typeof job.progress === "number") {
            options?.onProgress?.(job.progress);
          }

          if (job.status === "COMPLETED") {
            if (!job.tool || !job.result || !job.model) {
              finish(() => {
                reject(new Error("Generation completed without a result"));
              });
              return;
            }

            finish(() => {
              resolve({
                tool: job.tool!,
                result: job.result!,
                model: job.model!,
              });
            });
            return;
          }

          if (job.status === "FAILED") {
            finish(() => {
              reject(new Error(job.error ?? "Failed to generate toolkit result"));
            });
          }
        } catch {
          // Ignore transient polling errors.
        }
      })();
    }, POLL_INTERVAL_MS);

    const timeoutId = setTimeout(() => {
      finish(() => {
        reject(
          new Error(
            "Generation timed out. Please try again in a moment.",
          ),
        );
      });
    }, MAX_POLL_DURATION_MS);
  });
}

export async function generateToolkit(
  payload: ToolkitGenerateRequest,
  options?: GenerateOptions,
): Promise<GenerateToolkitResponse> {
  const { jobId } = await startToolkitGeneration(payload);
  return waitForToolkitJobCompletion(jobId, options);
}
