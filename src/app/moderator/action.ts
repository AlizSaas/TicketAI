'use server'
import { inngest } from "@/inngest/inngest";
import { prisma } from "@/lib/prisma";
import { getModeratorUser } from "@/lib/server-only";
import { $Enums } from "@prisma/client";

// Moderators may only act on tickets in their own company that are assigned to them
async function getOwnedTicket(ticketId: string) {
    const moderator = await getModeratorUser()

    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId,
            companyId: moderator.companyId,
            assignedToId: moderator.id,
        },
    })

    if (!ticket) {
        throw new Error("Ticket not found")
    }

    return { moderator, ticket }
}

export async function updateTicketStatus(ticketId: string, status: "RESOLVED" | "REJECTED") {
    if (status !== "RESOLVED" && status !== "REJECTED") {
        throw new Error("Invalid status")
    }

    const { moderator, ticket } = await getOwnedTicket(ticketId)

    if (ticket.status === $Enums.Status.RESOLVED || ticket.status === $Enums.Status.REJECTED) {
        throw new Error("Ticket is already resolved or rejected")
    }

    await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
            status: status === "RESOLVED" ? $Enums.Status.RESOLVED : $Enums.Status.REJECTED,
        },
    })

    // The status is already saved; a failed notification event must not fail the action
    try {
        await inngest.send({
            name: 'ticket/updated.requested',
            data: {
                ticketId: ticket.id,
                status,
                assignedToRole: moderator.role,
            },
        })
    } catch (error) {
        console.error("Failed to send ticket update event:", error)
    }
}

export async function makeTicketInProgress(ticketId: string, status: "IN_PROGRESS") {
    if (status !== "IN_PROGRESS") {
        throw new Error("Invalid status")
    }

    const { ticket } = await getOwnedTicket(ticketId)

    if (ticket.status !== $Enums.Status.PENDING) {
        throw new Error("Only pending tickets can be started")
    }

    await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: $Enums.Status.IN_PROGRESS },
    })
}
