import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { AdminContext } from '../auth'
import { toolFailureSchema } from '../errors'
import { defineTool, type AnyToolDefinition } from './types'

const TOP_N = 10

const getTicketStatisticsOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    total: z.number(),
    byStatus: z.object({
      pending: z.number(),
      inProgress: z.number(),
      resolved: z.number(),
      rejected: z.number(),
    }),
    byPriority: z.object({
      low: z.number(),
      medium: z.number(),
      high: z.number(),
      urgent: z.number(),
    }),
    unresolved: z.number(),
    byCategory: z.array(z.object({ category: z.string(), count: z.number() })),
    byModerator: z.array(
      z.object({ userId: z.string(), name: z.string().nullable(), email: z.string().nullable(), count: z.number() })
    ),
    recentlyCreated: z.number(),
    recentDays: z.number(),
  }),
  toolFailureSchema,
])
type GetTicketStatisticsOutput = z.infer<typeof getTicketStatisticsOutputSchema>

export const getTicketStatistics = defineTool({
  name: 'get_ticket_statistics',
  description:
    "Get aggregate analytics for the admin's company: total tickets, counts by status and priority, unresolved tickets, tickets by category, tickets by assigned moderator, and recently created tickets. All numbers are computed with database aggregation, not estimated.",
  inputShape: {
    recentDays: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Window (in days) used to compute "recently created" tickets. Defaults to 7.'),
  },
  outputSchema: getTicketStatisticsOutputSchema,
  handler: async (context: AdminContext, input): Promise<GetTicketStatisticsOutput> => {
    const companyId = context.companyId
    const recentDays = input.recentDays ?? 7
    const recentSince = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000)

    const [total, statusGroups, priorityGroups, categoryGroups, moderatorGroups, recentlyCreated] = await Promise.all(
      [
        prisma.ticket.count({ where: { companyId } }),
        prisma.ticket.groupBy({ by: ['status'], where: { companyId }, _count: { _all: true } }),
        prisma.ticket.groupBy({ by: ['priority'], where: { companyId }, _count: { _all: true } }),
        prisma.ticket.groupBy({
          by: ['category'],
          where: { companyId, category: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { category: 'desc' } },
          take: TOP_N,
        }),
        prisma.ticket.groupBy({
          by: ['assignedToId'],
          where: { companyId, assignedToId: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { assignedToId: 'desc' } },
          take: TOP_N,
        }),
        prisma.ticket.count({ where: { companyId, createdAt: { gte: recentSince } } }),
      ]
    )

    const byStatus = Object.fromEntries(statusGroups.map((row) => [row.status, row._count._all])) as Record<
      string,
      number
    >
    const byPriority = Object.fromEntries(priorityGroups.map((row) => [row.priority, row._count._all])) as Record<
      string,
      number
    >

    const moderatorIds = moderatorGroups
      .map((row) => row.assignedToId)
      .filter((id): id is string => id !== null)

    const moderators = moderatorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: moderatorIds }, companyId },
          select: { id: true, firstname: true, email: true },
        })
      : []
    const moderatorById = new Map(moderators.map((user) => [user.id, user]))

    return {
      success: true,
      total,
      byStatus: {
        pending: byStatus.PENDING ?? 0,
        inProgress: byStatus.IN_PROGRESS ?? 0,
        resolved: byStatus.RESOLVED ?? 0,
        rejected: byStatus.REJECTED ?? 0,
      },
      byPriority: {
        low: byPriority.LOW ?? 0,
        medium: byPriority.MEDIUM ?? 0,
        high: byPriority.HIGH ?? 0,
        urgent: byPriority.URGENT ?? 0,
      },
      unresolved: (byStatus.PENDING ?? 0) + (byStatus.IN_PROGRESS ?? 0),
      byCategory: categoryGroups
        .filter((row): row is typeof row & { category: string } => row.category !== null)
        .map((row) => ({ category: row.category, count: row._count._all })),
      byModerator: moderatorGroups
        .filter((row): row is typeof row & { assignedToId: string } => row.assignedToId !== null)
        .map((row) => ({
          userId: row.assignedToId,
          name: moderatorById.get(row.assignedToId)?.firstname ?? null,
          email: moderatorById.get(row.assignedToId)?.email ?? null,
          count: row._count._all,
        })),
      recentlyCreated,
      recentDays,
    }
  },
})

export const statisticsTools: AnyToolDefinition[] = [getTicketStatistics]
