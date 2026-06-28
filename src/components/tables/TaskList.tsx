import type { AgentTask, AutonomyBand, TaskStatus } from '../../types'
import { formatDuration } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

interface TaskListProps {
  tasks: AgentTask[]
  onTaskClick: (task: AgentTask) => void
  loading?: boolean
}

// Pill styling — translucent fill + ring so warn/error states actually pop against the dark table.
const badge = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap'

const STATUS_BADGE: Record<TaskStatus, string> = {
  completed: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  failed:    'bg-rose-500/15 text-rose-300 ring-rose-500/40',
  cancelled: 'bg-slate-600/20 text-slate-400 ring-slate-500/30',
  running:   'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  queued:    'bg-slate-600/20 text-slate-400 ring-slate-500/30',
  blocked:   'bg-amber-500/15 text-amber-300 ring-amber-500/40',
}

const BAND_BADGE: Partial<Record<AutonomyBand, string>> = {
  autonomous:    'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  human_assisted:'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  human_rescued: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  failed:        'bg-rose-500/15 text-rose-300 ring-rose-500/40',
}

export function TaskList({ tasks, onTaskClick, loading = false }: TaskListProps) {
  if (loading) return <Skeleton className="h-64 w-full" />

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Task ID</th>
            <th className={thClass}>Type</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Autonomy</th>
            <th className={thClass}>Issues</th>
            <th className={thClass}>Duration</th>
            <th className={thClass}>Model</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tasks.length === 0 ? (
            <tr><td colSpan={7}><EmptyState message="No tasks found" /></td></tr>
          ) : (
            tasks.map(task => {
              const duration = task.completedAt
                ? new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()
                : null
              const hasIssues = task.failedToolCallCount > 0 || task.policyBlockCount > 0 || task.humanInterventionRequired
              // Tint the whole row when a task failed so errors read at a glance.
              const rowTint = task.status === 'failed'
                ? 'bg-rose-500/[0.06] hover:bg-rose-500/10'
                : 'hover:bg-slate-800/50'
              return (
                <tr
                  key={task.id}
                  className={`${rowTint} transition-colors cursor-pointer`}
                  onClick={() => onTaskClick(task)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onTaskClick(task)}
                  aria-label={`Task ${task.id}, status: ${task.status}`}
                >
                  <td className={`${tdClass} font-mono text-xs`}>{task.id}</td>
                  <td className={tdClass}>{task.taskType.replace(/_/g, ' ')}</td>
                  <td className={tdClass}>
                    <span className={`${badge} ${STATUS_BADGE[task.status]}`}>{task.status}</span>
                  </td>
                  <td className={tdClass}>
                    {task.autonomyBand ? (
                      <span className={`${badge} ${BAND_BADGE[task.autonomyBand] ?? 'bg-slate-600/20 text-slate-400 ring-slate-500/30'}`}>
                        {task.autonomyBand.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    {hasIssues ? (
                      <div className="flex flex-wrap gap-1">
                        {task.failedToolCallCount > 0 && (
                          <span className={`${badge} bg-rose-500/15 text-rose-300 ring-rose-500/40`}>
                            {task.failedToolCallCount} failed
                          </span>
                        )}
                        {task.policyBlockCount > 0 && (
                          <span className={`${badge} bg-amber-500/15 text-amber-300 ring-amber-500/40`}>
                            {task.policyBlockCount} blocked
                          </span>
                        )}
                        {task.humanInterventionRequired && (
                          <span className={`${badge} bg-sky-500/10 text-sky-300 ring-sky-500/30`}>
                            manual
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className={tdClass}>{duration !== null ? formatDuration(duration) : '—'}</td>
                  <td className={`${tdClass} text-xs`}>{task.model.replace('claude-', '')}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
