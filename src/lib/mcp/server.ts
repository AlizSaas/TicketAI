import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { AdminContext } from './auth'
import { allTools } from './tools'
import { toToolFailure } from './errors'

/**
 * Builds an MCP server exposing the Admin AI tool set, bound to a single
 * authenticated admin's context for the lifetime of one chat request.
 *
 * Every tool call is validated by the MCP SDK against its zod input shape
 * before the handler ever runs (see `@modelcontextprotocol/sdk`), and every
 * handler only ever touches Prisma through `context.companyId` - the AI
 * cannot supply or override this value.
 */
export function createAdminMcpServer(context: AdminContext): McpServer {
  const server = new McpServer({ name: 'ticketai-admin-assistant', version: '1.0.0' })

  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputShape },
      async (input: Record<string, unknown>): Promise<CallToolResult> => {
        try {
          const result = await tool.handler(context, input)
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result) }],
            structuredContent: result,
          }
        } catch (error) {
          const failure = toToolFailure(error)
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(failure) }],
            structuredContent: failure as unknown as Record<string, unknown>,
          }
        }
      }
    )
  }

  return server
}

