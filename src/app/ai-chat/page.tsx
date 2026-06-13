'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatSidebar } from '@/components/ai-chat/ChatSidebar'
import { ChatArea } from '@/components/ai-chat/ChatArea'
import { ChatInput } from '@/components/ai-chat/ChatInput'

interface Session {
  id: number
  title: string
  deepThinking: boolean
  createdAt: string
}

interface Message {
  id?: number
  role: string
  content: string
}

export default function AiChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [deepThinking, setDeepThinking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/sessions')
      if (!res.ok) {
        setSessions([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setSessions(list)
      if (list.length > 0 && !activeSessionId) {
        selectSession(list[0].id)
      }
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load messages for a session
  const loadMessages = useCallback(async (sessionId: number) => {
    try {
      const res = await fetch(`/api/ai/messages?sessionId=${sessionId}`)
      const data = await res.json()
      setMessages(data)
    } catch {
      setMessages([])
    }
  }, [])

  const selectSession = useCallback(async (id: number) => {
    setActiveSessionId(id)
    await loadMessages(id)
  }, [loadMessages])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Create new session
  const handleNewSession = async () => {
    try {
      const res = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deepThinking }),
      })
      const session = await res.json()
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      setMessages([])
      setStreamingContent('')
    } catch {
      // ignore
    }
  }

  // Delete session
  const handleDeleteSession = async (id: number) => {
    try {
      await fetch(`/api/ai/sessions?id=${id}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch {
      // ignore
    }
  }

  // Send message
  const handleSend = async (content: string) => {
    if (!activeSessionId) {
      // Create session first
      try {
        const res = await fetch('/api/ai/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deepThinking }),
        })
        const session = await res.json()
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
        await sendToApi(session.id, content)
      } catch {
        // ignore
      }
      return
    }
    await sendToApi(activeSessionId, content)
  }

  const sendToApi = async (sessionId: number, content: string) => {
    const userMessage: Message = { role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)
    setStreamingContent('')

    const allMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          sessionId,
          deepThinking,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${errorText}` }])
        setIsStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n')

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (!trimmed.startsWith('data: ')) continue

            try {
              const json = JSON.parse(trimmed.slice(6))
              if (json.content) {
                accumulated += json.content
                setStreamingContent(accumulated)
              }
            } catch {
              // skip
            }
          }
        }
      }

      // Finalize: add assistant message to local state
      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }])
      setStreamingContent('')
      setIsStreaming(false)

      // Refresh session list to update title
      loadSessions()
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '网络错误，请稍后重试' }])
      setIsStreaming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        deepThinking={deepThinking}
        onSelectSession={selectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onToggleDeepThinking={() => setDeepThinking(!deepThinking)}
      />
      <div className="chat-main">
        <ChatArea
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
