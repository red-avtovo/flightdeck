import { useLocation } from 'react-router-dom'
import { useFilters } from '../../hooks/useFilters'
import { getActiveCompany } from '../../auth/session'
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

const ROUTE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/outcomes': 'Outcomes & Quality',
  '/cost': 'Cost & Efficiency',
  '/reliability': 'Reliability & Traces',
  '/governance': 'Governance & Audit',
}

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/teams/')) return 'Team drill-down'
  if (pathname.startsWith('/repos/')) return 'Repo drill-down'
  return 'Overview'
}

function isDrillDown(pathname: string): boolean {
  return pathname.startsWith('/teams/') || pathname.startsWith('/repos/')
}

const selectClass =
  'rounded bg-transparent text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500'

interface FilterPillProps {
  children: React.ReactNode
}

function FilterPill({ children }: FilterPillProps) {
  // h-9 matches the Period button group's height so all three top-bar controls
  // line up. The pills are otherwise shorter: their height came from a single
  // py-1 around a short native <select>, while the Period group stacks the
  // container's p-1 on top of its buttons' py-1. A shared height token keeps the
  // row aligned regardless of each control's intrinsic content height.
  return (
    <div className="flex h-9 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3">
      {children}
    </div>
  )
}

export function TopBar() {
  const { period, teamId, model, setPeriod, setTeamId, setModel } = useFilters()
  const { pathname } = useLocation()
  const drillDown = isDrillDown(pathname)
  const pageTitle = getPageTitle(pathname)
  const orgName = getActiveCompany().name

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-700 pl-20 xl:pl-64"
      role="banner"
    >
      <div className="flex flex-col justify-center leading-tight">
        <span className="text-sm font-semibold text-slate-50">{pageTitle}</span>
        <span className="text-xs text-slate-400">{orgName}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          role="group"
          aria-label="Time range"
          // h-9 is the shared control height; the Team/Model pills match it (see FilterPill).
          className="flex h-9 items-center gap-1 rounded-full border border-slate-700 bg-slate-800 p-1"
        >
          <span className="px-2 text-xs font-medium text-slate-400" aria-hidden="true">
            Period
          </span>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                period === p
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {!drillDown && (
          <>
            <FilterPill>
              <span className="text-xs font-medium text-slate-400" aria-hidden="true">
                Team
              </span>
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
            </FilterPill>

            <FilterPill>
              <span className="text-xs font-medium text-slate-400" aria-hidden="true">
                Model
              </span>
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
            </FilterPill>
          </>
        )}
      </div>
    </header>
  )
}
