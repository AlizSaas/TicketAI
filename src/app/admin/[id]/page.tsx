import { validateAuthRequest } from '@/lib/auth'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import SingleITicketPage from './single-ticket-ui'

type Props = {
  params: Promise<{ id: string }>
}
 const getUserData = cache(async (id:string) => {

  const user = await validateAuthRequest()

  if (!user) {
    throw new Error('Unauthorized')
  }

  
  const tickets = await prisma.ticket.findUnique({
    where:{
        id:id
    },
    
  })

  return tickets
})



export default async function page({ params }: Props) {
    const { id } = await params
  const userData = await getUserData(id)
  return (
    <SingleITicketPage userData={userData} />
  )
}
