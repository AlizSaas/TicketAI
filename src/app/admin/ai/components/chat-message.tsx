'use client'

import { Bot, User } from 'lucide-react'
import { isDynamicToolUIPart, isToolUIPart, type UIMessage } from 'ai'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { ToolCall, type GenericToolPart } from './tool-call'

interface ChatMessageProps {
  message: UIMessage
  timestamp?: Date
  onRespondToApproval: (approvalId: string, approved: boolean) => void
}

export function ChatMessage({ message, timestamp, onRespondToApproval }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className="mt-0.5 shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn('flex min-w-0 max-w-[85%] flex-col gap-2', isUser && 'items-end')}>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            if (!part.text) return null
            return (
              <div
                key={index}
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}
              >
                {part.text}
              </div>
            )
          }

          if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
            return (
              <ToolCall key={index} part={part as unknown as GenericToolPart} onRespond={onRespondToApproval} />
            )
          }

          return null
        })}
        {timestamp && (
          <span className="px-1 text-[11px] text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
