'use server'

import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "../prisma";
import { validateAuthRequest } from "../auth";

async function syncClerkMetadata(clerkId: string, role: Role, companyId: string) {
    await (await clerkClient()).users.updateUserMetadata(clerkId, {
        publicMetadata: {
            onboardingCompleted: true,
            role,
            companyId,
        },
    })
}

// The caller is always the signed-in user; the client never chooses which account gets onboarded.
export const createAdmin = async (companyName: string) => {
    try {
        const user = await validateAuthRequest()
        const name = companyName.trim()

        if (!name) {
            return { error: "Company name is required." }
        }

        const existing = await prisma.user.findUnique({ where: { clerkId: user.id } })
        if (existing) {
            await syncClerkMetadata(user.id, existing.role, existing.companyId)
            return { success: true, role: existing.role }
        }

        const dbUser = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({ data: { name } })
            return tx.user.create({
                data: {
                    clerkId: user.id,
                    firstname: user.firstName || null,
                    email: user.emailAddresses[0]?.emailAddress || "",
                    companyId: company.id,
                    role: 'ADMIN',
                },
            })
        })

        await syncClerkMetadata(user.id, dbUser.role, dbUser.companyId)

        return { success: true, role: dbUser.role }
    } catch (error) {
        console.error("Error creating admin:", error)
        return { error: "Failed to create company. Please try again later." }
    }
}

async function joinCompanyWithCode(invitationCode: string, role: 'USER' | 'MODERATOR') {
    try {
        const user = await validateAuthRequest()

        const existing = await prisma.user.findUnique({ where: { clerkId: user.id } })
        if (existing) {
            await syncClerkMetadata(user.id, existing.role, existing.companyId)
            return { success: true, role: existing.role }
        }

        const dbUser = await prisma.$transaction(async (tx) => {
            const code = await tx.code.findFirst({
                where: { code: invitationCode.trim(), used: false },
            })

            if (!code || !code.companyId) {
                throw new Error("INVALID_CODE")
            }

            // Atomically claim the code so it can't be redeemed twice
            const claimed = await tx.code.updateMany({
                where: { id: code.id, used: false },
                data: { used: true },
            })

            if (claimed.count !== 1) {
                throw new Error("INVALID_CODE")
            }

            return tx.user.create({
                data: {
                    clerkId: user.id,
                    firstname: user.firstName || null,
                    email: user.emailAddresses[0]?.emailAddress || "",
                    role,
                    companyId: code.companyId,
                },
            })
        })

        await syncClerkMetadata(user.id, dbUser.role, dbUser.companyId)

        return { success: true, role: dbUser.role }
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CODE") {
            return { error: "Invalid or already used invitation code." }
        }
        console.error(`Error creating ${role.toLowerCase()}:`, error)
        return { error: "Failed to join company. Please try again later." }
    }
}

export const createModerator = async (invitationCode: string) => joinCompanyWithCode(invitationCode, 'MODERATOR')

export const createUser = async (invitationCode: string) => joinCompanyWithCode(invitationCode, 'USER')
