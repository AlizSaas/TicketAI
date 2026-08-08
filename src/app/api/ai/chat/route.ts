import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai'
import { getAdminMcpContext } from '@/lib/mcp/auth'
import { createAdminMcpSession } from '@/lib/mcp/client'
import { approvalRequiredToolNames } from '@/lib/mcp/tools'
import { adminAssistantModel } from '@/lib/ai/model'
import { buildAdminAssistantSystemPrompt } from '@/lib/ai/system-prompt'

// Streaming chat responses can legitimately take longer than the default
// serverless timeout, especially once tool calls are involved.
export const maxDuration = 60

export async function POST(req: Request) {
  // Authorization happens here, server-side, before anything else. The
  // model/client can claim whatever it wants - only this check matters.
  let context
  try {
    context = await getAdminMcpContext()
  } catch {
    return Response.json(
      { error: 'Unauthorized. Only company admins can use the Admin AI assistant.' },
      { status: 403 }
    )
  }

  let messages: UIMessage[]
  try {
    ;({ messages } = await req.json())
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Every tool call for this request is bound to `context` and can only ever
  // read/write data scoped to the admin's own company.
  const session = await createAdminMcpSession(context)

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: adminAssistantModel,
    system: buildAdminAssistantSystemPrompt(context),
    messages: modelMessages,
    tools: session.tools,
    stopWhen: stepCountIs(8),
    // Higher-risk mutations must be explicitly confirmed by the admin in the
    // UI before they execute. Read tools and low-risk writes run immediately.
    toolApproval: ({ toolCall }) =>
      approvalRequiredToolNames.has(toolCall.toolName) ? 'user-approval' : 'not-applicable',
    // Cryptographically binds approval requests/responses to this server so
    // a modified client cannot fabricate an approval for a sensitive tool.
    experimental_toolApprovalSecret: process.env.TOOL_APPROVAL_SECRET,
    onFinish: async () => {
      await session.close()
    },
    onError: async () => {
      await session.close()
    },
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error('[admin-ai-chat-error]', error)
      return 'The assistant ran into a problem. Please try again.'
    },
  })
}
