import type { Server, Socket } from "socket.io";
import type { ParsedQuestionPaper } from "./question-paper-schema.js";

let io: Server | null = null;

export type JobStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export type JobProgressPayload = {
  jobId: string;
  status: JobStatus;
  progress?: number;
};

export type JobCompletePayload = {
  jobId: string;
  status: "COMPLETED";
  progress: 100;
  questionPaper: ParsedQuestionPaper;
  model: string;
};

export type JobFailedPayload = {
  jobId: string;
  status: "FAILED";
  error: string;
};

export function jobRoom(jobId: string): string {
  return `job:${jobId}`;
}

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server {
  if (!io) {
    throw new Error("Socket.io server is not initialized");
  }

  return io;
}

export function emitJobProgress(payload: JobProgressPayload): void {
  getSocketServer().to(jobRoom(payload.jobId)).emit("job:progress", payload);
}

export function emitJobComplete(payload: JobCompletePayload): void {
  getSocketServer().to(jobRoom(payload.jobId)).emit("job:complete", payload);
}

export function emitJobFailed(payload: JobFailedPayload): void {
  getSocketServer().to(jobRoom(payload.jobId)).emit("job:failed", payload);
}

function isValidJobId(jobId: unknown): jobId is string {
  return typeof jobId === "string" && jobId.length > 0;
}

export function registerSocketHandlers(server: Server): void {
  server.on("connection", (socket: Socket) => {
    socket.on("job:subscribe", (payload: { jobId?: unknown }) => {
      if (isValidJobId(payload?.jobId)) {
        void socket.join(jobRoom(payload.jobId));
      }
    });

    socket.on("job:unsubscribe", (payload: { jobId?: unknown }) => {
      if (isValidJobId(payload?.jobId)) {
        void socket.leave(jobRoom(payload.jobId));
      }
    });
  });
}
