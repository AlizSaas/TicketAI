import { inngest } from "@/inngest/inngest";

import { sendEmail } from "@/lib/mailer";

import { prisma } from "@/lib/prisma";

import { ticketAnalysisAgent } from "./agents/ticketAnalysis";





export const assignTicket = inngest.createFunction(
  {
    id: "ticket-assign",
    name: "Ticketing System Inngest assignment",
    // Add retry config to limit retries
    retries: 2
  },
  { event: "ticket/created.requested" },
  async ({ event, step }) => {
    const { ticketId } = event.data;

   

    // Generic keyword extraction - works for any domain
    function extractKeywords(text: string): string[] {
      if (!text) return [];
      
      // Convert to lowercase, normalize whitespace, split into words and phrases
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 3); // Only keep words with 3+ characters
      
      const result = [...words];
      
      // For multi-word skills, add the complete phrase and individual words
      if (words.length > 1) {
        result.push(words.join('')); // Add without spaces
      }
      
      return result.map(word => word.trim());
    }

    // Get the ticket information
    const ticket = await step.run("get-ticket", async () => {
      const ticketObj = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!ticketObj) throw new Error(`Ticket with ID ${ticketId} not found`);
      return ticketObj;
    });

    await step.run("update-ticket-status", async () => {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "PENDING",
        },
      });
    });

 async function analyzeTicket(ticket: {
  title: string;
  description: string;
}): Promise<AIAnalysisResponse | null> {
  try {
    console.log("Starting ticket analysis for:", ticket.title);
    
    const { output } = await ticketAnalysisAgent.run(
      `Analyze this support ticket:

Title: ${ticket.title}
Description: ${ticket.description}`
    );
    
    console.log("Agent output received:", JSON.stringify(output));

    // Extract the last message from the agent's output
    const lastMessage = output[output.length - 1];
    if (lastMessage?.type === 'text') {
      const content = lastMessage.content as string;
      console.log("Parsing content:", content);
      
      // Parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        console.log("Extracted JSON:", jsonString);
        
        const parsedResponse = JSON.parse(jsonString);
        console.log("Parsed response:", parsedResponse);
        
        // Apply validation
        const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
        if (!validPriorities.includes(parsedResponse.priority)) {
          parsedResponse.priority = "MEDIUM";
        }

        if (!parsedResponse.category || typeof parsedResponse.category !== "string") {
          parsedResponse.category = "Other";
        }

        if (!parsedResponse.notes || typeof parsedResponse.notes !== "string") {
          parsedResponse.notes = "AI could not generate notes.";
        }

        if (!Array.isArray(parsedResponse.relatedSkills)) {
          parsedResponse.relatedSkills = [];
        }

        return parsedResponse;
      } else {
        console.error("No JSON found in response:", content);
      }
    } else {
      console.error("Invalid message type or no messages returned");
    }

    return null;
  } catch (error: unknown) {
    console.error("Error in analyzeTicket:", error);
    return null;
  }
}

    // Get all keywords from ticket title, description, and AI-identified skills
    let ticketKeywords = [
      ...extractKeywords(ticket.title),
      ...extractKeywords(ticket.description)
    ];

    // Run the AI analysis
    const aiResponse = await analyzeTicket({
      title: ticket.title,
      description: ticket.description,
    });
    console.log("AI analysis response:", aiResponse);
    if (!aiResponse) throw new Error("AI analysis failed or returned null");
    
    // Add the full AI-identified skills (as phrases) and their component keywords
    if (aiResponse.relatedSkills) {
      // Add both the full skill phrases and their component keywords
      aiResponse.relatedSkills.forEach((skill: string) => {
        // Add the complete skill phrase
        ticketKeywords.push(skill.toLowerCase());
        // Add individual words from the skill
        ticketKeywords = [...ticketKeywords, ...extractKeywords(skill)];
      });
    }

    // Remove duplicates and store as ticket keywords
    const uniqueKeywords = [...new Set(ticketKeywords)];
    console.log("Ticket keywords for matching:", uniqueKeywords);

    await step.run("update-ticket-with-ai-data", async () => {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          priority: aiResponse.priority,
          category: aiResponse.category,
          notes: aiResponse.notes,
          relatedSkills: uniqueKeywords,
        },
      });
    });

    // Find the best matching moderator
    const moderator = await step.run("find-moderator", async () => {
      const allModerators = await prisma.user.findMany({
        where: {
          role: "MODERATOR",
          companyId: ticket.companyId,
        },
      });

      if (allModerators.length === 0) {
        throw new Error(`No moderators found for company ID ${ticket.companyId}`);
      }

      console.log("Finding moderators for keywords:", uniqueKeywords);
      console.log("Available moderators:", allModerators.map(m => ({
        id: m.id,
        name: m.firstname,
        skills: m.skills
      })));

      // Score moderators using flexible matching logic
      const scoredModerators = allModerators.map(moderator => {
        // Process each moderator's skills
        const moderatorSkillsLower = moderator.skills.map(s => s.toLowerCase());
        
        // Get both the full skills and individual keywords
        const moderatorKeywords = [
          ...moderatorSkillsLower, // Full skills as phrases
          ...moderatorSkillsLower.flatMap(extractKeywords) // Individual keywords
        ];
        
        // Debug log
        console.log(`\nModerator ${moderator.firstname}:`);
        console.log(`Skills: ${moderator.skills.join(', ')}`);
        console.log(`Keywords: ${moderatorKeywords.join(', ')}`);
        
        // Find matches - check for exact skill matches AND keyword matches
        const matches = [];
        
        // 1. Check for direct skill matches (full phrases)
        for (const skill of moderatorSkillsLower) {
          if (uniqueKeywords.includes(skill)) {
            matches.push(skill);
          }
        }
        
        // 2. Check for keyword matches
        for (const keyword of uniqueKeywords) {
          // If this is already counted as a direct skill match, skip
          if (matches.includes(keyword)) continue;
          
          // Check if any moderator keyword contains this ticket keyword
          if (moderatorKeywords.some(mk => 
            mk === keyword || mk.includes(keyword) || keyword.includes(mk)
          )) {
            matches.push(keyword);
          }
        }
        
        const uniqueMatches = [...new Set(matches)];
        console.log(`Matching keywords: ${uniqueMatches.join(', ')}`);
        
        // Calculate score - prioritize exact skill matches
        const directSkillMatches = moderatorSkillsLower.filter(s => uniqueKeywords.includes(s)).length;
        const keywordMatches = uniqueMatches.length - directSkillMatches;
        
        // Direct skill matches are worth more than keyword matches
        const matchScore = (directSkillMatches * 2) + keywordMatches;
        
        return {
          ...moderator,
          matchScore,
          directSkillMatches,
          keywordMatches,
          matches: uniqueMatches,
          hasRelevantSkills: matchScore > 0
        };
      });

      // Sort by match score (highest first)
      scoredModerators.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log("Moderator ranking:");
      scoredModerators.forEach(m => {
        console.log(`${m.firstname}: score ${m.matchScore} (direct: ${m.directSkillMatches}, keywords: ${m.keywordMatches}), matches: ${m.matches.join(', ')}`);
      });

      const bestMatch = scoredModerators[0];

      // If no moderator has relevant skills, don't assign automatically
      if (!bestMatch || !bestMatch.hasRelevantSkills) {
        console.warn('No moderator with relevant skills found', {
          requiredKeywords: uniqueKeywords,
          availableModerators: allModerators.map(m => ({
            id: m.id,
            name: m.firstname,
            skills: m.skills
          }))
        });
        
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { 
            status: "PENDING",
            notes: `No qualified moderators available. Required skills: ${uniqueKeywords.join(', ')}`
          },
        });
        
        throw new Error("No moderator with relevant skills available");
      }

      console.log('Best moderator match found:', {
        id: bestMatch.id,
        name: bestMatch.firstname,
        skills: bestMatch.skills,
        matchScore: bestMatch.matchScore,
        directMatches: bestMatch.directSkillMatches,
        keywordMatches: bestMatch.keywordMatches,
        matchedOn: bestMatch.matches
      });

      // Assign the ticket to the best matching moderator
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          assignedToId: bestMatch.id,
          status: "IN_PROGRESS",
          assignedToName: bestMatch.firstname,
          assignedToEmail: bestMatch.email,
        },
      });

      return bestMatch;
    });

    // Send notification email
    await step.run("send-assignment-notification", async () => {
      const fullTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select:{
          assignedToEmail: true,
          assignedToName: true,
          title: true,
          description: true,
          priority: true,
          category: true,
        }
      });

      if (!fullTicket || !fullTicket.assignedToEmail) {
        console.error('Ticket or user not found for email notification');
        return;
      }

      const emailSent = await sendEmail({
        to: fullTicket.assignedToEmail,
        subject: `A ticket has been assigned to you: ${fullTicket.assignedToName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #007BFF;">Ticket Assignment Notification</h2>
            <p>Dear <strong>${fullTicket.assignedToName}</strong>,</p>

            <p>You have been assigned to a new support ticket. Please review the details below:</p>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
              <p><strong>Title:</strong> ${fullTicket.title}</p>
              <p><strong>Description:</strong> ${fullTicket.description}</p>
              <p><strong>Priority:</strong> ${fullTicket.priority}</p>
              <p><strong>Category:</strong> ${fullTicket.category}</p>
            </div>

            <p style="margin-top: 20px;">Please take action as soon as possible.</p>

            <p>Thank you,<br/>Support Team</p>
          </div>
        `,
      });

      if (!emailSent) {
        console.error('Failed to send assignment notification email');
      }
    });

    return { success: true, assignedTo: moderator.id };
  }
);
    interface AIAnalysisResponse {
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      category: string;
      notes: string;
      relatedSkills?: string[];
    }


