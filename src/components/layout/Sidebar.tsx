import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  GitMerge,
  DollarSign,
  Activity,
  ShieldCheck,
  Users,
  LogOut,
  Github,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getCurrentUser, logout } from '../../auth/session'
import { useFilters } from '../../hooks/useFilters'
import { useMockData } from '../../hooks/useMockData'
import { getActiveAlertCount } from '../../mock/api'

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/overview',    label: 'Overview',    Icon: LayoutDashboard },
  { to: '/outcomes',   label: 'Outcomes',    Icon: GitMerge },
  { to: '/cost',       label: 'Cost',         Icon: DollarSign },
  { to: '/reliability',label: 'Reliability',  Icon: Activity },
  { to: '/governance', label: 'Governance',   Icon: ShieldCheck },
]

const REPO_URL = 'https://github.com/red-avtovo/flightdeck'
// Storybook is built into <base>/storybook by CI (deployed alongside the dashboard).
const STORYBOOK_URL = `${import.meta.env.BASE_URL}storybook/`

// Storybook brand mark (single-path, simple-icons) — rendered in currentColor so it
// shows grayscale in the sidebar rather than the brand pink.
function StorybookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.71.243l-.12 2.71a.18.18 0 00.29.15l1.06-.8.9.7a.18.18 0 00.28-.14l-.1-2.76 1.33-.1a1.2 1.2 0 011.279 1.2v21.596a1.2 1.2 0 01-1.26 1.2l-16.096-.72a1.2 1.2 0 01-1.15-1.16l-.75-19.797a1.2 1.2 0 011.13-1.27L16.7.222zM13.64 9.3c0 .47 3.16.24 3.59-.08 0-3.2-1.72-4.89-4.859-4.89-3.15 0-4.899 1.72-4.899 4.29 0 4.45 5.999 4.53 5.999 6.959 0 .7-.32 1.1-1.05 1.1-.96 0-1.35-.49-1.3-2.16 0-.36-3.649-.48-3.769 0-.27 4.03 2.23 5.2 5.099 5.2 2.79 0 4.969-1.49 4.969-4.18 0-4.77-6.099-4.64-6.099-6.999 0-.97.72-1.1 1.13-1.1.45 0 1.25.07 1.19 1.87z" />
    </svg>
  )
}

const TEAM_ITEMS = [
  { to: '/teams/team-platform',    label: 'Platform' },
  { to: '/teams/team-product',     label: 'Product' },
  { to: '/teams/team-datascience', label: 'Data Science' },
  { to: '/teams/team-mobile',      label: 'Mobile' },
] as const

export function Sidebar() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  // Live count of active alerts for the current filters — the same number the
  // Overview "Alerts (N)" strip shows — surfaced as the Governance nav badge.
  const { period, teamId, model } = useFilters()
  const { data: alertCount } = useMockData(
    () => getActiveAlertCount(period, teamId, model),
    [period, teamId, model],
  )

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-40 flex flex-col
        w-16 xl:w-60
        bg-slate-900 border-r border-slate-700
        transition-[width] duration-200
      "
      aria-label="Main navigation"
    >
      {/* Logo / wordmark — centred in the collapsed icon-rail, left-aligned when expanded. */}
      <div className="flex h-16 items-center justify-center xl:justify-start px-4 border-b border-slate-700 gap-3 shrink-0">
        <span className="text-orange-400" aria-hidden>⬡</span>
        <span className="hidden xl:block text-sm font-semibold text-slate-50 tracking-wide">
          Flightdeck
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => {
            // Only Governance carries a badge: the live active-alert count (hidden at 0).
            const badge = to === '/governance' && alertCount && alertCount > 0 ? alertCount : undefined
            return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-center xl:justify-start gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-orange-600 text-white'
                   : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
                 }`
              }
              aria-label={badge ? `${label}, ${badge} active alerts` : label}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="hidden xl:block flex-1">{label}</span>
              {badge !== undefined && (
                <span
                  className="hidden xl:flex items-center justify-center rounded-full bg-rose-500 text-white text-xs font-semibold px-1.5 min-w-[1.25rem] h-5"
                  aria-hidden="true"
                >
                  {badge}
                </span>
              )}
            </NavLink>
            )
          })}
        </div>

        {/* Teams group */}
        <div className="mt-6">
          <p className="hidden xl:block px-2 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Teams
          </p>
          <div className="space-y-1">
            {TEAM_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center justify-center xl:justify-start gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors
                   ${isActive
                     ? 'bg-orange-600 text-white'
                     : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
                   }`
                }
                aria-label={label}
              >
                <Users className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="hidden xl:block">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Utility links (expanded sidebar only), just above the user delimiter. */}
      <div className="hidden xl:flex shrink-0 items-center gap-1 px-3 pb-2">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          title="GitHub repository"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Github className="h-5 w-5" aria-hidden="true" />
        </a>
        <a
          href={STORYBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Storybook"
          title="Storybook"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <StorybookIcon className="h-5 w-5" />
        </a>
      </div>

      {/* User footer */}
      <div className="shrink-0 border-t border-slate-700 p-3">
        <div className="flex items-center justify-center xl:justify-start gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white"
            aria-label={`${user.name}, ${user.role}`}
          >
            {user.initials}
          </span>
          <div className="hidden xl:block min-w-0">
            <p className="truncate text-sm font-medium text-slate-50">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.role}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center xl:justify-start gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="hidden xl:inline">Log out</span>
        </button>
      </div>
    </aside>
  )
}
