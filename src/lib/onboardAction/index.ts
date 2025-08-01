'use server'

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../prisma";


export const createAdmin = async(userId: string, companyName: string) => {


    try {
        
           const user = await (await clerkClient()).users.getUser(userId) // get user by clerkId

           if(!user || !user.firstName) {
            throw new Error("User not found or first name is missing");
           }

           const company = await prisma.company.create({
            data:{
                name: companyName,

            }

           })

                  
        await (await clerkClient()).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: 'ADMIN',
                companyId: company.id,

               
               
            }
        })

        await prisma.user.create({
            data:{
                clerkId: user.id,
                firstname: user.firstName || "",
                email: user.emailAddresses[0]?.emailAddress || "",
                companyId: company.id,
                role:'ADMIN',
                createdAt: new Date(),
                updatedAt: new Date(),
                
              

            }
        })


        return {
            success: true,
            
        }
        
    } catch (error) {
         console.error("Error creating seller:", error);
    
        return { 
            error: "Failed to create seller. Please try again later."
        }
    }
}

export const createModerator = async(userId: string, invitationCode: string) => {

    try {
          const user = await (await clerkClient()).users.getUser(userId) // get user by clerkId

           if(!user || !user.firstName) {
            throw new Error("User not found or first name is missing");
           }

             const code = await prisma.code.findFirst({
            where:{
                code: invitationCode,
                used: false,
            }
        })
           if(!code) {
            throw new Error("Invalid invitation code")
        }

            await (await clerkClient()).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: 'MODERATOR',
                companyId: code.companyId,
                


            }

        })

           if(!code.companyId) {
            throw new Error("Company ID not found in invitation code")
        }
await prisma.user.create({
            data:{
                clerkId:user.id,
                firstname: user.firstName,
              
                email: user.emailAddresses[0]?.emailAddress,
                role:'MODERATOR',
                companyId: code.companyId,
                createdAt: new Date(), // set createdAt to current date
                updatedAt: new Date(), // set updatedAt to current date

            }
        })
 await prisma.code.update({
            where:{
                id:code.id,
                
            },
            data:{
                used: true, // mark code as used
            }
        })
return {
    success:true
}



    } catch (error) {
          console.error(error)
      

        return {
         
            error: "Failed to create buyer. Please try again later."
        };
        
    }
    


}

export const createUser  = async(userId:string,invitationCode:string) => {
    try {
        const user = await (await clerkClient()).users.getUser(userId) // get user by clerkId

        if(!user || !user.firstName) {
            throw new Error("User not found or first name is missing");
        }

        const code = await prisma.code.findFirst({
            where: {
                code: invitationCode,
                used: false,
            }
        });

        if(!code) {
            throw new Error("Invalid invitation code");
        }

        await (await clerkClient()).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: 'USER',
                companyId: code.companyId,
            }
        });

        if(!code.companyId) {
            throw new Error("Company ID not found in invitation code");
        }

        await prisma.user.create({
            data: {
                clerkId: user.id,
                firstname: user.firstName,
                email: user.emailAddresses[0]?.emailAddress || "",
                role: 'USER',
                companyId: code.companyId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        await prisma.code.update({
            where: {
                id: code.id,
            },
            data: {
                used: true, // mark code as used
            }
        });

        return { success: true };

    } catch (error) {
        console.error("Error creating user:", error);
        return { error: "Failed to create user. Please try again later." };
    }

}