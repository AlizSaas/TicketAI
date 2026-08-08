'use client'

import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Flag,
  Loader2,
  Search,
  ShieldAlert,
  StickyNote,
  Users,
  UserCheck,
  UserRound,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getPriorityBadge, getStatusBadge } from '@/lib/adminFun'
import { cn } from '@/lib/utils'

/**
 * Loosely typed shape covering both static (`tool-<name>`) and dynamic
 * MCP tool UI parts. The MCP tool set is discovered at runtime, so the AI
 * SDK cannot narrow `part.type` to string literals at compile time - we
 * pattern-match on `toolName` and `state` instead.
 */
export interface GenericToolPart {
  type: string
  toolCallId: string
  state:
    | 'input-streaming'
    | 'input-available'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-available'
    | 'output-error'
    | 'output-denied'
  input?: unknown
  output?: unknown
  errorText?: string
  approval?: {
    id: string
    approved?: boolean
    reason?: string
    isAutomatic?: boolean
  }
}

interface ToolMeta {
  icon: LucideIcon
  label: string
  runningLabel: string
}

const TOOL_META: Record<string, ToolMeta> = {
  search_tickets: { icon: Search, label: 'Search tickets', runningLabel: 'Searching tickets…' },
  get_ticket: { icon: Search, label: 'Ticket details', runningLabel: 'Looking up ticket…' },
  list_users: { icon: Users, label: 'Team members', runningLabel: 'Looking up team members…' },
  get_user: { icon: UserRound, label: 'User details', runningLabel: 'Loading user…' },
  get_ticket_statistics: { icon: BarChart3, label: 'Ticket statistics', runningLabel: 'Crunching statistics…' },
  assign_ticket: { icon: UserCheck, label: 'Assign ticket', runningLabel: 'Preparing assignment…' },
  update_ticket_status: { icon: ArrowRightLeft, label: 'Update status', runningLabel: 'Preparing status change…' },
  update_ticket_priority: { icon: Flag, label: 'Update priority', runningLabel: 'Preparing priority change…' },
  add_ticket_note: { icon: StickyNote, label: 'Add note', runningLabel: 'Adding note…' },
}

const DEFAULT_META: ToolMeta = { icon: Search, label: 'Tool', runningLabel: 'Working…' }

