import { z } from 'zod'
import { Prisma, type Ticket } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { AdminContext } from '../auth'
import { ToolError, toolFailureSchema } from '../errors'
import { defineTool, type AnyToolDefinition } from './types'

const statusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
const roleEnum = z.enum(['USER', 'MODERATOR', 'ADMIN'])

const ticketSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: statusEnum,
  priority: priorityEnum,
  category: z.string().nullable(),
  relatedSkills: z.array(z.string()),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  assignedTo: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ticketDetailSchema = ticketSummarySchema.extend({
  notes: z.string().nullable(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    role: roleEnum,
  }),
  assignedTo: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      role: roleEnum,
    })
    .nullable(),
})

// Truncate long descriptions in list views so we never dump huge payloads
// into the model context. Full detail is available via get_ticket.
const SUMMARY_DESCRIPTION_LIMIT = 220

function truncate(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

function toTicketSummary(ticket: Ticket): z.infer<typeof ticketSummarySchema> {
  return {
    id: ticket.id,
    title: ticket.title,
    description: truncate(ticket.description, SUMMARY_DESCRIPTION_LIMIT),
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    relatedSkills: ticket.relatedSkills,
    createdBy: {
      id: ticket.createdById,
      name: ticket.createdByName,
      email: ticket.createdByEmail,
    },
    assignedTo: ticket.assignedToId
      ? {
          id: ticket.assignedToId,
          name: ticket.assignedToName,
          email: ticket.assignedToEmail,
        }
      : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }
}

function toTicketDetail(ticket: Ticket): z.infer<typeof ticketDetailSchema> {
  return {
    ...toTicketSummary(ticket),
    notes: ticket.notes,
    createdBy: {
      id: ticket.createdById,
      name: ticket.createdByName,
      email: ticket.createdByEmail,
      role: ticket.createdByRole,
    },
    assignedTo: ticket.assignedToId
      ? {
          id: ticket.assignedToId,
          name: ticket.assignedToName,
          email: ticket.assignedToEmail,
          role: ticket.assignedToRole,
        }
      : null,
  }
}

async function findCompanyTicket(context: AdminContext, ticketId: string): Promise<Ticket> {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, companyId: context.companyId },
  })

  if (!ticket) {
    throw new ToolError('Ticket not found in your company.', 'TICKET_NOT_FOUND')
  }

  return ticket
}

const searchTicketsOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    count: z.number(),
    tickets: z.array(ticketSummarySchema),
  }),
  toolFailureSchema,
])
type SearchTicketsOutput = z.infer<typeof searchTicketsOutputSchema>

const getTicketOutputSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), ticket: ticketDetailSchema }),
  toolFailureSchema,
])
type GetTicketOutput = z.infer<typeof getTicketOutputSchema>

const assignTicketOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    ticket: ticketSummarySchema,
    assignedTo: z.object({ id: z.string(), name: z.string().nullable(), email: z.string(), role: roleEnum }),
  }),
  toolFailureSchema,
])
type AssignTicketOutput = z.infer<typeof assignTicketOutputSchema>

const updateTicketStatusOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    ticket: ticketSummarySchema,
    previousStatus: statusEnum,
  }),
  toolFailureSchema,
])
type UpdateTicketStatusOutput = z.infer<typeof updateTicketStatusOutputSchema>

const updateTicketPriorityOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    ticket: ticketSummarySchema,
    previousPriority: priorityEnum,
  }),
  toolFailureSchema,
])
type UpdateTicketPriorityOutput = z.infer<typeof updateTicketPriorityOutputSchema>

const addTicketNoteOutputSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), ticket: ticketSummarySchema, notes: z.string() }),
  toolFailureSchema,
])
type AddTicketNoteOutput = z.infer<typeof addTicketNoteOutputSchema>


