import { prisma } from "./prisma.js";

type ClerkUserProfile = {
  clerkId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

export async function findOrCreateUser(profile: ClerkUserProfile) {
  return prisma.user.upsert({
    where: { clerkId: profile.clerkId },
    update: {
      email: profile.email?.toLowerCase() ?? undefined,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      imageUrl: profile.imageUrl ?? undefined,
    },
    create: {
      clerkId: profile.clerkId,
      email: profile.email?.toLowerCase() ?? undefined,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      imageUrl: profile.imageUrl ?? undefined,
    },
  });
}
