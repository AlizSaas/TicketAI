import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/server-only'

export async function GET() {
  const userDb = await getSessionUser()

  if (!userDb) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (userDb.role !== 'ADMIN') {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const allCompanyData = await prisma.company.findUnique({
    where: { id: userDb.companyId },
    select: {
      users: true,
      codes: true,
      tickets: { orderBy: { createdAt: 'desc' } },
      _count: {
        select: {
          users: true,
          codes: true,
          tickets: true,
        },
      },
    },
  })

  if (!allCompanyData) {
    return Response.json({ error: "No company data found" }, { status: 404 })
  }

  return Response.json(allCompanyData, { status: 200 })
}
