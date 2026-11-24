import 'server-only'
import { cache } from 'react'
import { prisma } from './prisma'
import { validateAuthRequest } from './auth'
import { currentUser } from '@clerk/nextjs/server'

export const getAdminUser = cache(async () => {
    const authUser = await validateAuthRequest()
    const userDb = await prisma.user.findUnique({
        where: {
            clerkId: authUser.id,
            role: 'ADMIN',
            companyId: authUser.publicMetadata.companyId!
        }
    })

    if (!userDb) {
        throw new Error('Unauthorized: Only admins can access this resource')
    }

    return userDb
})

export const getModeratorUser = cache(async () => {
    const authUser = await validateAuthRequest()
    const userDb = await prisma.user.findUnique({
        where: {
            clerkId: authUser.id,
            role: 'MODERATOR',
            companyId: authUser.publicMetadata.companyId!
        }
    })

    if (!userDb) {
        throw new Error('Unauthorized: Only moderators can access this resource')
    }

    return userDb
})

export const getUser = cache(async () => {
    const authUser = await validateAuthRequest()
    const userDb = await prisma.user.findUnique({
        where: {
            clerkId: authUser.id,
            companyId: authUser.publicMetadata.companyId!
        }
    })
    if (!userDb) {
        throw new Error('Unauthorized: User not found')
    }
    return userDb
}
)

// Non-throwing lookup for route handlers: returns the DB user for the signed-in Clerk user, or null
export async function getSessionUser() {
    const authUser = await currentUser()
    if (!authUser) return null

    return prisma.user.findUnique({
        where: { clerkId: authUser.id },
    })
}
