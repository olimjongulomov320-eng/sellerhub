'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

type SearchResult = {
  type: string
  id: string
  title: string
  subtitle: string
  href: string
}

export function CommandPalette({ orgSlug }: { orgSlug: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/organizations/${orgSlug}/search?q=${encodeURIComponent(q)}`
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.results)
        }
      } finally {
        setLoading(false)
      }
    },
    [orgSlug]
  )

  useEffect(() => {
    const timeout = setTimeout(() => runSearch(query), 200)
    return () => clearTimeout(timeout)
  }, [query, runSearch])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-72 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-sm text-muted-foreground"
        aria-label="Поиск"
      >
        <Search className="size-4" />
        <span>Поиск…</span>
        <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-xs">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-32"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск товаров, заказов, клиентов, объявлений…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <p className="p-3 text-sm text-muted-foreground">Поиск…</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Ничего не найдено.</p>
          )}
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                setOpen(false)
                setQuery('')
                router.push(result.href as Parameters<typeof router.push>[0])
              }}
              className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-surface-muted"
            >
              <span className="font-medium">{result.title}</span>
              <span className="text-xs text-muted-foreground">
                {result.type} · {result.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
