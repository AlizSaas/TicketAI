'use server'

import { validateAuthRequest } from "@/lib/auth";
import { TicketFormValues } from "./user-dash-ui";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/inngest";

export async function createTicket(data: TicketFormValues) {
  const { title, description } = data;

  try {
    const user = await validateAuthRequest();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      throw new Error("User not found in DB");
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        createdById: dbUser.id,
        createdByName: dbUser.firstname,
        createdByEmail: dbUser.email, // ✅ Added email field
        createdByRole: dbUser.role, // ✅ Added role field
        companyId: dbUser.companyId, // ✅ Also required by schema

        // priority, category, etc. can be set here if needed
      },
    }); 


    await inngest.send({
        name:'ticket/created.requested',
        data:{
            ticketId: ticket.id,
            title,
            description,
            createdById: dbUser.id,
            companyId: dbUser.companyId,
        }
    })

    return ticket;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}
