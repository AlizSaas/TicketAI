import {prisma} from '@/lib/prisma'
import { validateAuthRequest } from '@/lib/auth'
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
       const loggedInUser = await validateAuthRequest()
         if( !loggedInUser ) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        
          const userDb = await prisma.user.findUnique({
          where: { clerkId: loggedInUser.id,

          
           },
           select:{
            companyId: true,
            role: true,
           }
        
         // adjust relation name as per your schema
        });

        if(!userDb) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }


      const allCompanyData = await prisma.company.findUnique({
  where: { 
    id: userDb.companyId,
    

   },
  select: {
    users: true,
    codes: true,
    tickets: true,
    _count: {
      select: {
        users: true,
        codes: true,
        tickets: true,
        
      },
      
    },
    
  },
  
  
},


);

if(!allCompanyData) {
    return Response.json({ error: "No company data found" }, { status: 404 });
}
return Response.json(allCompanyData, { status: 200 });


    }