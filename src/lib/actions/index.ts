"use server"


import { prisma } from "../prisma"
import { getAdminUser } from "../server-only"





export async function generateInvitationCode() {
  try {
 const adminUser  = await getAdminUser()
   let code = generateRandomCode()
   let existingCode = await prisma.code.findUnique({
    where:{
      code: code
    }
   })

   while (existingCode) {
    code = generateRandomCode()
    existingCode = await prisma.code.findUnique({
      where: {
        code: code
      }
    })

   } // Ensure unique code

   const newCode = await prisma.code.create({
     data: {
       code: code,
       companyId:adminUser.companyId,
       used: false,
       
       
      
     
     }
   })
  


return newCode
  } catch (error) {
    console.error("Error generating invitation code:", error)
    throw new Error("Failed to generate invitation code")
  }
}


export async function deleteInvitationCode(codeId: string) {
  try {
  const adminUser = await getAdminUser()

  if (!adminUser) {
    throw new Error("Unauthorized: Admin user not found")
  }


 
  
 const deletedCode = await prisma.code.delete({
  where:{id: codeId,companyId: adminUser.companyId},
  
})

if (!deletedCode) {
  throw new Error("Code not found or already deleted")
}

console.log("Deleted code:", deletedCode)
return deletedCode
    
    

    
  } catch (error) {
    console.error("Error deleting invitation code:", error)

  }
}


// Helper function to generate random 6-digit code
 const generateRandomCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit code
    };