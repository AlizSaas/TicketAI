import { z } from 'zod'
import type { AdminContext } from '../auth'

/**
 * Describes a single MCP tool: its name, description, validated input shape,
 * validated (discriminated union success/failure) output schema, whether it
 * requires explicit admin confirmation before executing, and the business
 * logic handler itself.
 *
 * Every handler receives the trusted, server-derived `AdminContext` - never
 * a client/model supplied identity - so authorization and multi-tenant
 * scoping cannot be bypassed by anything the AI says.
 */
export interface ToolDefinition<
  Shape extends z.ZodRawShape = z.ZodRawShape,
  Output extends z.ZodTypeAny = z.ZodTypeAny,
> {
  name: string
  description: string
  inputShape: Shape
  outputSchema: Output
  /** Higher-risk mutations that must be confirmed by the admin before running. */
  requiresApproval?: boolean
  handler: (context: AdminContext, input: z.infer<z.ZodObject<Shape>>) => Promise<z.infer<Output>>
}

export function defineTool<Shape extends z.ZodRawShape, Output extends z.ZodTypeAny>(
  definition: ToolDefinition<Shape, Output>
): ToolDefinition<Shape, Output> {
  return definition
}

/**
 * Type-erased view of a `ToolDefinition` used to store a heterogeneous list
 * of tools (each with its own concrete input/output schema) in a single
 * array. Individual tools remain fully typed at their definition site; this
 * type is only used at the registry/wiring boundary (server.ts, client.ts)
 * where each tool's concrete input/output types no longer matter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any, any>


