'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { Sparkles } from 'lucide-react'

interface Message {
  id?: number
  role: string
  content: string
}

interface ChatAreaProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
}

export function ChatArea({ messages, streamingContent, isStreaming }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,255,0.08)] flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-[var(--neon-blue)]" />
          </div>
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
          >
            AI 助手
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            输入你的问题开始对话。开启深度思考可获得更详细的推理分析。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-messages">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id ?? `msg-${idx}`}
            role={msg.role}
            content={msg.content}
          />
        ))}
        {isStreaming && (
          <MessageBubble
            role="assistant"
            content={streamingContent || '...'}
            isStreaming
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
