import 'server-only'
import { cache } from 'react'
import { getAdminUser } from '@/lib/server-only'

/**
 * The trusted, server-derived identity of the admin driving the AI assistant.
 *
 * This context is built exclusively from the authenticated Clerk session and
 * the corresponding Prisma `User` row (via `getAdminUser`). It must never be
 * constructed from client-supplied input (request body, tool arguments,
 * headers, etc.) - the AI/model is never a source of truth for identity or
 * authorization.
 */
export interface AdminContext {
  userId: string
  clerkId: string
  companyId: string
  email: string
  name: string
}

/**
 * Resolves the authenticated admin's identity for the current request.
 *
 * Throws if the caller is not signed in or is not an ADMIN in their company.
 * This is the single authorization gate for the entire Admin AI feature -
 * every MCP tool receives this context and scopes all Prisma queries to it.
 */
export const getAdminMcpContext = cache(async (): Promise<AdminContext> => {
  const adminUser = await getAdminUser()

  return {
    userId: adminUser.id,
    clerkId: adminUser.clerkId,
    companyId: adminUser.companyId,
    email: adminUser.email,
    name: adminUser.firstname ?? 'Admin',
  }
})
