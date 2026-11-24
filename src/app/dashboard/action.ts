'use server'

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/server-only";
import { inngest } from "@/inngest/inngest";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

export async function createTicket(data: { title: string; description: string }) {
  const title = data.title?.trim();
  const description = data.description?.trim();

  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  if (title.length > MAX_TITLE_LENGTH || description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Title or description is too long");
  }

  try {
    const dbUser = await getUser();

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        createdById: dbUser.id,
        createdByName: dbUser.firstname,
        createdByEmail: dbUser.email,
        createdByRole: dbUser.role,
        companyId: dbUser.companyId,
      },
    });

    // The ticket is already saved; if the event can't be queued the ticket stays PENDING
    // instead of showing the user an error for a ticket that exists.
    try {
      await inngest.send({
        name: 'ticket/created.requested',
        data: {
          ticketId: ticket.id,
          title,
          description,
          createdById: dbUser.id,
          companyId: dbUser.companyId,
        },
      });
    } catch (error) {
      console.error("Failed to queue ticket assignment:", error);
    }

    return ticket;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}
