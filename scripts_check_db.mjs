import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const companies = await prisma.company.findMany({
  select: {
    id: true,
    name: true,
    _count: { select: { users: true, tickets: true } },
  },
})
console.log(JSON.stringify(companies, null, 2))

await prisma.$disconnect()
