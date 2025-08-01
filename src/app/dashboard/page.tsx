import React from 'react'
import UserDashboard from './user-dash-ui'
import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


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
    return (
      <div>
        <h1>
          This is a user dashboard, but you are not authenticated as a user.
        </h1>
      </div>
    )
  }

  return (
    <div>
      <UserDashboard  />
    </div>
  )
}
