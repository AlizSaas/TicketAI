import {prisma} from '@/lib/prisma'
import { validateAuthRequest } from '@/lib/auth'
import { NextRequest } from 'next/server';


export async function GET(req: NextRequest) {
       const loggedInUser = await validateAuthRequest()
         if( !loggedInUser ) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        
          const userDb = await prisma.user.findUnique({
          where: { clerkId: loggedInUser.id },
        
         // adjust relation name as per your schema
        });

        if(!userDb) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const assignedTicket = await prisma.ticket.findMany({
          where:{
            assignedToId: userDb.id,
          
          },
          orderBy:{
            createdAt: 'desc', // Adjust this if you have a different date field
          }
        
          
        })
        

        const data = {
            assignedTickets: assignedTicket,
        }

    return Response.json(data, { status: 200 });

    }