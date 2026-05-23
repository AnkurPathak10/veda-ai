import "./load-env.js";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import { Server } from "socket.io";
import { requireBearerAuth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { closeRedis, connectRedis, pingRedis } from "./lib/redis.js";
import {
  handleCreateAssignment,
  handleDeleteAssignment,
  handleGetAssignment,
  handleListAssignments,
} from "./routes/assignments.js";
import { handleGenerateQuestionPaper } from "./routes/generate-question-paper.js";
import { handleGetJobStatus } from "./routes/jobs.js";
import { handleTranscribeSpeech } from "./routes/speech.js";
import {
  handleUpload,
  handleUploadError,
  uploadMiddleware,
} from "./routes/uploads.js";
import { closeQuestionPaperQueue } from "./queues/question-paper-queue.js";
import { registerSocketHandlers, setSocketServer } from "./lib/socket.js";
import {
  closeQuestionPaperWorker,
  startQuestionPaperWorker,
} from "./workers/question-paper-worker.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
});

const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }));

app.post(
  "/api/speech/transcribe",
  express.json({ limit: "10mb" }),
  (req, res) => {
    void handleTranscribeSpeech(req, res);
  },
);

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.post("/api/uploads", (req, res, next) => {
  uploadMiddleware(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res, next);
      return;
    }
    handleUpload(req, res);
  });
});

app.post("/api/assignments/generate", (req, res) => {
  void handleGenerateQuestionPaper(req, res);
});

app.get("/api/jobs/:jobId", (req, res) => {
  void handleGetJobStatus(req, res);
});

app.get("/api/assignments", requireBearerAuth, (req, res) => {
  void handleListAssignments(req, res);
});

app.post("/api/assignments", requireBearerAuth, (req, res) => {
  void handleCreateAssignment(req, res);
});

app.get("/api/assignments/:id", requireBearerAuth, (req, res) => {
  void handleGetAssignment(req, res);
});

app.delete("/api/assignments/:id", requireBearerAuth, (req, res) => {
  void handleDeleteAssignment(req, res);
});

app.get("/", async (_req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    const redisConnected = await pingRedis();

    res.json({
      message: "VedaAI API server is running",
      database: "connected",
      redis: redisConnected ? "connected" : "disconnected",
      endpoints: {
        health: "/health",
        uploads: "/api/uploads",
        generate: "/api/assignments/generate",
        jobs: "/api/jobs/:jobId",
        speech: "/api/speech/transcribe",
        assignments: "/api/assignments",
      },
    });
  } catch {
    const redisConnected = await pingRedis();

    res.status(503).json({
      message: "VedaAI API server is running",
      database: "disconnected",
      redis: redisConnected ? "connected" : "disconnected",
      endpoints: {
        health: "/health",
        uploads: "/api/uploads",
        generate: "/api/assignments/generate",
        jobs: "/api/jobs/:jobId",
        speech: "/api/speech/transcribe",
        assignments: "/api/assignments",
      },
    });
  }
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    const redisConnected = await pingRedis();

    if (!redisConnected) {
      res.status(503).json({
        status: "error",
        database: "connected",
        redis: "disconnected",
      });
      return;
    }

    res.json({ status: "ok", database: "connected", redis: "connected" });
  } catch {
    const redisConnected = await pingRedis();

    res.status(503).json({
      status: "error",
      database: "disconnected",
      redis: redisConnected ? "connected" : "disconnected",
    });
  }
});

setSocketServer(io);
registerSocketHandlers(io);

async function start() {
  try {
    await prisma.$connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }

  try {
    await connectRedis();
    console.log("Connected to Redis");
    startQuestionPaperWorker();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function shutdown() {
  await closeQuestionPaperWorker();
  await closeQuestionPaperQueue();
  await closeRedis();
  await prisma.$disconnect();
}

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

void start();
