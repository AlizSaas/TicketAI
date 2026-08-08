import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMCPClient } from '@ai-sdk/mcp'
import { z } from 'zod'
import type { ToolSet } from 'ai'
import { createAdminMcpServer } from './server'
import { allTools } from './tools'
import type { AdminContext } from './auth'

export interface AdminMcpSession {
  /** AI SDK-compatible tool set, ready to pass to `streamText({ tools })`. */
  tools: ToolSet
  /** Tears down the in-process MCP client/server pair for this request. */
  close: () => Promise<void>
}

/**
 * Spins up a fresh, in-process MCP server bound to the given admin context
 * and connects an MCP client to it over a linked in-memory transport pair
 * (the same primitive the official SDK ships for embedding a server and
 * client within one process). The returned AI SDK tools proxy every call
 * through the real MCP protocol - the model never gets direct database or
 * business-logic access.
 */
export async function createAdminMcpSession(context: AdminContext): Promise<AdminMcpSession> {
  const server = createAdminMcpServer(context)
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair()

  await server.connect(serverTransport)

  const client = await createMCPClient({ transport: clientTransport })

  const schemas = Object.fromEntries(
    allTools.map((tool) => [
      tool.name,
      { inputSchema: z.object(tool.inputShape), outputSchema: tool.outputSchema },
    ])
  )

  const tools = await client.tools({ schemas })

  return {
    tools: tools as ToolSet,
    close: async () => {
      await client.close()
      await server.close()
    },
  }
}
