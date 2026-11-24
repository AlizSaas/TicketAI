'use server'

import { prisma } from '@/lib/prisma';

import { clerkClient } from '@clerk/nextjs/server';
import { Role } from '@prisma/client';
import { getAdminUser } from '@/lib/server-only';

export async function changeUserRole(userId: string, newRole: string) {
  // Validate that the requester is an admin
  const adminUser = await getAdminUser()

  // Ensure newRole is a valid Role enum value
  if (!Object.values(Role).includes(newRole as Role)) {
    throw new Error('Invalid role value');
  }

  // Only users of the admin's own company can be changed
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, companyId: adminUser.companyId },
  });

  if (!targetUser) {
    throw new Error('User not found.');
  }

  if (targetUser.id === adminUser.id) {
    throw new Error('You cannot change your own role.');
  }

  // Update the user's role in the database
  const updatedUser = await prisma.user.update({
    where: { id: targetUser.id },
    data: { role: newRole as Role },
  });

  // Keep Clerk's public metadata in sync so redirects use the new role
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

  // Remove the user from Clerk; the DB record is already gone so don't fail the action if Clerk errors
  try {
    await (await clerkClient()).users.deleteUser(deletedUser.clerkId);
  } catch (error) {
    console.error("Failed to delete Clerk user:", error);
  }

  return deletedUser;
}

