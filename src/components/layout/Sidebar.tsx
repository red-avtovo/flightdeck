import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  GitMerge,
  DollarSign,
  Activity,
  ShieldCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/overview',    label: 'Overview',    Icon: LayoutDashboard },
  { to: '/outcomes',   label: 'Outcomes',    Icon: GitMerge },
  { to: '/cost',       label: 'Cost',         Icon: DollarSign },
  { to: '/reliability',label: 'Reliability',  Icon: Activity },
  { to: '/governance', label: 'Governance',   Icon: ShieldCheck },
] as const

export function Sidebar() {
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
      {/* Logo / wordmark */}
      <div className="flex h-16 items-center px-4 border-b border-slate-700 gap-3 shrink-0">
        <span className="text-indigo-400" aria-hidden>⬡</span>
        <span className="hidden xl:block text-sm font-semibold text-slate-50 tracking-wide">
          Flightdeck
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-indigo-600 text-white'
                 : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
               }`
            }
            aria-label={label}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden xl:block">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
