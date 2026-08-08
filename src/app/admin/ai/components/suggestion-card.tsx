'use client'

import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SuggestionCardProps {
  icon: LucideIcon
  prompt: string
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function SuggestionCard({ icon: Icon, prompt, onSelect, disabled }: SuggestionCardProps) {
  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && onSelect(prompt)}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onSelect(prompt)
        }
      }}
      className={cn(
        'cursor-pointer gap-3 border-dashed p-4 py-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <p className="text-sm leading-snug text-foreground">{prompt}</p>
      </div>
    </Card>
  )
}