export const searchTickets = defineTool({
  name: 'search_tickets',
  description:
    "Search and filter the admin's company tickets by status, priority, category, assignee, creator, related skill, a free-text query, and/or a creation date range. Always scoped to the authenticated admin's company. Use this before answering any question about which tickets exist.",
  inputShape: {
    status: statusEnum.optional().describe('Filter by ticket status.'),
    priority: priorityEnum.optional().describe('Filter by ticket priority.'),
    category: z.string().optional().describe('Filter by ticket category (partial match).'),
    assignedTo: z
      .string()
      .optional()
      .describe(
        'Filter by assignee name or email (partial match). Pass "unassigned" to find tickets with no assignee.'
      ),
    createdBy: z.string().optional().describe('Filter by creator name or email (partial match).'),
    relatedSkill: z.string().optional().describe('Filter by a related skill/tag on the ticket.'),
    query: z.string().optional().describe('Free-text search across ticket title and description.'),
    createdAfter: z.string().datetime().optional().describe('ISO date-time. Only tickets created after this.'),
    createdBefore: z.string().datetime().optional().describe('ISO date-time. Only tickets created before this.'),
    olderThanDays: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Convenience filter: only tickets created more than this many days ago.'),
    limit: z.number().int().min(1).max(50).optional().describe('Max number of results to return (default 20, max 50).'),
  },
  outputSchema: searchTicketsOutputSchema,
  handler: async (context, input): Promise<SearchTicketsOutput> => {
    const where: Prisma.TicketWhereInput = { companyId: context.companyId }

    if (input.status) where.status = input.status
    if (input.priority) where.priority = input.priority
    if (input.category) where.category = { contains: input.category, mode: 'insensitive' }
    if (input.relatedSkill) where.relatedSkills = { has: input.relatedSkill.toLowerCase() }
    if (input.query) {
      where.OR = [
        { title: { contains: input.query, mode: 'insensitive' } },
        { description: { contains: input.query, mode: 'insensitive' } },
      ]
    }

    if (input.assignedTo) {
      if (input.assignedTo.trim().toLowerCase() === 'unassigned') {
        where.assignedToId = null
      } else {
        where.OR = [
          ...(where.OR ?? []),
          { assignedToName: { contains: input.assignedTo, mode: 'insensitive' } },
          { assignedToEmail: { contains: input.assignedTo, mode: 'insensitive' } },
        ]
      }
    }

    if (input.createdBy) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { createdByName: { contains: input.createdBy, mode: 'insensitive' } },
            { createdByEmail: { contains: input.createdBy, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const createdAt: Prisma.DateTimeFilter = {}
    if (input.createdAfter) createdAt.gte = new Date(input.createdAfter)
    if (input.createdBefore) createdAt.lte = new Date(input.createdBefore)
    if (input.olderThanDays) {
      const threshold = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000)
      createdAt.lte = createdAt.lte && createdAt.lte < threshold ? createdAt.lte : threshold
    }
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt

    const limit = input.limit ?? 20

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return {
      success: true,
      count: tickets.length,
      tickets: tickets.map(toTicketSummary),
    }
  },
})

export const getTicket = defineTool({
  name: 'get_ticket',
  description:
    "Get full details for a single ticket by id, including description, status, priority, category, notes, related skills, creator, assignee, and timestamps. Scoped to the admin's company.",
  inputShape: {
    ticketId: z.string().describe('The id of the ticket to fetch.'),
  },
  outputSchema: getTicketOutputSchema,
  handler: async (context, input): Promise<GetTicketOutput> => {
    const ticket = await findCompanyTicket(context, input.ticketId)
    return { success: true, ticket: toTicketDetail(ticket) }
  },
})

export const assignTicket = defineTool({
  name: 'assign_ticket',
  description:
    'Assign a ticket to a moderator or admin in the same company. Verifies the ticket and target user both exist and belong to the admin\'s company, and that the target user is eligible (a moderator or admin) to receive ticket assignments. This is a mutation and requires explicit admin confirmation.',
  inputShape: {
    ticketId: z.string().describe('The id of the ticket to assign.'),
    userId: z.string().describe('The id of the user to assign the ticket to.'),
  },
  requiresApproval: true,
  outputSchema: assignTicketOutputSchema,
  handler: async (context, input): Promise<AssignTicketOutput> => {
    const ticket = await findCompanyTicket(context, input.ticketId)

    const targetUser = await prisma.user.findFirst({
      where: { id: input.userId, companyId: context.companyId },
    })

    if (!targetUser) {
      throw new ToolError('That user was not found in your company.', 'USER_NOT_FOUND')
    }

    if (targetUser.role === 'USER') {
      throw new ToolError(
        `${targetUser.firstname ?? targetUser.email} is not eligible to receive ticket assignments (only moderators or admins can be assigned tickets).`,
        'USER_NOT_ELIGIBLE'
      )
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedToId: targetUser.id,
        assignedToName: targetUser.firstname ?? targetUser.email,
        assignedToEmail: targetUser.email,
        assignedToRole: targetUser.role,
      },
    })

    return {
      success: true,
      ticket: toTicketSummary(updated),
      assignedTo: {
        id: targetUser.id,
        name: targetUser.firstname,
        email: targetUser.email,
        role: targetUser.role,
      },
    }
  },
})

