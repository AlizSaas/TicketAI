'use server'

import { prisma } from '@/lib/prisma';

import { clerkClient } from '@clerk/nextjs/server';
import { Role } from '@prisma/client';
import { getAdminUser } from '@/lib/server-only';

export async function changeUserRole(userId: string, newRole: string) {
  // Validate that the requester is an admin
 const adminUser  = await getAdminUser()

  // Ensure newRole is a valid Role enum value
  if (!Object.values(Role).includes(newRole as Role)) {
    throw new Error('Invalid role value');
  }

  // Update the user's role in the database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as Role },
  });

  // Optionally update Clerk's public metadata for consistency
  await (await clerkClient()).users.updateUserMetadata(updatedUser.clerkId, {
    publicMetadata: {
      role: newRole,
    },
  });

  return updatedUser;
}


export  async function deleteTicket(id: string) {

   const adminUser  = await getAdminUser()

   const deletedTicket = await prisma.ticket.delete({
    where:{ id: id, companyId: adminUser.companyId }
   })


   if (!deletedTicket) {
     throw new Error("Ticket not found or already deleted")
   }

   return deletedTicket
}