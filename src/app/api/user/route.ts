import { prisma } from '@/lib/prisma'
import { validateAuthRequest } from '@/lib/auth'
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const loggedInUser = await validateAuthRequest();
  if (!loggedInUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDb = await prisma.user.findUnique({
    where: { clerkId: loggedInUser.id },
  });

  if (!userDb) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const userData = await prisma.user.findUnique({
    where: {
      clerkId: userDb.clerkId,
    },
    select: {
      tickets: {
        orderBy: {
          createdAt: 'desc', // Change 'createdAt' to your ticket's date field if different
        },
      },
    },
  });

  return Response.json(userData, { status: 200 });
}