// Keep existing analyzeTicket function


interface AIAnalysisResponse {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  notes: string;
  relatedSkills?: string[];
}

// Define the agent


// Define the analyzeTicket function before using it


// Helper function for extracting keywords
// function extractKeywords(text: string): string[] {
//   if (!text) return [];
  
//   // Convert to lowercase, normalize whitespace, split into words and phrases
//   const words = text.toLowerCase()
//     .replace(/[^\w\s]/g, ' ')
//     .split(/\s+/)
//     .filter(word => word.length >= 3); // Only keep words with 3+ characters
  
//   const result = [...words];
  
//   // For multi-word skills, add the complete phrase and individual words
//   if (words.length > 1) {
//     result.push(words.join('')); // Add without spaces
//   }
  
//   return result.map(word => word.trim());
// }

// export const assignTicket = inngest.createFunction(
//   {
//     id: "ticket-assign",
//     name: "Ticketing System Inngest assignment",
//     retries: 2
//   },
//   { event: "ticket/created.requested" },
//   async ({ event, step }) => {
//     const { ticketId } = event.data;

//     // Get the ticket information
//     const ticket = await step.run("get-ticket", async () => {
//       const ticketObj = await prisma.ticket.findUnique({
//         where: { id: ticketId },
//       });
//       if (!ticketObj) throw new Error(`Ticket with ID ${ticketId} not found`);
//       return ticketObj;
//     });

