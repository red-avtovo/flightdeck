import type { AgentTask, AutonomyBand, TaskStatus } from '../../types'
import { formatDuration } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

interface TaskListProps {
  tasks: AgentTask[]
  onTaskClick: (task: AgentTask) => void
  loading?: boolean
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  completed: 'text-emerald-400',
  failed:    'text-rose-400',
  cancelled: 'text-slate-400',
  running:   'text-sky-400',
  queued:    'text-slate-400',
  blocked:   'text-amber-400',
}

const BAND_COLORS: Partial<Record<AutonomyBand, string>> = {
  autonomous:    'text-emerald-400',
  human_assisted:'text-sky-400',
  human_rescued: 'text-amber-400',
  failed:        'text-rose-400',
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
            <th className={thClass}>Duration</th>
            <th className={thClass}>Model</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tasks.length === 0 ? (
            <tr><td colSpan={6}><EmptyState message="No tasks found" /></td></tr>
          ) : (
            tasks.map(task => {
              const duration = task.completedAt
                ? new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()
                : null
              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => onTaskClick(task)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onTaskClick(task)}
                  aria-label={`Task ${task.id}, status: ${task.status}`}
                >
                  <td className={`${tdClass} font-mono text-xs`}>{task.id}</td>
                  <td className={tdClass}>{task.taskType.replace(/_/g, ' ')}</td>
                  <td className={`${tdClass} ${STATUS_COLORS[task.status]}`}>{task.status}</td>
                  <td className={`${tdClass} ${task.autonomyBand ? BAND_COLORS[task.autonomyBand] : 'text-slate-500'}`}>
                    {task.autonomyBand?.replace(/_/g, ' ') ?? '—'}
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
