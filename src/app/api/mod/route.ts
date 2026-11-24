import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/server-only'

export async function GET() {
  const userDb = await getSessionUser()

  if (!userDb) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (userDb.role !== 'MODERATOR') {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const assignedTickets = await prisma.ticket.findMany({
    where: {
      assignedToId: userDb.id,
      companyId: userDb.companyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return Response.json({ assignedTickets }, { status: 200 })
}
