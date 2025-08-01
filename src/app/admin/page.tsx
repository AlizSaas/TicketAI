import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import React from 'react'
import AdminDashboard from './admin-ui'

export default async function page() {
  const user = await validateAuthRequest()

  const isAdmin = await prisma.user.findUnique({
    where: {
      clerkId: user.id,
    },
    select: {
      companyId: true,
      role: true,
    },
  })

  if (isAdmin?.role !== 'ADMIN') {
    return <div>Access Denied</div>
  }


 
  return (
    <AdminDashboard  />
  )
}
