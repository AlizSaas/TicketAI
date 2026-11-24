import { inngest } from "@/inngest/inngest";

import { sendEmail } from "@/lib/mailer";

import { prisma } from "@/lib/prisma";

import { ticketAnalysisAgent } from "./agents/ticketAnalysis";

import { normalizeSkills } from "@/lib/skills";





const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
    console.log("Ticket retrieved:", ticket);

    await step.run("update-ticket-status", async () => {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "PENDING",
        },
      });
    });
    console.log("Ticket status updated to PENDING");

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
      // (strip markdown code fences in case the model adds them)
      const jsonMatch = content.replace(/```(?:json)?/gi, "").match(/\{[\s\S]*\}/);
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

        parsedResponse.relatedSkills = normalizeSkills(parsedResponse.relatedSkills);

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

    // Run the AI analysis in a durable step; fall back to defaults so the ticket is still routed
    const analysis = await step.run("analyze-ticket", async () => {
      return analyzeTicket({
        title: ticket.title,
        description: ticket.description,
      });
    });
    console.log("AI analysis response:", analysis);

    const aiResponse: AIAnalysisResponse = analysis ?? {
      priority: "MEDIUM",
      category: "Other",
      notes: "AI analysis was unavailable; please review this ticket manually.",
      relatedSkills: [],
    };

    // Add the full AI-identified skills (as phrases) and their component keywords
    const cleanSkills = normalizeSkills(aiResponse.relatedSkills);
    if (cleanSkills.length > 0) {
      // Add both the full skill phrases and their component keywords
      cleanSkills.forEach((skill: string) => {
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
          // Only store the clean AI-identified skills; keywords are used for matching only
          relatedSkills: cleanSkills,
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
        console.warn(`No moderators found for company ID ${ticket.companyId}`);
        return null;
      }

      // Current workload (open tickets) per moderator, used to balance assignments
      const openCounts = await prisma.ticket.groupBy({
        by: ["assignedToId"],
        where: {
          companyId: ticket.companyId,
          assignedToId: { in: allModerators.map((m) => m.id) },
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        _count: { _all: true },
      });
      const openByModerator = new Map(
        openCounts.map((c) => [c.assignedToId, c._count._all])
      );

      console.log("Finding moderators for keywords:", uniqueKeywords);
      console.log("Available moderators:", allModerators.map(m => ({
        id: m.id,
        name: m.firstname || "Unknown",
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
        console.log(`\nModerator ${moderator.firstname || "Unknown"}:`);
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
      scoredModerators.sort(
        (a, b) =>
          b.matchScore - a.matchScore ||
          (openByModerator.get(a.id) ?? 0) - (openByModerator.get(b.id) ?? 0)
      );
      
      console.log("Moderator ranking:");
      scoredModerators.forEach(m => {
        console.log(`${m.firstname || "Unknown"}: score ${m.matchScore} (direct: ${m.directSkillMatches}, keywords: ${m.keywordMatches}), matches: ${m.matches.join(', ')}`);
      });

      const bestMatch = scoredModerators[0];

      // If no moderator has relevant skills, fall back to the least busy moderator
      // so every ticket always lands on a moderator's dashboard
      if (!bestMatch.hasRelevantSkills) {
        console.warn('No moderator with relevant skills found, assigning to least busy moderator', {
          requiredKeywords: uniqueKeywords,
        });
      }

      console.log('Best moderator match found:', {
        id: bestMatch.id,
        name: bestMatch.firstname || "Unknown",
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

    if (!moderator) {
      return { success: false, reason: "No moderators available for this company" };
    }

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
        subject: `A ticket has been assigned to you: ${fullTicket.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #007BFF;">Ticket Assignment Notification</h2>
            <p>Dear <strong>${escapeHtml(fullTicket.assignedToName)}</strong>,</p>

            <p>You have been assigned to a new support ticket. Please review the details below:</p>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
              <p><strong>Title:</strong> ${escapeHtml(fullTicket.title)}</p>
              <p><strong>Description:</strong> ${escapeHtml(fullTicket.description)}</p>
              <p><strong>Priority:</strong> ${escapeHtml(fullTicket.priority)}</p>
              <p><strong>Category:</strong> ${escapeHtml(fullTicket.category)}</p>
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
          <p>Dear <strong>${escapeHtml(fullTicket.createdByName)}</strong>,</p>

          <p>The status of your ticket has been updated. Please review the details below:</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
            <p><strong>Title:</strong> ${escapeHtml(fullTicket.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(fullTicket.description)}</p>
            <p><strong>Priority:</strong> ${escapeHtml(fullTicket.priority)}</p>
            <p><strong>Category:</strong> ${escapeHtml(fullTicket.category)}</p>
            <p><strong>Status:</strong> ${escapeHtml(status)}</p>
          </div>

          <p style="margin-top: 20px;">Thank you for your patience.</p>

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