//     await step.run("update-ticket-status", async () => {
//       await prisma.ticket.update({
//         where: { id: ticketId },
//         data: {
//           status: "PENDING",
//         },
//       });
//     });

//     // Run AI analysis with proper error handling
//     const aiResponse = await step.run("analyze-ticket", async () => {
//       const response = await ticketAnalysisAgent.run(
//         `Analyze this support ticket:
//     Title: ${ticket.title}
//     Description: ${ticket.description}`
//       );

//       if (!response) {
//         throw new Error("AI analysis failed to return a valid response");
//       }

//       return response;
//     });

//     console.log("AI analysis response:", aiResponse);

//     // Get all keywords from ticket title, description, and AI-identified skills
//     let ticketKeywords = [
//       ...extractKeywords(ticket.title),
//       ...extractKeywords(ticket.description)
//     ];
    
//     // Add the full AI-identified skills (as phrases) and their component keywords
//     if (aiResponse.relatedSkills) {
//       // Add both the full skill phrases and their component keywords
//       aiResponse.relatedSkills.forEach((skill: string) => {
//         // Add the complete skill phrase
//         ticketKeywords.push(skill.toLowerCase());
//         // Add individual words from the skill
//         ticketKeywords = [...ticketKeywords, ...extractKeywords(skill)];
//       });
//     }

//     // Remove duplicates and store as ticket keywords
//     const uniqueKeywords = [...new Set(ticketKeywords)];
//     console.log("Ticket keywords for matching:", uniqueKeywords);

