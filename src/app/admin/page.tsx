import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRoleHome } from '@/lib/roles'
import AdminDashboard from './admin-ui'

export default async function page() {
  const user = await validateAuthRequest()

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true },
  })

  if (!dbUser) {
    redirect('/onboarding')
  }

  if (dbUser.role !== 'ADMIN') {
    redirect(getRoleHome(dbUser.role))
  }

  return <AdminDashboard />
}