function shortId(id: unknown) {
  if (typeof id !== 'string') return String(id)
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function describeAction(toolName: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>
  switch (toolName) {
    case 'assign_ticket':
      return `Assign ticket #${shortId(args.ticketId)} to user #${shortId(args.userId)}.`
    case 'update_ticket_status':
      return `Change ticket #${shortId(args.ticketId)} status to ${String(args.status)}.`
    case 'update_ticket_priority':
      return `Change ticket #${shortId(args.ticketId)} priority to ${String(args.priority)}.`
    default:
      return `Run ${toolName.replace(/_/g, ' ')}.`
  }
}

function summarizeOutput(toolName: string, output: unknown): string {
  const result = output as Record<string, unknown> | undefined
  if (!result || typeof result !== 'object') return 'Done.'
  if (result.success === false) return String(result.error ?? 'This action failed.')

  switch (toolName) {
    case 'search_tickets': {
      const count = Number(result.count ?? 0)
      return `Found ${count} ticket${count === 1 ? '' : 's'}.`
    }
    case 'list_users': {
      const count = Number(result.count ?? 0)
      return `Found ${count} user${count === 1 ? '' : 's'}.`
    }
    case 'get_ticket': {
      const ticket = result.ticket as { title?: string } | undefined
      return ticket?.title ? `Loaded "${ticket.title}".` : 'Loaded ticket details.'
    }
    case 'get_user': {
      const user = result.user as { name?: string | null; email?: string } | undefined
      return `Loaded ${user?.name ?? user?.email ?? 'user'}.`
    }
    case 'get_ticket_statistics':
      return `${result.total ?? 0} total tickets analyzed.`
    case 'assign_ticket': {
      const assignedTo = result.assignedTo as { name?: string | null; email?: string } | undefined
      return `Assigned to ${assignedTo?.name ?? assignedTo?.email ?? 'user'}.`
    }
    case 'update_ticket_status': {
      const ticket = result.ticket as { status?: string } | undefined
      return `Status set to ${ticket?.status ?? 'updated'}.`
    }
    case 'update_ticket_priority': {
      const ticket = result.ticket as { priority?: string } | undefined
      return `Priority set to ${ticket?.priority ?? 'updated'}.`
    }
    case 'add_ticket_note':
      return 'Note added.'
    default:
      return 'Done.'
  }
}

function TicketMiniList({ tickets }: { tickets: Array<Record<string, unknown>> }) {
  const shown = tickets.slice(0, 5)
  return (
    <div className="space-y-2">
      {shown.map((ticket) => (
        <div key={String(ticket.id)} className="flex items-center justify-between gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate font-medium">{String(ticket.title)}</span>
          <div className="flex shrink-0 items-center gap-1">
            {getStatusBadge(String(ticket.status))}
            {getPriorityBadge(ticket.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
          </div>
        </div>
      ))}
      {tickets.length > shown.length && (
        <p className="pl-1 text-xs text-muted-foreground">+{tickets.length - shown.length} more</p>
      )}
    </div>
  )
}

function UserMiniList({ users }: { users: Array<Record<string, unknown>> }) {
  const shown = users.slice(0, 5)
  return (
    <div className="space-y-2">
      {shown.map((user) => (
        <div key={String(user.id)} className="flex items-center justify-between gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate font-medium">{String(user.name ?? user.email)}</span>
          <Badge variant="outline" className="shrink-0 text-xs">
            {String(user.role)}
          </Badge>
        </div>
      ))}
      {users.length > shown.length && (
        <p className="pl-1 text-xs text-muted-foreground">+{users.length - shown.length} more</p>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background/60 px-2.5 py-2 text-center">
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

function ToolOutputDetail({ toolName, output }: { toolName: string; output: unknown }) {
  const result = output as Record<string, unknown> | undefined
  if (!result || result.success === false) return null

  if (toolName === 'search_tickets' && Array.isArray(result.tickets) && result.tickets.length > 0) {
    return <TicketMiniList tickets={result.tickets as Array<Record<string, unknown>>} />
  }
  if (toolName === 'list_users' && Array.isArray(result.users) && result.users.length > 0) {
    return <UserMiniList users={result.users as Array<Record<string, unknown>>} />
  }
  if (toolName === 'get_ticket_statistics') {
    const byStatus = (result.byStatus ?? {}) as Record<string, number>
    const byPriority = (result.byPriority ?? {}) as Record<string, number>
    return (
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        <StatTile label="Total" value={Number(result.total ?? 0)} />
        <StatTile label="Unresolved" value={Number(result.unresolved ?? 0)} />
        <StatTile label="Urgent" value={Number(byPriority.urgent ?? 0)} />
        <StatTile label="In progress" value={Number(byStatus.inProgress ?? 0)} />
        <StatTile label="Recent" value={Number(result.recentlyCreated ?? 0)} />
      </div>
    )
  }
  return null
}

export function ToolCall({
  part,
  onRespond,
}: {
  part: GenericToolPart
  onRespond: (approvalId: string, approved: boolean) => void
}) {
  const toolName = part.type.startsWith('tool-') ? part.type.slice('tool-'.length) : part.type
  const meta = TOOL_META[toolName] ?? DEFAULT_META
  const Icon = meta.icon

  const isRunning = part.state === 'input-streaming' || part.state === 'input-available'
  const isAwaitingApproval = part.state === 'approval-requested' && !part.approval?.isAutomatic
  const isAutoApproving = part.state === 'approval-requested' && part.approval?.isAutomatic
  const isResponded = part.state === 'approval-responded'
  const isDenied = part.state === 'output-denied'
  const isError = part.state === 'output-error'
  const isDone = part.state === 'output-available'

  if (isAwaitingApproval && part.approval) {
    const approvalId = part.approval.id
    return (
      <Card className="max-w-md gap-3 border-amber-300/70 bg-amber-50/70 py-3 dark:border-amber-900/60 dark:bg-amber-950/20">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-300">
            <ShieldAlert className="size-4" />
            Confirmation needed
          </div>
          <p className="text-sm text-muted-foreground">{describeAction(toolName, part.input)}</p>
          <Separator className="bg-amber-200/70 dark:bg-amber-900/50" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onRespond(approvalId, false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onRespond(approvalId, true)}>
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('max-w-md gap-2 py-3', isError && 'border-destructive/50')}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center gap-2 text-sm">
          {isRunning || isAutoApproving || isResponded ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : isError ? (
            <XCircle className="size-4 shrink-0 text-destructive" />
          ) : isDenied ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          )}
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">{meta.label}</span>
        </div>
        <p className="pl-6 text-xs text-muted-foreground">
          {isRunning && meta.runningLabel}
          {isAutoApproving && 'Auto-approved, running…'}
          {isResponded && (part.approval?.approved ? 'Confirmed, running…' : 'Cancelling…')}
          {isDenied && (part.approval?.reason || 'This action was cancelled and did not run.')}
          {isError && (part.errorText || 'Something went wrong running this tool.')}
          {isDone && summarizeOutput(toolName, part.output)}
        </p>
        {isDone && (
          <div className="pl-6">
            <ToolOutputDetail toolName={toolName} output={part.output} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