//     await step.run("update-ticket-with-ai-data", async () => {
//       await prisma.ticket.update({
//         where: { id: ticketId },
//         data: {
//           priority: aiResponse.,
//           category: aiResponse.category,
//           notes: aiResponse.notes,
//           relatedSkills: uniqueKeywords,
//         },
//       });
//     });

//     // Find the best matching moderator
//     const moderator = await step.run("find-moderator", async () => {
//       const allModerators = await prisma.user.findMany({
//         where: {
//           role: "MODERATOR",
//           companyId: ticket.companyId,
//         },
//       });

//       if (allModerators.length === 0) {
//         throw new Error(`No moderators found for company ID ${ticket.companyId}`);
//       }

//       console.log("Finding moderators for keywords:", uniqueKeywords);
//       console.log("Available moderators:", allModerators.map(m => ({
//         id: m.id,
//         name: m.firstname,
//         skills: m.skills
//       })));

//       // Score moderators using flexible matching logic
//       const scoredModerators = allModerators.map(moderator => {
//         // Process each moderator's skills
//         const moderatorSkillsLower = moderator.skills.map(s => s.toLowerCase());
        
//         // Get both the full skills and individual keywords
//         const moderatorKeywords = [
//           ...moderatorSkillsLower, // Full skills as phrases
//           ...moderatorSkillsLower.flatMap(extractKeywords) // Individual keywords
//         ];
        
//         // Debug log
//         console.log(`\nModerator ${moderator.firstname}:`);
//         console.log(`Skills: ${moderator.skills.join(', ')}`);
//         console.log(`Keywords: ${moderatorKeywords.join(', ')}`);
        
//         // Find matches - check for exact skill matches AND keyword matches
//         const matches = [];
        
//         // 1. Check for direct skill matches (full phrases)
//         for (const skill of moderatorSkillsLower) {
//           if (uniqueKeywords.includes(skill)) {
//             matches.push(skill);
//           }
//         }
        
//         // 2. Check for keyword matches
//         for (const keyword of uniqueKeywords) {
//           // If this is already counted as a direct skill match, skip
//           if (matches.includes(keyword)) continue;
          
//           // Check if any moderator keyword contains this ticket keyword
//           if (moderatorKeywords.some(mk => 
//             mk === keyword || mk.includes(keyword) || keyword.includes(mk)
//           )) {
//             matches.push(keyword);
//           }
//         }
        
//         const uniqueMatches = [...new Set(matches)];
//         console.log(`Matching keywords: ${uniqueMatches.join(', ')}`);
        
//         // Calculate score - prioritize exact skill matches
//         const directSkillMatches = moderatorSkillsLower.filter(s => uniqueKeywords.includes(s)).length;
//         const keywordMatches = uniqueMatches.length - directSkillMatches;
        
//         // Direct skill matches are worth more than keyword matches
//         const matchScore = (directSkillMatches * 2) + keywordMatches;
        
//         return {
//           ...moderator,
//           matchScore,
//           directSkillMatches,
//           keywordMatches,
//           matches: uniqueMatches,
//           hasRelevantSkills: matchScore > 0
//         };
//       });

//       // Sort by match score (highest first)
//       scoredModerators.sort((a, b) => b.matchScore - a.matchScore);
      
//       console.log("Moderator ranking:");
//       scoredModerators.forEach(m => {
//         console.log(`${m.firstname}: score ${m.matchScore} (direct: ${m.directSkillMatches}, keywords: ${m.keywordMatches}), matches: ${m.matches.join(', ')}`);
//       });

//       const bestMatch = scoredModerators[0];

//       // If no moderator has relevant skills, don't assign automatically
//       if (!bestMatch || !bestMatch.hasRelevantSkills) {
//         console.warn('No moderator with relevant skills found', {
//           requiredKeywords: uniqueKeywords,
//           availableModerators: allModerators.map(m => ({
//             id: m.id,
//             name: m.firstname,
//             skills: m.skills
//           }))
//         });
        
//         await prisma.ticket.update({
//           where: { id: ticketId },
//           data: { 
//             status: "PENDING",
//             notes: `No qualified moderators available. Required skills: ${uniqueKeywords.join(', ')}`
//           },
//         });
        
//         throw new Error("No moderator with relevant skills available");
//       }

