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
import {
  handleAddGroupMember,
  handleCreateGroup,
  handleGetGroup,
  handleLeaveGroup,
  handleListGroups,
  handleRemoveGroupMember,
  handleShareAssignmentToGroup,
} from "./routes/groups.js";
import { handleGenerateQuestionPaper } from "./routes/generate-question-paper.js";
import { handleGetJobStatus } from "./routes/jobs.js";
import { handleGenerateToolkit } from "./routes/toolkit-generate.js";
import { handleGetToolkitJobStatus } from "./routes/toolkit-jobs.js";
import {
  handleDeleteLibraryItem,
  handleGetLibraryItem,
  handleListLibraryItems,
  handleSaveLibraryItem,
} from "./routes/library.js";
import {
  handleCreateNotification,
  handleListNotifications,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
} from "./routes/notifications.js";
import { handleTranscribeSpeech } from "./routes/speech.js";
import {
  handleGetUserSettings,
  handleSearchUsers,
  handleUpdateUserSettings,
} from "./routes/users.js";
import {
  handleUpload,
  handleUploadError,
  uploadMiddleware,
} from "./routes/uploads.js";
import { closeQuestionPaperQueue } from "./queues/question-paper-queue.js";
import { closeToolkitQueue } from "./queues/toolkit-queue.js";
import { registerSocketHandlers, setSocketServer } from "./lib/socket.js";
import {
  closeQuestionPaperWorker,
  startQuestionPaperWorker,
} from "./workers/question-paper-worker.js";
import {
  closeToolkitWorker,
  startToolkitWorker,
} from "./workers/toolkit-worker.js";

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

app.post("/api/toolkit/generate", (req, res) => {
  void handleGenerateToolkit(req, res);
});

app.get("/api/toolkit/jobs/:jobId", (req, res) => {
  void handleGetToolkitJobStatus(req, res);
});

app.get("/api/library", requireBearerAuth, (req, res) => {
  void handleListLibraryItems(req, res);
});

app.post("/api/library", requireBearerAuth, (req, res) => {
  void handleSaveLibraryItem(req, res);
});

app.get("/api/library/:id", requireBearerAuth, (req, res) => {
  void handleGetLibraryItem(req, res);
});

app.delete("/api/library/:id", requireBearerAuth, (req, res) => {
  void handleDeleteLibraryItem(req, res);
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

app.get("/api/notifications", requireBearerAuth, (req, res) => {
  void handleListNotifications(req, res);
});

app.post("/api/notifications", requireBearerAuth, (req, res) => {
  void handleCreateNotification(req, res);
});

app.patch("/api/notifications/read-all", requireBearerAuth, (req, res) => {
  void handleMarkAllNotificationsRead(req, res);
});

app.patch("/api/notifications/:id/read", requireBearerAuth, (req, res) => {
  void handleMarkNotificationRead(req, res);
});

app.get("/api/users/me", requireBearerAuth, (req, res) => {
  void handleGetUserSettings(req, res);
});

app.patch("/api/users/me", requireBearerAuth, (req, res) => {
  void handleUpdateUserSettings(req, res);
});

app.get("/api/users/search", requireBearerAuth, (req, res) => {
  void handleSearchUsers(req, res);
});

app.get("/api/groups", requireBearerAuth, (req, res) => {
  void handleListGroups(req, res);
});

app.post("/api/groups", requireBearerAuth, (req, res) => {
  void handleCreateGroup(req, res);
});

app.get("/api/groups/:id", requireBearerAuth, (req, res) => {
  void handleGetGroup(req, res);
});

app.post("/api/groups/:id/members", requireBearerAuth, (req, res) => {
  void handleAddGroupMember(req, res);
});

app.delete("/api/groups/:id/members/:memberId", requireBearerAuth, (req, res) => {
  void handleRemoveGroupMember(req, res);
});

app.post("/api/groups/:id/share", requireBearerAuth, (req, res) => {
  void handleShareAssignmentToGroup(req, res);
});

app.delete("/api/groups/:id/leave", requireBearerAuth, (req, res) => {
  void handleLeaveGroup(req, res);
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
        toolkit: "/api/toolkit/generate",
        toolkitJobs: "/api/toolkit/jobs/:jobId",
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
        toolkit: "/api/toolkit/generate",
        toolkitJobs: "/api/toolkit/jobs/:jobId",
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
    startToolkitWorker();
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
  await closeToolkitWorker();
  await closeQuestionPaperQueue();
  await closeToolkitQueue();
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
