import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/server-only'

export async function GET() {
  const userDb = await getSessionUser()

  if (!userDb) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userData = await prisma.user.findUnique({
    where: { id: userDb.id },
    select: {
      tickets: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return Response.json(userData, { status: 200 })
}
