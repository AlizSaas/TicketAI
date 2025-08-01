import React from 'react'
import ModeratorDashboard from './mod-ui'
import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function page() {
  const user = await validateAuthRequest()
  const userDb = await prisma.user.findUnique({
  where: { clerkId: user.id,role:'MODERATOR' },

 // adjust relation name as per your schema
});

if(!userDb) {
  return (
    <div>
      <h1>
        This is a moderator dashboard, but you are not authenticated as a moderator.
      </h1>
    </div>
  )
}

const assignedTickets = await prisma.ticket.findMany({
  where:{
    assignedToId: userDb.id,
  
  },

  
})


if(!assignedTickets) {
  return <div>No assigned tickets</div>
}



  return (
  <ModeratorDashboard />
  )
}
