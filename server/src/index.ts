import "./load-env.js";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import { Server } from "socket.io";
import { requireBearerAuth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import {
  handleCreateAssignment,
  handleDeleteAssignment,
  handleGetAssignment,
  handleListAssignments,
} from "./routes/assignments.js";
import { handleGenerateQuestionPaper } from "./routes/generate-question-paper.js";
import {
  handleUpload,
  handleUploadError,
  uploadMiddleware,
} from "./routes/uploads.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
});

const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }));
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
    res.json({
      message: "VedaAI API server is running",
      database: "connected",
      endpoints: {
        health: "/health",
        uploads: "/api/uploads",
        generate: "/api/assignments/generate",
        assignments: "/api/assignments",
      },
    });
  } catch {
    res.status(503).json({
      message: "VedaAI API server is running",
      database: "disconnected",
      endpoints: {
        health: "/health",
        uploads: "/api/uploads",
        generate: "/api/assignments/generate",
        assignments: "/api/assignments",
      },
    });
  }
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    // WebSocket handlers will be added during feature implementation.
  });
});

async function start() {
  try {
    await prisma.$connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

void start();
