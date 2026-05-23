"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./constants";
import type { JobStatus, QuestionPaper } from "./question-paper";

export type JobProgressEvent = {
  jobId: string;
  status: JobStatus;
  progress?: number;
};

export type JobCompleteEvent = {
  jobId: string;
  status: "COMPLETED";
  progress: 100;
  questionPaper: QuestionPaper;
  model: string;
};

export type JobFailedEvent = {
  jobId: string;
  status: "FAILED";
  error: string;
};

let socket: Socket | null = null;

export function getJobSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  return socket;
}

export function subscribeToJobEvents(
  jobId: string,
  handlers: {
    onProgress?: (event: JobProgressEvent) => void;
    onComplete?: (event: JobCompleteEvent) => void;
    onFailed?: (event: JobFailedEvent) => void;
  },
): () => void {
  const client = getJobSocket();

  if (!client.connected) {
    client.connect();
  }

  const handleProgress = (event: JobProgressEvent) => {
    if (event.jobId === jobId) {
      handlers.onProgress?.(event);
    }
  };

  const handleComplete = (event: JobCompleteEvent) => {
    if (event.jobId === jobId) {
      handlers.onComplete?.(event);
    }
  };

  const handleFailed = (event: JobFailedEvent) => {
    if (event.jobId === jobId) {
      handlers.onFailed?.(event);
    }
  };

  client.on("job:progress", handleProgress);
  client.on("job:complete", handleComplete);
  client.on("job:failed", handleFailed);
  client.emit("job:subscribe", { jobId });

  return () => {
    client.emit("job:unsubscribe", { jobId });
    client.off("job:progress", handleProgress);
    client.off("job:complete", handleComplete);
    client.off("job:failed", handleFailed);
  };
}
