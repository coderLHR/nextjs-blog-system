'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Sparkles } from 'lucide-react'
import { searchPosts } from '@/lib/actions'

interface SearchResult {
  id: number
  title: string
  slug: string
  excerpt: string | null
}

export function AiSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await searchPosts(q)
      setResults(data)
      setIsOpen(data.length > 0)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(val), 300)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="ai-search-wrapper">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="搜索文章..."
          className="ai-search-input"
        />
        <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--neon-blue)] opacity-50" />
      </div>

      {isOpen && results.length > 0 && (
        <div className="ai-search-dropdown">
          {results.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="ai-search-item"
              onClick={() => {
                setIsOpen(false)
                setQuery('')
              }}
            >
              <div className="font-medium text-sm text-foreground">{post.title}</div>
              {post.excerpt && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {post.excerpt}
                </div>
              )}
            </Link>
          ))}
          <Link
            href="/ai-chat"
            className="ai-search-item flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--neon-blue)]" />
            <span className="text-sm text-[var(--neon-blue)]">用 AI 助手搜索更多内容...</span>
          </Link>
        </div>
      )}
    </div>
  )
}
