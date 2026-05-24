import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { AuthenticatedRequest } from "../lib/auth.js";
import {
  CACHE_KEYS,
  CACHE_TTL,
  cacheDel,
  cacheGet,
  cacheSet,
} from "../lib/cache.js";
import { prisma } from "../lib/prisma.js";

const toolkitToolSchema = z.enum([
  "lesson-plan",
  "worksheet",
  "differentiated-papers",
  "chapter-summary",
]);

const saveLibraryItemSchema = z.object({
  tool: toolkitToolSchema,
  title: z.string().trim().min(1).max(200),
  content: z.record(z.string(), z.unknown()),
});

const TOOL_TO_DB: Record<
  z.infer<typeof toolkitToolSchema>,
  "LESSON_PLAN" | "WORKSHEET" | "DIFFERENTIATED_PAPERS" | "CHAPTER_SUMMARY"
> = {
  "lesson-plan": "LESSON_PLAN",
  worksheet: "WORKSHEET",
  "differentiated-papers": "DIFFERENTIATED_PAPERS",
  "chapter-summary": "CHAPTER_SUMMARY",
};

const DB_TO_TOOL: Record<
  "LESSON_PLAN" | "WORKSHEET" | "DIFFERENTIATED_PAPERS" | "CHAPTER_SUMMARY",
  z.infer<typeof toolkitToolSchema>
> = {
  LESSON_PLAN: "lesson-plan",
  WORKSHEET: "worksheet",
  DIFFERENTIATED_PAPERS: "differentiated-papers",
  CHAPTER_SUMMARY: "chapter-summary",
};

function formatLibraryListItem(item: {
  id: string;
  tool: keyof typeof DB_TO_TOOL;
  title: string;
  createdAt: Date;
}) {
  return {
    id: item.id,
    tool: DB_TO_TOOL[item.tool],
    title: item.title,
    createdAt: item.createdAt.toISOString(),
  };
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

export async function handleListLibraryItems(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const cacheKey = CACHE_KEYS.libraryList(dbUserId);
    const cached = await cacheGet<{
      items: ReturnType<typeof formatLibraryListItem>[];
      total: number;
    }>(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }

    const items = await prisma.libraryItem.findMany({
      where: { userId: dbUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tool: true,
        title: true,
        createdAt: true,
      },
    });

    const payload = {
      items: items.map(formatLibraryListItem),
      total: items.length,
    };

    await cacheSet(cacheKey, payload, CACHE_TTL.LIBRARY_LIST);

    res.json(payload);
  } catch (error) {
    console.error("Failed to list library items:", error);
    res.status(500).json({ error: "Failed to load library" });
  }
}

export async function handleGetLibraryItem(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "Invalid library item id" });
      return;
    }

    const item = await prisma.libraryItem.findFirst({
      where: { id, userId: dbUserId },
    });

    if (!item) {
      res.status(404).json({ error: "Library item not found" });
      return;
    }

    res.json({
      item: {
        id: item.id,
        tool: DB_TO_TOOL[item.tool],
        title: item.title,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to get library item:", error);
    res.status(500).json({ error: "Failed to load library item" });
  }
}

export async function handleSaveLibraryItem(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const parsedBody = saveLibraryItemSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsedBody.error.flatten(),
      });
      return;
    }

    const item = await prisma.libraryItem.create({
      data: {
        userId: dbUserId,
        tool: TOOL_TO_DB[parsedBody.data.tool],
        title: parsedBody.data.title,
        content: parsedBody.data.content as Prisma.InputJsonValue,
      },
    });

    await cacheDel(CACHE_KEYS.libraryList(dbUserId));

    res.status(201).json({
      item: formatLibraryListItem(item),
    });
  } catch (error) {
    console.error("Failed to save library item:", error);
    res.status(500).json({ error: "Failed to save to library" });
  }
}

export async function handleDeleteLibraryItem(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "Invalid library item id" });
      return;
    }

    const item = await prisma.libraryItem.findFirst({
      where: { id, userId: dbUserId },
      select: { id: true },
    });

    if (!item) {
      res.status(404).json({ error: "Library item not found" });
      return;
    }

    await prisma.libraryItem.delete({ where: { id: item.id } });
    await cacheDel(CACHE_KEYS.libraryList(dbUserId));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete library item:", error);
    res.status(500).json({ error: "Failed to delete library item" });
  }
}
