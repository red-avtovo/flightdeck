# Stage 3: Auth & Shell — RequireAuth, FilterContext, Layout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication guard, global filter state, and the full layout shell — Sidebar, TopBar, AppShell, and complete React Router routing. After this stage the app navigates between pages (all showing placeholders) and the auth flow works end-to-end.

**Architecture:** `RequireAuth` reads `sessionStorage`; `FilterContext` holds period/teamId/model state; `AppShell` composes Sidebar + TopBar + `<Outlet />`. All dashboard routes are nested under `<RequireAuth>` then `<AppShell>`. A `public/404.html` re-serves `index.html` for deep-link refresh on GitHub Pages.

**Tech Stack:** React 18, React Router v6, Tailwind CSS, Lucide React icons, `src/types/index.ts` from Stage 1, `src/mock/api.ts` from Stage 2

## Prerequisites

Stages 1 and 2 must be complete:
- `src/types/index.ts` exists
- `src/mock/api.ts` exists and exports all API functions
- `src/lib/utils.ts` exists

---

## File Map

| File | Purpose |
|------|---------|
| `src/auth/RequireAuth.tsx` | Route guard — reads sessionStorage, renders `<Outlet />` or redirects to `/login` |
| `src/context/FilterContext.tsx` | Global period/teamId/model state with `useReducer`; exports `FilterProvider` + `useFilterContext` |
| `src/hooks/useFilters.ts` | Convenience hook — returns `{ state, dispatch, setters }` |
| `src/hooks/useMockData.ts` | Generic `{ data, loading, error }` wrapper for any async fetcher |
| `src/components/layout/Sidebar.tsx` | 240px fixed sidebar; collapses to icon-only rail at < 1280px |
| `src/components/layout/TopBar.tsx` | 64px top bar; org name left; period / team / model pickers right |
| `src/components/layout/AppShell.tsx` | Composes Sidebar + TopBar + `<main><Outlet /></main>` |
| `src/App.tsx` | Full routing tree — replaces the Stage 1 placeholder |
| `public/404.html` | SPA deep-link fallback for GitHub Pages |

---

### Task 1: RequireAuth Guard

**Files:**
- Create: `src/auth/RequireAuth.tsx`
- Create: `src/pages/__tests__/RequireAuth.test.tsx`

**Interfaces:**
- Consumes: React Router v6 (`Navigate`, `Outlet`)
- Produces: `RequireAuth` component (renders `<Outlet />` when authenticated, redirects to `/login` otherwise)

- [ ] **Step 1: Write the failing test at `src/pages/__tests__/RequireAuth.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../../auth/RequireAuth'

function setup(authenticated: boolean) {
  sessionStorage.clear()
  if (authenticated) sessionStorage.setItem('authenticated', 'true')
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => sessionStorage.clear())

  it('renders protected content when authenticated', () => {
    setup(true)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    setup(false)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/RequireAuth.test.tsx
```

Expected: FAIL — "Cannot find module '../../auth/RequireAuth'"

- [ ] **Step 3: Create `src/auth/RequireAuth.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'

export function RequireAuth() {
  const isAuthenticated = sessionStorage.getItem('authenticated') === 'true'
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/pages/__tests__/RequireAuth.test.tsx
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/auth/RequireAuth.tsx src/pages/__tests__/RequireAuth.test.tsx
git commit -m "feat: add RequireAuth route guard using sessionStorage"
```

---

### Task 2: FilterContext and Hooks

**Files:**
- Create: `src/context/FilterContext.tsx`
- Create: `src/hooks/useFilters.ts`
- Create: `src/hooks/useMockData.ts`

**Interfaces:**
- Consumes: `Period` from `src/types/index.ts`
- Produces:
  - `FilterProvider` — wraps the app tree
  - `useFilterContext(): { state: FilterState; dispatch: Dispatch<FilterAction> }`
  - `useFilters(): FilterState & { setPeriod, setTeamId, setModel }`
  - `useMockData<T>(fetcher: () => Promise<T>, deps: unknown[]): { data: T|null, loading: boolean, error: string|null }`

- [ ] **Step 1: Create `src/context/FilterContext.tsx`**

No test needed — context is an internal wiring detail covered by integration tests on pages.

```tsx
import { createContext, useContext, useReducer } from 'react'
import type { Period } from '../types'

export interface FilterState {
  period: Period
  teamId: string | null
  model: string | null
}

export type FilterAction =
  | { type: 'SET_PERIOD'; period: Period }
  | { type: 'SET_TEAM'; teamId: string | null }
  | { type: 'SET_MODEL'; model: string | null }

const initialState: FilterState = { period: '30d', teamId: null, model: null }

function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_PERIOD': return { ...state, period: action.period }
    case 'SET_TEAM':   return { ...state, teamId: action.teamId }
    case 'SET_MODEL':  return { ...state, model: action.model }
  }
}

const FilterContext = createContext<{
  state: FilterState
  dispatch: React.Dispatch<FilterAction>
} | null>(null)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <FilterContext.Provider value={{ state, dispatch }}>{children}</FilterContext.Provider>
}

export function useFilterContext() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider')
  return ctx
}
```

