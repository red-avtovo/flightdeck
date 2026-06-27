import { useFilters } from '../../hooks/useFilters'
import type { Period } from '../../types'

const PERIODS: Period[] = ['7d', '30d', '90d']

const TEAMS = [
  { id: null, label: 'All teams' },
  { id: 'team-platform', label: 'Platform' },
  { id: 'team-product', label: 'Product' },
  { id: 'team-datascience', label: 'Data Science' },
  { id: 'team-mobile', label: 'Mobile' },
]

const MODELS = [
  { id: null, label: 'All models' },
  { id: 'claude-opus-4', label: 'Opus 4' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
]

const selectClass =
  'rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function TopBar() {
  const { period, teamId, model, setPeriod, setTeamId, setModel } = useFilters()

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-700 pl-20 xl:pl-64"
      role="banner"
    >
      <span className="text-sm font-semibold text-slate-50">Acme Corp</span>

      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="period-select">
          Time range
        </label>
        <select
          id="period-select"
          className={selectClass}
          value={period}
          onChange={e => setPeriod(e.target.value as Period)}
        >
          {PERIODS.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="team-select">
          Team
        </label>
        <select
          id="team-select"
          className={selectClass}
          value={teamId ?? ''}
          onChange={e => setTeamId(e.target.value || null)}
        >
          {TEAMS.map(t => (
            <option key={t.id ?? 'all'} value={t.id ?? ''}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          className={selectClass}
          value={model ?? ''}
          onChange={e => setModel(e.target.value || null)}
        >
          {MODELS.map(m => (
            <option key={m.id ?? 'all'} value={m.id ?? ''}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
