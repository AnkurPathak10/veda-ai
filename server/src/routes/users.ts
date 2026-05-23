import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../lib/auth.js";
import { createNotification } from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";

function formatUserSettings(user: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  schoolName: string | null;
  schoolLocation: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    schoolName: user.schoolName,
    schoolLocation: user.schoolLocation,
  };
}

export async function handleGetUserSettings(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        schoolName: true,
        schoolLocation: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: formatUserSettings(user) });
  } catch (error) {
    console.error("Failed to get user settings:", error);
    res.status(500).json({ error: "Failed to load user settings" });
  }
}

const updateUserSettingsSchema = z.object({
  schoolName: z.string().trim().max(120).optional(),
  schoolLocation: z.string().trim().max(120).optional(),
});

export async function handleUpdateUserSettings(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const parsed = updateUserSettingsSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: dbUserId },
      data: {
        schoolName: parsed.data.schoolName,
        schoolLocation: parsed.data.schoolLocation,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        schoolName: true,
        schoolLocation: true,
      },
    });

    const schoolLabel = parsed.data.schoolName?.trim();
    const locationLabel = parsed.data.schoolLocation?.trim();

    await createNotification({
      userId: dbUserId,
      type: "SUCCESS",
      title: "Settings updated",
      message:
        schoolLabel && locationLabel
          ? `School set to ${schoolLabel}, ${locationLabel}`
          : schoolLabel
            ? `School set to ${schoolLabel}`
            : locationLabel
              ? `Location set to ${locationLabel}`
              : "Your school information was updated",
      href: "/settings",
    });

    res.json({ user: formatUserSettings(user) });
  } catch (error) {
    console.error("Failed to update user settings:", error);
    res.status(500).json({ error: "Failed to update user settings" });
  }
}

export async function handleSearchUsers(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const email =
      typeof req.query.email === "string" ? req.query.email.trim() : "";

    if (!email || email.length < 3) {
      res.status(400).json({ error: "Email query must be at least 3 characters" });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email },
        NOT: { id: dbUserId },
      },
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Failed to search users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
}