- [ ] **Step 2: Create `src/hooks/useFilters.ts`**

```typescript
import { useFilterContext } from '../context/FilterContext'
import type { Period } from '../types'

export function useFilters() {
  const { state, dispatch } = useFilterContext()
  return {
    ...state,
    setPeriod: (period: Period) => dispatch({ type: 'SET_PERIOD', period }),
    setTeamId: (teamId: string | null) => dispatch({ type: 'SET_TEAM', teamId }),
    setModel: (model: string | null) => dispatch({ type: 'SET_MODEL', model }),
  }
}
```

- [ ] **Step 3: Create `src/hooks/useMockData.ts`**

```typescript
import { useEffect, useState } from 'react'

export function useMockData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then(result => {
        if (!cancelled) { setData(result); setLoading(false) }
      })
      .catch((err: Error) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0

- [ ] **Step 5: Commit**

```bash
git add src/context/FilterContext.tsx src/hooks/useFilters.ts src/hooks/useMockData.ts
git commit -m "feat: add FilterContext, useFilters, and useMockData hooks"
```

---

### Task 3: Sidebar

**Files:**
- Create: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `lucide-react` icons, React Router `NavLink`
- Produces: `Sidebar` component — 240px fixed nav with icon-only rail at < 1280px

The nav links (in order): Overview (`/overview`), Outcomes (`/outcomes`), Cost (`/cost`), Reliability (`/reliability`), Governance (`/governance`).

- [ ] **Step 1: Create `src/components/layout/Sidebar.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add responsive Sidebar with icon-only collapse below 1280px"
```

---

### Task 4: TopBar

**Files:**
- Create: `src/components/layout/TopBar.tsx`

**Interfaces:**
- Consumes: `useFilters` hook; lists of team names and model names (passed as props or derived from static constants)
- Produces: `TopBar` component — 64px bar with org name and filter pickers

- [ ] **Step 1: Create `src/components/layout/TopBar.tsx`**

```tsx
import { useFilters } from '../../hooks/useFilters'
import type { Period } from '../../types'

const PERIODS: Period[] = ['7d', '30d', '90d']

const TEAMS = [
  { id: null,                label: 'All teams' },
  { id: 'team-platform',    label: 'Platform' },
  { id: 'team-product',     label: 'Product' },
  { id: 'team-datascience', label: 'Data Science' },
  { id: 'team-mobile',      label: 'Mobile' },
]

