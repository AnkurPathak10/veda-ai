import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../lib/auth.js";
import { createNotification, createNotificationsForUsers } from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";

function getRouteId(req: Request, key = "id"): string | null {
  const raw = req.params[key];
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return null;
}

async function getMembership(groupId: string, userId: string) {
  return prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
}

function formatGroupListItem(group: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: { members: number; sharedAssignments: number };
  members: Array<{
    role: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
  }>;
}) {
  const currentMember = group.members[0];

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    memberCount: group._count.members,
    sharedAssignmentCount: group._count.sharedAssignments,
    role: currentMember?.role ?? "MEMBER",
    createdAt: group.createdAt.toISOString(),
  };
}

export async function handleListGroups(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;

    const memberships = await prisma.groupMember.findMany({
      where: { userId: dbUserId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true, sharedAssignments: true },
            },
            members: {
              where: { userId: dbUserId },
              select: {
                role: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    res.json({
      groups: memberships.map((membership) =>
        formatGroupListItem({
          ...membership.group,
          members: membership.group.members,
        }),
      ),
    });
  } catch (error) {
    console.error("Failed to list groups:", error);
    res.status(500).json({ error: "Failed to load groups" });
  }
}

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
});

export async function handleCreateGroup(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const parsed = createGroupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const group = await prisma.group.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        createdById: dbUserId,
        members: {
          create: {
            userId: dbUserId,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: {
          select: { members: true, sharedAssignments: true },
        },
        members: {
          where: { userId: dbUserId },
          select: {
            role: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      group: formatGroupListItem(group),
    });
  } catch (error) {
    console.error("Failed to create group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
}

export async function handleGetGroup(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "Invalid group id" });
      return;
    }

    const membership = await getMembership(id, dbUserId);

    if (!membership) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        sharedAssignments: {
          include: {
            assignment: {
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
            },
            sharedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { sharedAt: "desc" },
        },
      },
    });

    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    res.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        role: membership.role,
        createdAt: group.createdAt.toISOString(),
        members: group.members.map((member) => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
          user: member.user,
        })),
        sharedAssignments: group.sharedAssignments.map((shared) => ({
          id: shared.id,
          sharedAt: shared.sharedAt.toISOString(),
          sharedBy: shared.sharedBy,
          assignment: {
            id: shared.assignment.id,
            title: shared.assignment.title,
            dueDate: shared.assignment.dueDate,
            assignedDate: shared.assignment.createdAt.toISOString(),
            status: shared.assignment.status,
            hasQuestionPaper: shared.assignment.questionPapers.some(
              (paper) => paper.status === "COMPLETED",
            ),
          },
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get group:", error);
    res.status(500).json({ error: "Failed to load group" });
  }
}

const addMemberSchema = z.object({
  email: z.string().trim().email(),
});

export async function handleAddGroupMember(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const groupId = getRouteId(req);
    const parsed = addMemberSchema.safeParse(req.body);

    if (!groupId) {
      res.status(400).json({ error: "Invalid group id" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const membership = await getMembership(groupId, dbUserId);

    if (!membership || membership.role !== "OWNER") {
      res.status(403).json({ error: "Only group owners can add members" });
      return;
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        email: parsed.data.email.toLowerCase(),
      },
    });

    if (!targetUser) {
      res.status(404).json({
        error: "No user found with that email. They must sign up first.",
      });
      return;
    }

    if (targetUser.id === dbUserId) {
      res.status(400).json({ error: "You are already in this group" });
      return;
    }

    const existingMember = await getMembership(groupId, targetUser.id);

    if (existingMember) {
      res.status(400).json({ error: "User is already a member of this group" });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    });

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id,
        role: "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });

    await createNotification({
      userId: targetUser.id,
      type: "INFO",
      title: "Added to a group",
      message: `You were added to "${group?.name ?? "a group"}"`,
      href: `/groups/${groupId}`,
    });

    res.status(201).json({
      member: {
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        user: member.user,
      },
    });
  } catch (error) {
    console.error("Failed to add group member:", error);
    res.status(500).json({ error: "Failed to add group member" });
  }
}

