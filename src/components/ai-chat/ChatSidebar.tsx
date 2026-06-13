'use client'

import { MessageSquare, Plus, Trash2, Brain } from 'lucide-react'

interface Session {
  id: number
  title: string
  deepThinking: boolean
  createdAt: string
}

interface ChatSidebarProps {
  sessions: Session[]
  activeSessionId: number | null
  deepThinking: boolean
  onSelectSession: (id: number) => void
  onNewSession: () => void
  onDeleteSession: (id: number) => void
  onToggleDeepThinking: () => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  deepThinking,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onToggleDeepThinking,
}: ChatSidebarProps) {
  return (
    <aside className="chat-sidebar">
      <div className="p-4 space-y-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-[var(--neon-blue)] text-sm font-medium hover:bg-[rgba(0,212,255,0.12)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建对话
        </button>

        <button
          onClick={onToggleDeepThinking}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            deepThinking
              ? 'bg-[rgba(255,107,53,0.08)] border border-[rgba(255,107,53,0.2)] text-[var(--neon-orange)]'
              : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain className="h-4 w-4" />
          深度思考
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
            deepThinking
              ? 'bg-[rgba(255,107,53,0.15)] text-[var(--neon-orange)]'
              : 'bg-[rgba(255,255,255,0.06)] text-muted-foreground'
          }`}>
            {deepThinking ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-2 mb-2">
          历史对话
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4 text-center">
            暂无对话记录
          </p>
        ) : (
          <div className="space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`chat-sidebar-item flex items-center gap-2 group ${
                  activeSessionId === s.id ? 'active' : ''
                }`}
                onClick={() => onSelectSession(s.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                <span className="flex-1 truncate">{s.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(s.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-all"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