const MODELS = [
  { id: null,                label: 'All models' },
  { id: 'claude-opus-4',    label: 'Opus 4' },
  { id: 'claude-sonnet-4-6',label: 'Sonnet 4.6' },
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
        <label className="sr-only" htmlFor="period-select">Time range</label>
        <select
          id="period-select"
          className={selectClass}
          value={period}
          onChange={e => setPeriod(e.target.value as Period)}
        >
          {PERIODS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="team-select">Team</label>
        <select
          id="team-select"
          className={selectClass}
          value={teamId ?? ''}
          onChange={e => setTeamId(e.target.value || null)}
        >
          {TEAMS.map(t => (
            <option key={t.id ?? 'all'} value={t.id ?? ''}>{t.label}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="model-select">Model</label>
        <select
          id="model-select"
          className={selectClass}
          value={model ?? ''}
          onChange={e => setModel(e.target.value || null)}
        >
          {MODELS.map(m => (
            <option key={m.id ?? 'all'} value={m.id ?? ''}>{m.label}</option>
          ))}
        </select>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "feat: add TopBar with period, team, and model filter selects"
```

---

### Task 5: AppShell + Full Routing + 404 Fallback

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Modify: `src/App.tsx` (full replacement of the Stage 1 placeholder)
- Create: `public/404.html`

**Interfaces:**
- Consumes: `Sidebar`, `TopBar`, `RequireAuth`, `FilterProvider`, `React.lazy` page imports
- Produces: a navigable app — all 8 routes working (pages show "Coming soon" placeholders until Stage 5)

- [ ] **Step 1: Create `src/components/layout/AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar />
      <TopBar />
      <main
        className="pt-16 pl-16 xl:pl-60 min-h-screen"
        id="main-content"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create placeholder page components for all 8 pages**

Create these minimal placeholder files — they will be replaced entirely in Stage 5:

`src/pages/LoginPage.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  function handleLogin() {
    sessionStorage.setItem('authenticated', 'true')
    navigate('/overview')
  }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-96 bg-slate-900 rounded-xl p-8 border border-slate-700">
        <h1 className="text-xl font-bold text-slate-50 mb-6">Sign in to Flightdeck</h1>
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          Continue with Okta
        </button>
      </div>
    </div>
  )
}
```

`src/pages/OverviewPage.tsx`:
```tsx
export default function OverviewPage() {
  return <p className="text-slate-400">Overview — coming in Stage 5</p>
}
```

`src/pages/OutcomesPage.tsx`:
```tsx
export default function OutcomesPage() {
  return <p className="text-slate-400">Outcomes — coming in Stage 5</p>
}
```

`src/pages/CostPage.tsx`:
```tsx
export default function CostPage() {
  return <p className="text-slate-400">Cost — coming in Stage 5</p>
}
```

`src/pages/ReliabilityPage.tsx`:
```tsx
export default function ReliabilityPage() {
  return <p className="text-slate-400">Reliability — coming in Stage 5</p>
}
```

`src/pages/GovernancePage.tsx`:
```tsx
export default function GovernancePage() {
  return <p className="text-slate-400">Governance — coming in Stage 5</p>
}
```

`src/pages/TeamDetailPage.tsx`:
```tsx
export default function TeamDetailPage() {
  return <p className="text-slate-400">Team Detail — coming in Stage 5</p>
}
```

`src/pages/RepoDetailPage.tsx`:
```tsx
export default function RepoDetailPage() {
  return <p className="text-slate-400">Repo Detail — coming in Stage 5</p>
}
```

- [ ] **Step 3: Replace `src/App.tsx` with the full routing tree**

```tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FilterProvider } from './context/FilterContext'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/layout/AppShell'

const LoginPage       = lazy(() => import('./pages/LoginPage'))
const OverviewPage    = lazy(() => import('./pages/OverviewPage'))
const OutcomesPage    = lazy(() => import('./pages/OutcomesPage'))
const CostPage        = lazy(() => import('./pages/CostPage'))
const ReliabilityPage = lazy(() => import('./pages/ReliabilityPage'))
const GovernancePage  = lazy(() => import('./pages/GovernancePage'))
const TeamDetailPage  = lazy(() => import('./pages/TeamDetailPage'))
const RepoDetailPage  = lazy(() => import('./pages/RepoDetailPage'))

function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="h-8 w-48 rounded bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-800 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-slate-800 animate-pulse" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/flightdeck">
      <FilterProvider>
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={null}>
              <LoginPage />
            </Suspense>
          } />
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/overview" element={
                <Suspense fallback={<PageSkeleton />}><OverviewPage /></Suspense>
              } />
              <Route path="/outcomes" element={
                <Suspense fallback={<PageSkeleton />}><OutcomesPage /></Suspense>
              } />
              <Route path="/cost" element={
                <Suspense fallback={<PageSkeleton />}><CostPage /></Suspense>
              } />
              <Route path="/reliability" element={
                <Suspense fallback={<PageSkeleton />}><ReliabilityPage /></Suspense>
              } />
              <Route path="/governance" element={
                <Suspense fallback={<PageSkeleton />}><GovernancePage /></Suspense>
              } />
              <Route path="/teams/:teamId" element={
                <Suspense fallback={<PageSkeleton />}><TeamDetailPage /></Suspense>
              } />
              <Route path="/repos/:repoId" element={
                <Suspense fallback={<PageSkeleton />}><RepoDetailPage /></Suspense>
              } />
            </Route>
          </Route>
        </Routes>
      </FilterProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Create `public/404.html`** (SPA deep-link fallback for GitHub Pages)

```html
<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <script>
    // Preserve the path and query string for SPA routing
    var l = window.location
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 2).join('/') +
      '/?p=/' + l.pathname.slice(1).replace(/&/g, '~and~') +
      (l.search ? '&q=' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    )
  </script>
</head>
<body></body>
</html>
```

- [ ] **Step 5: Verify the full build passes**

```bash
pnpm build
```

Expected: `dist/` generated with no TypeScript errors and no console errors

- [ ] **Step 6: Run `pnpm dev` and manually verify**

```bash
pnpm dev
```

Open `http://localhost:5173/flightdeck/` in a browser:
1. You should be redirected to `/flightdeck/login`
2. Clicking "Continue with Okta" should navigate to `/flightdeck/overview` and show "Overview — coming in Stage 5"
3. The Sidebar links should navigate between pages
4. The TopBar period/team/model dropdowns should be visible

Stop the dev server once verified.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/AppShell.tsx src/App.tsx public/404.html src/pages/LoginPage.tsx src/pages/OverviewPage.tsx src/pages/OutcomesPage.tsx src/pages/CostPage.tsx src/pages/ReliabilityPage.tsx src/pages/GovernancePage.tsx src/pages/TeamDetailPage.tsx src/pages/RepoDetailPage.tsx
git commit -m "feat: add AppShell layout, full routing tree, 404 SPA fallback, and placeholder pages"
```

---

## Stage 3 Complete

At this point you have:
- A navigable app with auth guard, global filter state, and all 8 routes wired
- Sidebar collapses to icon rail on < 1280px viewports
- TopBar drives global period / team / model filters
- Auth survives page refresh (sessionStorage)
- Deep-link refresh on GitHub Pages handled by `public/404.html`

**Next:** Stage 4 — UI Components (KpiCard, charts, tables, SpanDrawer)
