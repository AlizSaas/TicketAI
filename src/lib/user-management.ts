'use server';

import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const auth = betterAuth({
  // ...your better-auth config (see previous messages)
});

// Helper to get user (replace with your better-auth user API)
async function getUser(userId: string) {
  // Assuming better-auth exposes an API like this; adapt as needed
  return await auth.api.getUser({ userId });
}

// Helper to update user metadata (adapt to your better-auth API)
async function updateUserMetadata(userId: string, metadata: Record<string, any>) {
  return await auth.api.updateUser({
    userId,
    update: { publicMetadata: metadata }
  });
}

export const createAdmin = async (userId: string, companyName: string) => {
  try {
    const user = await getUser(userId);

    if (!user || !user.firstName) {
      throw new Error("User not found or first name is missing");
    }

    const company = await prisma.company.create({
      data: {
        name: companyName,
      },
    });

    await updateUserMetadata(userId, {
      onboardingCompleted: true,
      role: 'ADMIN',
      companyId: company.id,
    });

    await prisma.user.create({
      data: {
        authId: user.id, // change to your auth ID field if needed
        firstname: user.firstName,
        email: user.email,
        companyId: company.id,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { error: "Failed to create admin. Please try again later." };
  }
};

export const createModerator = async (userId: string, invitationCode: string) => {
  try {
    const user = await getUser(userId);

    if (!user || !user.firstName) {
      throw new Error("User not found or first name is missing");
    }

    const code = await prisma.code.findFirst({
      where: {
        code: invitationCode,
        used: false,
      },
    });
    if (!code || !code.companyId) {
      throw new Error("Invalid invitation code");
    }

    await updateUserMetadata(userId, {
      onboardingCompleted: true,
      role: 'MODERATOR',
      companyId: code.companyId,
    });

    await prisma.user.create({
      data: {
        authId: user.id,
        firstname: user.firstName,
        email: user.email,
        role: 'MODERATOR',
        companyId: code.companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.code.update({
      where: { id: code.id },
      data: { used: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating moderator:", error);
    return { error: "Failed to create moderator. Please try again later." };
  }
};

export const createUser = async (userId: string, invitationCode: string) => {
  try {
    const user = await getUser(userId);

    if (!user || !user.firstName) {
      throw new Error("User not found or first name is missing");
    }

    const code = await prisma.code.findFirst({
      where: {
        code: invitationCode,
        used: false,
      },
    });
    if (!code || !code.companyId) {
      throw new Error("Invalid invitation code");
    }

    await updateUserMetadata(userId, {
      onboardingCompleted: true,
      role: 'USER',
      companyId: code.companyId,
    });

    await prisma.user.create({
      data: {
        authId: user.id,
        firstname: user.firstName,
        email: user.email,
        role: 'USER',
        companyId: code.companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.code.update({
      where: { id: code.id },
      data: { used: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user. Please try again later." };
  }
};