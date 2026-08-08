import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ToolError, toolFailureSchema } from '../errors'
import { defineTool, type AnyToolDefinition } from './types'

const roleEnum = z.enum(['USER', 'MODERATOR', 'ADMIN'])

const userSummarySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  role: roleEnum,
  skills: z.array(z.string()),
  assignedCount: z.number(),
  createdCount: z.number(),
})

const listUsersOutputSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), count: z.number(), users: z.array(userSummarySchema) }),
  toolFailureSchema,
])
type ListUsersOutput = z.infer<typeof listUsersOutputSchema>

const getUserOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    user: z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
      role: roleEnum,
      skills: z.array(z.string()),
      createdAt: z.string(),
    }),
    stats: z.object({
      totalAssigned: z.number(),
      totalCreated: z.number(),
      pending: z.number(),
      inProgress: z.number(),
      resolved: z.number(),
      rejected: z.number(),
    }),
  }),
  toolFailureSchema,
])
type GetUserOutput = z.infer<typeof getUserOutputSchema>

export const listUsers = defineTool({
  name: 'list_users',
  description:
    "Find users in the admin's company. Supports filtering by role, name, email, and skill. Never returns users from another company.",
  inputShape: {
    role: roleEnum.optional().describe('Filter by role.'),
    name: z.string().optional().describe('Filter by name (partial match).'),
    email: z.string().optional().describe('Filter by email (partial match).'),
    skill: z.string().optional().describe('Filter by a skill the user has (partial match).'),
    limit: z.number().int().min(1).max(50).optional().describe('Max number of results to return (default 20, max 50).'),
  },
  outputSchema: listUsersOutputSchema,
  handler: async (context, input): Promise<ListUsersOutput> => {
    const where: Prisma.UserWhereInput = { companyId: context.companyId }

    if (input.role) where.role = input.role
    if (input.name) where.firstname = { contains: input.name, mode: 'insensitive' }
    if (input.email) where.email = { contains: input.email, mode: 'insensitive' }

    const limit = input.limit ?? 20

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstname: true,
        email: true,
        role: true,
        skills: true,
        _count: { select: { assigned: true, tickets: true } },
      },
      orderBy: { createdAt: 'desc' },
      // Fetch a bit extra when a skill filter is applied since it is
      // matched in-memory (array field, case-insensitive partial match).
      take: input.skill ? undefined : limit,
    })

    const skillFilter = input.skill?.toLowerCase().trim()
    const filtered = skillFilter
      ? users.filter((user) => user.skills.some((skill) => skill.toLowerCase().includes(skillFilter)))
      : users

    const limited = filtered.slice(0, limit)

    return {
      success: true,
      count: limited.length,
      users: limited.map((user) => ({
        id: user.id,
        name: user.firstname,
        email: user.email,
        role: user.role,
        skills: user.skills,
        assignedCount: user._count.assigned,
        createdCount: user._count.tickets,
      })),
    }
  },
})

export const getUser = defineTool({
  name: 'get_user',
  description:
    "Get details and ticket assignment statistics for a single user by id. Scoped to the admin's company.",
  inputShape: {
    userId: z.string().describe('The id of the user to fetch.'),
  },
  outputSchema: getUserOutputSchema,
  handler: async (context, input): Promise<GetUserOutput> => {
    const user = await prisma.user.findFirst({
      where: { id: input.userId, companyId: context.companyId },
    })

    if (!user) {
      throw new ToolError('User not found in your company.', 'USER_NOT_FOUND')
    }

    const [totalCreated, statusCounts] = await Promise.all([
      prisma.ticket.count({ where: { createdById: user.id, companyId: context.companyId } }),
      prisma.ticket.groupBy({
        by: ['status'],
        where: { assignedToId: user.id, companyId: context.companyId },
        _count: { _all: true },
      }),
    ])

    const byStatus = Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all])) as Record<
      string,
      number
    >
    const totalAssigned = statusCounts.reduce((sum, row) => sum + row._count._all, 0)

    return {
      success: true,
      user: {
        id: user.id,
        name: user.firstname,
        email: user.email,
        role: user.role,
        skills: user.skills,
        createdAt: user.createdAt.toISOString(),
      },
      stats: {
        totalAssigned,
        totalCreated,
        pending: byStatus.PENDING ?? 0,
        inProgress: byStatus.IN_PROGRESS ?? 0,
        resolved: byStatus.RESOLVED ?? 0,
        rejected: byStatus.REJECTED ?? 0,
      },
    }
  },
})

export const userTools: AnyToolDefinition[] = [listUsers, getUser]
