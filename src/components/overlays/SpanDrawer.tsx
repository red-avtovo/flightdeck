import { useEffect } from 'react'
import type { TraceSpan } from '../../types'
import { formatDuration } from '../../lib/utils'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

interface SpanDrawerProps {
  open: boolean
  taskId: string
  spans: TraceSpan[]
  onClose: () => void
  loading?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  ok:      'text-emerald-400',
  error:   'text-rose-400',
  timeout: 'text-amber-400',
  blocked: 'text-slate-400',
}

export function SpanDrawer({ open, taskId, spans, onClose, loading = false }: SpanDrawerProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const sorted = [...spans].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-slate-900 border-l border-slate-700 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Spans for task ${taskId}`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">Task spans</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{taskId}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Close span drawer"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState message="No spans found for this task" />
          ) : (
            <table className="w-full" role="table">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Duration</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sorted.map(span => (
                  <tr
                    key={span.id}
                    className={`${span.status === 'error' || span.status === 'timeout' ? 'bg-rose-950/30' : ''} hover:bg-slate-800/50`}
                  >
                    <td className="px-4 py-2 text-xs font-mono text-slate-400">{span.type}</td>
                    <td className="px-4 py-2 text-sm text-slate-200">{span.name}</td>
                    <td className="px-4 py-2 text-sm tabular-nums text-slate-300">{formatDuration(span.durationMs)}</td>
                    <td className={`px-4 py-2 text-sm ${STATUS_STYLES[span.status] ?? 'text-slate-300'}`}>{span.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </aside>
    </>
  )
}
