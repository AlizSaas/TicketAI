'use server'
import { inngest } from "@/inngest/inngest";
import { validateAuthRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { $Enums } from "@prisma/client";
export  async function updateTicketStatus(ticketId: string, status: "RESOLVED" | "REJECTED") {

    try {
        const user = await validateAuthRequest()

        if(!user) {
            throw new Error("User not authenticated");
        }

        const userDb = await prisma.user.findUnique({
            where:{
                clerkId:user.id,
              
            },
            select:{
                role:true,
                companyId:true
            }
        })

        if(userDb?.role !== "MODERATOR") {
            throw new Error("User is not a moderator");
        }
        const ticket = await prisma.ticket.findUnique({
            where: {
                id: ticketId,
            },
        });
        if (!ticket) {
            throw new Error("Ticket not found");
        }
        if (ticket.status === $Enums.Status.RESOLVED || ticket.status === $Enums.Status.REJECTED) {
            throw new Error("Ticket is already resolved or rejected");
        }

        await prisma.ticket.update({
            where: {
                id: ticketId,
            },
            data: {
                status: status === "RESOLVED" ? $Enums.Status.RESOLVED : $Enums.Status.REJECTED,
            },
        });

         await inngest.send({
            name:'ticket/updated.requested',
            data:{
                ticketId: ticket.id,
                status: status,
                assignedToRole: userDb.role,

               
            }
        })

    } catch (error) {
        console.error("Error updating ticket status:", error);
        throw new Error("Failed to update ticket status");
        
    }



}

export async function makeTicketInProgress(ticketId: string,status: "IN_PROGRESS") {

    try {
        const user = await validateAuthRequest()

        if(!user) {
            throw new Error("User not authenticated");
        }

        const userDb = await prisma.user.findUnique({
            where:{
                clerkId:user.id,
              
            },
            select:{
                role:true,
                companyId:true
            }
        })


        const ticket = await prisma.ticket.findUnique({
            where: {
                id: ticketId,
            },
        });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

      

        await prisma.ticket.update({
            where: {
                id: ticketId,
            },
            data: {
               status: status
            },
        });

       

    } catch (error) {
        console.error("Error making ticket in progress:", error);
        throw new Error("Failed to make ticket in progress");
    }
}