export async function handleRemoveGroupMember(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const groupId = getRouteId(req);
    const memberId = getRouteId(req, "memberId");

    if (!groupId || !memberId) {
      res.status(400).json({ error: "Invalid group or member id" });
      return;
    }

    const ownerMembership = await getMembership(groupId, dbUserId);

    if (!ownerMembership || ownerMembership.role !== "OWNER") {
      res.status(403).json({ error: "Only group owners can remove members" });
      return;
    }

    const targetMember = await prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!targetMember) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    if (targetMember.userId === dbUserId) {
      res.status(400).json({
        error: "Use Leave group to remove yourself from the group",
      });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    });

    await prisma.groupMember.delete({ where: { id: memberId } });

    await createNotification({
      userId: targetMember.userId,
      type: "INFO",
      title: "Removed from group",
      message: `You were removed from "${group?.name ?? "a group"}"`,
      href: "/groups",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove group member:", error);
    res.status(500).json({ error: "Failed to remove group member" });
  }
}

const shareAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
});

export async function handleShareAssignmentToGroup(
  req: Request,
  res: Response,
) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const groupId = getRouteId(req);
    const parsed = shareAssignmentSchema.safeParse(req.body);

    if (!groupId) {
      res.status(400).json({ error: "Invalid group id" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const membership = await getMembership(groupId, dbUserId);

    if (!membership) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id: parsed.data.assignmentId, userId: dbUserId },
      select: { id: true, title: true },
    });

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    const existingShare = await prisma.sharedAssignment.findFirst({
      where: {
        groupId,
        assignmentId: assignment.id,
      },
    });

    if (existingShare) {
      res.status(400).json({ error: "Assignment is already shared in this group" });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        name: true,
        members: {
          where: { userId: { not: dbUserId } },
          select: { userId: true },
        },
      },
    });

    const shared = await prisma.sharedAssignment.create({
      data: {
        groupId,
        assignmentId: assignment.id,
        sharedById: dbUserId,
      },
    });

    const sharer = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { firstName: true, lastName: true },
    });

    const sharerName =
      [sharer?.firstName, sharer?.lastName].filter(Boolean).join(" ") ||
      "Someone";

    await createNotificationsForUsers(
      group?.members.map((member) => member.userId) ?? [],
      {
        type: "INFO",
        title: "Assignment shared",
        message: `${sharerName} shared "${assignment.title}" in ${group?.name ?? "your group"}`,
        href: `/groups/${groupId}`,
      },
    );

    res.status(201).json({
      sharedAssignment: {
        id: shared.id,
        sharedAt: shared.sharedAt.toISOString(),
        assignmentId: assignment.id,
      },
    });
  } catch (error) {
    console.error("Failed to share assignment:", error);
    res.status(500).json({ error: "Failed to share assignment" });
  }
}

export async function handleLeaveGroup(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const groupId = getRouteId(req);

    if (!groupId) {
      res.status(400).json({ error: "Invalid group id" });
      return;
    }

    const membership = await getMembership(groupId, dbUserId);

    if (!membership) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    if (membership.role === "OWNER") {
      const ownerCount = await prisma.groupMember.count({
        where: { groupId, role: "OWNER" },
      });

      const memberCount = await prisma.groupMember.count({
        where: { groupId },
      });

      if (memberCount > 1 && ownerCount === 1) {
        res.status(400).json({
          error: "Transfer ownership or remove all members before leaving",
        });
        return;
      }

      if (memberCount === 1) {
        await prisma.group.delete({ where: { id: groupId } });
        res.json({ success: true });
        return;
      }
    }

    await prisma.groupMember.delete({ where: { id: membership.id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to leave group:", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
}

export async function canAccessAssignment(
  assignmentId: string,
  userId: string,
): Promise<boolean> {
  const owned = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId },
    select: { id: true },
  });

  if (owned) {
    return true;
  }

  const shared = await prisma.sharedAssignment.findFirst({
    where: {
      assignmentId,
      group: {
        members: {
          some: { userId },
        },
      },
    },
    select: { id: true },
  });

  return Boolean(shared);
}
