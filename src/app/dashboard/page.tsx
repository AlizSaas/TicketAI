import React from 'react'
import UserDashboard from './user-dash-ui'
import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'


export default async function page() {
  const user = await validateAuthRequest()

 if( !user ) {
    throw new Error('User not authenticated')
  }

  const dbUser = await prisma.user.findUnique({
    where:{
      clerkId: user.id,
      role: 'USER'
    }
  })

  if(!dbUser) {
   redirect('/onboarding')
  }

  return (
    <div>
      <UserDashboard  />
    </div>
  )
}