export const updateTicketStatus = defineTool({
  name: 'update_ticket_status',
  description:
    "Change a ticket's status (PENDING, IN_PROGRESS, RESOLVED, or REJECTED). Scoped to the admin's company. This is a mutation and requires explicit admin confirmation.",
  inputShape: {
    ticketId: z.string().describe('The id of the ticket to update.'),
    status: statusEnum.describe('The new status for the ticket.'),
  },
  requiresApproval: true,
  outputSchema: updateTicketStatusOutputSchema,
  handler: async (context, input): Promise<UpdateTicketStatusOutput> => {
    const ticket = await findCompanyTicket(context, input.ticketId)

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: input.status },
    })

    return { success: true, ticket: toTicketSummary(updated), previousStatus: ticket.status }
  },
})

export const updateTicketPriority = defineTool({
  name: 'update_ticket_priority',
  description:
    "Change a ticket's priority (LOW, MEDIUM, HIGH, or URGENT). Scoped to the admin's company. This is a mutation and requires explicit admin confirmation.",
  inputShape: {
    ticketId: z.string().describe('The id of the ticket to update.'),
    priority: priorityEnum.describe('The new priority for the ticket.'),
  },
  requiresApproval: true,
  outputSchema: updateTicketPriorityOutputSchema,
  handler: async (context, input): Promise<UpdateTicketPriorityOutput> => {
    const ticket = await findCompanyTicket(context, input.ticketId)

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { priority: input.priority },
    })

    return { success: true, ticket: toTicketSummary(updated), previousPriority: ticket.priority }
  },
})

export const addTicketNote = defineTool({
  name: 'add_ticket_note',
  description:
    "Append an internal note to a ticket. Scoped to the admin's company. The note is stamped with the admin's name and timestamp and preserves any existing notes.",
  inputShape: {
    ticketId: z.string().describe('The id of the ticket to add a note to.'),
    note: z.string().min(1).max(2000).describe('The note text to add.'),
  },
  outputSchema: addTicketNoteOutputSchema,
  handler: async (context, input): Promise<AddTicketNoteOutput> => {
    const ticket = await findCompanyTicket(context, input.ticketId)

    const stamped = `[${new Date().toISOString()} · ${context.name}] ${input.note}`
    const notes = ticket.notes ? `${ticket.notes}\n\n${stamped}` : stamped

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { notes },
    })

    return { success: true, ticket: toTicketSummary(updated), notes }
  },
})

export const ticketTools: AnyToolDefinition[] = [
  searchTickets,
  getTicket,
  assignTicket,
  updateTicketStatus,
  updateTicketPriority,
  addTicketNote,
]
