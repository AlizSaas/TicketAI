import { validateAuthRequest } from '@/lib/auth'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRoleHome } from '@/lib/roles'
import SingleITicketPage from './single-ticket-ui'

type Props = {
  params: Promise<{ id: string }>
}

const getTicketData = cache(async (id: string) => {
  const user = await validateAuthRequest()

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true, companyId: true },
  })

  if (!dbUser) {
    redirect('/onboarding')
  }

  // Only admins can open this page; moderators and users go back to their own dashboard
  if (dbUser.role !== 'ADMIN') {
    redirect(getRoleHome(dbUser.role))
  }

  // Scope to the admin's company so tickets from other companies are never exposed
  return prisma.ticket.findFirst({
    where: {
      id,
      companyId: dbUser.companyId,
    },
  })
})

export default async function page({ params }: Props) {
  const { id } = await params
  const ticket = await getTicketData(id)
  return <SingleITicketPage userData={ticket} />
}
