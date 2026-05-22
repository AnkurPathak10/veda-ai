import { verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";
import { findOrCreateUser } from "./user.js";

export type AuthenticatedRequest = Request & {
  clerkUserId: string;
  dbUserId: string;
};

export async function requireBearerAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = payload.sub;

    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await findOrCreateUser({ clerkId: clerkUserId });
    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.clerkUserId = clerkUserId;
    authenticatedRequest.dbUserId = user.id;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}

export async function attachDbUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next();
}
