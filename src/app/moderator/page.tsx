import ModeratorDashboard from './mod-ui'
import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRoleHome } from '@/lib/roles'

export default async function page() {
  const user = await validateAuthRequest()

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true },
  })

  if (!dbUser) {
    redirect('/onboarding')
  }

  if (dbUser.role !== 'MODERATOR') {
    redirect(getRoleHome(dbUser.role))
  }

  return <ModeratorDashboard />
}
