import { AlertTriangle, BarChart3, Clock, ListChecks, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SuggestedPrompt {
  icon: LucideIcon
  text: string
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { icon: AlertTriangle, text: "Show me today's urgent tickets" },
  { icon: ListChecks, text: 'How many unresolved tickets do we have?' },
  { icon: Users, text: 'Which moderator has the most tickets?' },
  { icon: Clock, text: 'Show me tickets that have been pending for more than 3 days' },
  { icon: BarChart3, text: 'Give me a summary of our ticket workload' },
]
