"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  JobStatus,
  ToolkitResult,
  ToolkitToolId,
} from "./types";

export type ToolkitJobProgressEvent = {
  jobId: string;
  status: JobStatus;
  progress?: number;
};

export type ToolkitJobCompleteEvent = {
  jobId: string;
  status: "COMPLETED";
  progress: 100;
  tool: ToolkitToolId;
  result: ToolkitResult;
  model: string;
};

export type ToolkitJobFailedEvent = {
  jobId: string;
  status: "FAILED";
  error: string;
};

let socket: Socket | null = null;

export function getToolkitJobSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  return socket;
}

export function subscribeToToolkitJobEvents(
  jobId: string,
  handlers: {
    onProgress?: (event: ToolkitJobProgressEvent) => void;
    onComplete?: (event: ToolkitJobCompleteEvent) => void;
    onFailed?: (event: ToolkitJobFailedEvent) => void;
  },
): () => void {
  const client = getToolkitJobSocket();

  if (!client.connected) {
    client.connect();
  }

  const handleProgress = (event: ToolkitJobProgressEvent) => {
    if (event.jobId === jobId) {
      handlers.onProgress?.(event);
    }
  };

  const handleComplete = (event: ToolkitJobCompleteEvent) => {
    if (event.jobId === jobId) {
      handlers.onComplete?.(event);
    }
  };

  const handleFailed = (event: ToolkitJobFailedEvent) => {
    if (event.jobId === jobId) {
      handlers.onFailed?.(event);
    }
  };

  client.on("toolkit:progress", handleProgress);
  client.on("toolkit:complete", handleComplete);
  client.on("toolkit:failed", handleFailed);
  client.emit("job:subscribe", { jobId });

  return () => {
    client.emit("job:unsubscribe", { jobId });
    client.off("toolkit:progress", handleProgress);
    client.off("toolkit:complete", handleComplete);
    client.off("toolkit:failed", handleFailed);
  };
}
