import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { questionPaperSchema } from "../lib/question-paper-schema.js";

const uploadedFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  url: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

const questionRowSchema = z.object({
  type: z.enum(["mcq", "short", "diagram", "numerical"]),
  count: z.number().int().min(1),
  marks: z.number().int().min(1),
});

const createAssignmentSchema = z.object({
  title: z.string().trim().min(1).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  additionalInfo: z.string().optional(),
  uploadedFile: uploadedFileSchema,
  questionRows: z.array(questionRowSchema).min(1),
  questionPaper: questionPaperSchema,
});

function deriveTitle(
  explicitTitle: string | undefined,
  subject: string | undefined,
) {
  if (explicitTitle?.trim()) {
    return explicitTitle.trim();
  }

  if (subject?.trim()) {
    return `Quiz on ${subject.trim()}`;
  }

  return "Untitled Assignment";
}

function formatAssignmentListItem(assignment: {
  id: string;
  title: string;
  dueDate: string | null;
  createdAt: Date;
  status: string;
  questionPapers: Array<{ status: string }>;
}) {
  return {
    id: assignment.id,
    title: assignment.title,
    dueDate: assignment.dueDate,
    assignedDate: assignment.createdAt.toISOString(),
    status: assignment.status,
    hasQuestionPaper: assignment.questionPapers.some(
      (paper) => paper.status === "COMPLETED",
    ),
  };
}

export async function handleListAssignments(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;

    const assignments = await prisma.assignment.findMany({
      where: { userId: dbUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        dueDate: true,
        createdAt: true,
        status: true,
        questionPapers: {
          select: { status: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    res.json({
      assignments: assignments.map(formatAssignmentListItem),
      total: assignments.length,
    });
  } catch (error) {
    console.error("Failed to list assignments:", error);
    res.status(500).json({ error: "Failed to load assignments" });
  }
}

export async function handleCreateAssignment(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const parsed = createAssignmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const input = parsed.data;
    const title = deriveTitle(
      input.title,
      input.questionPaper.header.subject,
    );

    const assignment = await prisma.assignment.create({
      data: {
        title,
        dueDate: input.dueDate,
        additionalInfo: input.additionalInfo?.trim() || null,
        uploadedFile: input.uploadedFile,
        questionRows: input.questionRows,
        status: "ACTIVE",
        userId: dbUserId,
        questionPapers: {
          create: {
            content: JSON.stringify(input.questionPaper),
            status: "COMPLETED",
          },
        },
      },
      include: {
        questionPapers: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const questionPaper = assignment.questionPapers[0]?.content
      ? (JSON.parse(assignment.questionPapers[0].content) as unknown)
      : null;

    res.status(201).json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        assignedDate: assignment.createdAt.toISOString(),
        status: assignment.status,
        additionalInfo: assignment.additionalInfo,
        uploadedFile: assignment.uploadedFile,
        questionRows: assignment.questionRows,
        questionPaper,
      },
    });
  } catch (error) {
    console.error("Failed to create assignment:", error);
    res.status(500).json({ error: "Failed to save assignment" });
  }
}

function getRouteId(req: Request): string | null {
  const raw = req.params.id;
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return null;
}

export async function handleGetAssignment(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "Invalid assignment id" });
      return;
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id, userId: dbUserId },
      include: {
        questionPapers: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    const latestPaper = assignment.questionPapers[0];
    const questionPaper =
      latestPaper?.content != null
        ? (JSON.parse(latestPaper.content) as unknown)
        : null;

    res.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        assignedDate: assignment.createdAt.toISOString(),
        status: assignment.status,
        additionalInfo: assignment.additionalInfo,
        uploadedFile: assignment.uploadedFile,
        questionRows: assignment.questionRows,
        questionPaper,
      },
    });
  } catch (error) {
    console.error("Failed to get assignment:", error);
    res.status(500).json({ error: "Failed to load assignment" });
  }
}

export async function handleDeleteAssignment(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "Invalid assignment id" });
      return;
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id, userId: dbUserId },
      select: { id: true },
    });

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    await prisma.assignment.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
}