//       console.log('Best moderator match found:', {
//         id: bestMatch.id,
//         name: bestMatch.firstname,
//         skills: bestMatch.skills,
//         matchScore: bestMatch.matchScore,
//         directMatches: bestMatch.directSkillMatches,
//         keywordMatches: bestMatch.keywordMatches,
//         matchedOn: bestMatch.matches
//       });

//       // Assign the ticket to the best matching moderator
//       await prisma.ticket.update({
//         where: { id: ticketId },
//         data: { 
//           assignedToId: bestMatch.id,
//           status: "IN_PROGRESS",
//           assignedToName: bestMatch.firstname,
//           assignedToEmail: bestMatch.email,
//         },
//       });

//       return bestMatch;
//     });

//     // Send notification email
//     await step.run("send-assignment-notification", async () => {
//       const fullTicket = await prisma.ticket.findUnique({
//         where: { id: ticketId },
//         select:{
//           assignedToEmail: true,
//           assignedToName: true,
//           title: true,
//           description: true,
//           priority: true,
//           category: true,
//         }
//       });

//       if (!fullTicket || !fullTicket.assignedToEmail) {
//         console.error('Ticket or user not found for email notification');
//         return;
//       }

//       const emailSent = await sendEmail({
//         to: fullTicket.assignedToEmail,
//         subject: `A ticket has been assigned to you: ${fullTicket.assignedToName}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
//             <h2 style="color: #007BFF;">Ticket Assignment Notification</h2>
//             <p>Dear <strong>${fullTicket.assignedToName}</strong>,</p>

//             <p>You have been assigned to a new support ticket. Please review the details below:</p>

//             <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
//               <p><strong>Title:</strong> ${fullTicket.title}</p>
//               <p><strong>Description:</strong> ${fullTicket.description}</p>
//               <p><strong>Priority:</strong> ${fullTicket.priority}</p>
//               <p><strong>Category:</strong> ${fullTicket.category}</p>
//             </div>

//             <p style="margin-top: 20px;">Please take action as soon as possible.</p>

//             <p>Thank you,<br/>Support Team</p>
//           </div>
//         `,
//       });

//       if (!emailSent) {
//         console.error('Failed to send assignment notification email');
//       }
//     });

//     return { success: true, assignedTo: moderator.id };
//   }
// );
export const updateTicketStatus = inngest.createFunction(  {
    id: "ticket-update-status",
    name: "Ticketing System Inngest status",
  },
  {
    event:'ticket/updated.requested',
  },

async ({ event, step }) => {

  const {ticketId,status,assignedToRole} = event.data


  await step.run("get-ticket", async () => {
      const ticketObj = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!ticketObj) throw new Error(`Ticket with ID ${ticketId} not found`);
      return ticketObj;
    });

  await step.run("update-ticket-status", async () => {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: status,
          assignedToRole
        },
      });
    });


  await step.run("send-status-update-notification", async () => {
    const fullTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        assignedToEmail: true,
        assignedToName: true,
        title: true,
        description: true,
        priority: true,
        category: true,
        createdByName: true,
        createdByEmail: true, // Include creator's email for notifications
      }
    });

    if (!fullTicket || !fullTicket.createdByEmail) {
      console.error('Ticket or user not found for email notification');
      return;
    }

    const emailSent = await sendEmail({
      to: fullTicket.createdByEmail, // Notify the creator of the ticket
      subject: `Ticket status updated: ${fullTicket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #007BFF;">Ticket Status Update</h2>
          <p>Dear <strong>${fullTicket.createdByName}</strong>,</p>

          <p>The status of the ticket you are assigned to has been updated. Please review the details below:</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
            <p><strong>Title:</strong> ${fullTicket.title}</p>
            <p><strong>Description:</strong> ${fullTicket.description}</p>
            <p><strong>Priority:</strong> ${fullTicket.priority}</p>
            <p><strong>Category:</strong> ${fullTicket.category}</p>
            <p><strong>Status:</strong> ${status}</p>
          </div>

          <p style="margin-top: 20px;">Please take action as necessary.</p>

          <p>Thank you,<br/>Support Team</p>
        </div>
      `,
    });

    if (!emailSent) {
      console.error('Failed to send status update notification email');
    }
  });



}

)


