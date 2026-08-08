import { ticketTools } from './tickets'
import { userTools } from './users'
import { statisticsTools } from './statistics'
import type { AnyToolDefinition } from './types'

/** Every MCP tool available to the Admin AI assistant. */
export const allTools: AnyToolDefinition[] = [...ticketTools, ...userTools, ...statisticsTools]

/** Names of tools that mutate data and must be confirmed by the admin before executing. */
export const approvalRequiredToolNames = new Set(
  allTools.filter((tool) => tool.requiresApproval).map((tool) => tool.name)
)

export type { ToolDefinition, AnyToolDefinition } from './types'
export * from './tickets'
export * from './users'
export * from './statistics'

