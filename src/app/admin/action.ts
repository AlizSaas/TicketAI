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

export async function updateUserSkills(userId: string, skills: string[]) {
  // Validate that the requester is an admin
 const adminUser  = await getAdminUser()

  // Update the user's skills in the database
  const updatedUser = await prisma.user.update({
    where: { id: userId, companyId: adminUser.companyId },
    data: { skills },
  });

  return updatedUser;
}
export async function deleteUser(userId: string) {
  // Validate that the requester is an admin
  const adminUser = await getAdminUser();

  // Fetch the user to check their role
  const userToDelete = await prisma.user.findUnique({
    where: { id: userId, companyId: adminUser.companyId },
  });
  if (!userToDelete) {
    throw new Error("User not found.");
  }

  // Prevent deleting an ADMIN
  if (userToDelete.role === "ADMIN") {
    throw new Error("You cannot delete an ADMIN user.");
  }

  // Delete the user from the database
  const deletedUser = await prisma.user.delete({
    where: { id: userId, companyId: adminUser.companyId },
  });

  // Optionally, remove the user from Clerk
  await (await clerkClient()).users.deleteUser(deletedUser.clerkId);

  return deletedUser;
}

