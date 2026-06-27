# Stage 5: Pages — All 8 Dashboard Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 8 pages so the dashboard answers each page's primary question with real mock data, proper loading states, and empty states. Replaces the placeholder pages from Stage 3.

**Architecture:** Each page calls one or more API functions via `useMockData`, selects filter state via `useFilters`, and composes Stage 4 components. Pages are lazy-loaded (already wired in Stage 3's `App.tsx`). All data fetches run in parallel where independent.

**Tech Stack:** React 18, React Router v6, `src/mock/api.ts`, `src/hooks/useMockData.ts`, `src/hooks/useFilters.ts`, all Stage 4 components

## Prerequisites

Stages 1–4 complete. All components and API functions exist.

---

## File Map

| File | Purpose |
|------|---------|
| `src/pages/LoginPage.tsx` | Okta-branded login — sets sessionStorage + navigates to /overview |
| `src/pages/OverviewPage.tsx` | AutonomyBar + 5 KPI cards + tasks-over-time + team scatter + alerts |
| `src/pages/OutcomesPage.tsx` | 4 KPI cards + edit distance trend + outcome-by-type stacked bar + PR outcomes table |
| `src/pages/CostPage.tsx` | 4 KPI cards + spend trend + budget gauge + cost/PR by task type + team table |
| `src/pages/ReliabilityPage.tsx` | 4 KPI cards + duration trend + error rate by category + tool leaderboard + tool table + task list + span drawer |
| `src/pages/GovernancePage.tsx` | 3 KPI cards + security events stacked area + event log |
| `src/pages/TeamDetailPage.tsx` | Header + 4 mini-sections + member list |
| `src/pages/RepoDetailPage.tsx` | Header + repo readiness strip + 4 mini-sections |
| `src/pages/__tests__/LoginPage.test.tsx` | Login form interactions + auth flow |
| `src/pages/__tests__/OverviewPage.test.tsx` | Overview page integration test |
| `src/pages/__tests__/OutcomesPage.test.tsx` | Outcomes page integration test |
| `src/pages/__tests__/CostPage.test.tsx` | Cost page integration test |
| `src/pages/__tests__/ReliabilityPage.test.tsx` | Reliability page integration test |
| `src/pages/__tests__/GovernancePage.test.tsx` | Governance page integration test |
| `src/pages/__tests__/TeamDetailPage.test.tsx` | Team detail integration test |
| `src/pages/__tests__/RepoDetailPage.test.tsx` | Repo detail integration test |

---

### Task 1: LoginPage

**Files:**
- Modify: `src/pages/LoginPage.tsx` (full replacement of Stage 3 placeholder)
- Create: `src/pages/__tests__/LoginPage.test.tsx`

**Interfaces:**
- Consumes: React Router `useNavigate`, `sessionStorage`
- Produces: functional login page — sets `sessionStorage.authenticated = 'true'`, navigates to `/overview`

- [ ] **Step 1: Write the failing test at `src/pages/__tests__/LoginPage.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '../LoginPage'

function setup() {
  sessionStorage.clear()
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/overview" element={<div>Overview Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => sessionStorage.clear())

  it('renders Okta-branded login form', () => {
    setup()
    expect(screen.getByRole('button', { name: /continue with okta/i })).toBeInTheDocument()
  })

  it('sets sessionStorage authenticated after clicking button', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue with okta/i }))
    expect(sessionStorage.getItem('authenticated')).toBe('true')
  })

  it('navigates to /overview after login', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue with okta/i }))
    expect(screen.getByText('Overview Page')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/LoginPage.test.tsx
```

Expected: FAIL (placeholder LoginPage doesn't have Okta branding / proper behavior)

- [ ] **Step 3: Replace `src/pages/LoginPage.tsx` with full implementation**

```tsx
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  function handleLogin() {
    sessionStorage.setItem('authenticated', 'true')
    navigate('/overview')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Org logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold" aria-hidden>⬡</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h1 className="text-xl font-bold text-slate-50 text-center mb-1">Sign in to Flightdeck</h1>
          <p className="text-sm text-slate-400 text-center mb-8">Acme Corp · Okta SSO</p>

          <div className="mb-6">
            <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
              Work email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@acme.example"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Continue with Okta
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected by Okta Identity Cloud
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/pages/__tests__/LoginPage.test.tsx
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/__tests__/LoginPage.test.tsx
git commit -m "feat: implement LoginPage with Okta branding and sessionStorage auth"
```

---

### Task 2: OverviewPage

**Files:**
- Modify: `src/pages/OverviewPage.tsx` (full replacement)
- Create: `src/pages/__tests__/OverviewPage.test.tsx`

**Primary question answered:** "Are our agents producing accepted engineering output autonomously, at a reasonable cost?"

- [ ] **Step 1: Write the failing test at `src/pages/__tests__/OverviewPage.test.tsx`**

```tsx
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import OverviewPage from '../OverviewPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <FilterProvider>
        <OverviewPage />
      </FilterProvider>
    </MemoryRouter>,
  )
}

describe('OverviewPage', () => {
  it('renders AutonomyBar with 4 labelled segments after data loads', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /autonomy breakdown/i })).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders 5 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      const texts = ['Tasks Started', 'Autonomy Rate', 'Cost/Merged PR', 'Median Time to PR', 'Active Users']
      texts.forEach(t => expect(screen.getByText(t)).toBeInTheDocument())
    }, { timeout: 1000 })
  })

  it('shows loading skeleton before data resolves', () => {
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders alerts strip', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/alert/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/OverviewPage.test.tsx
```

Expected: FAIL (placeholder renders no real data)

- [ ] **Step 3: Replace `src/pages/OverviewPage.tsx`**

```tsx
import { useState } from 'react'
import { getOrgOverview } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { AutonomyBar } from '../components/charts/AutonomyBar'
import { StackedAreaChart } from '../components/charts/StackedAreaChart'
import { ScatterChart } from '../components/charts/ScatterChart'
import { AlertBadge } from '../components/cards/AlertBadge'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatDuration, formatNumber } from '../lib/utils'
import type { AutonomyBand } from '../types'

export default function OverviewPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getOrgOverview(period), [period, teamId, model])
  const [activeBand, setActiveBand] = useState<AutonomyBand | null>(null)

  const BAND_SERIES = [
    { key: 'autonomous',    label: 'Autonomous',     color: '#10b981' },
    { key: 'human_assisted',label: 'Human-assisted', color: '#0ea5e9' },
    { key: 'human_rescued', label: 'Human-rescued',  color: '#f59e0b' },
    { key: 'failed',        label: 'Failed',         color: '#f43f5e' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading overview">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const { autonomyBreakdown, kpis, tasksOverTime, teamScatter, alerts } = data
  const filteredOverTime = activeBand
    ? tasksOverTime.map(d => ({ date: d.date, [activeBand]: d[activeBand] }))
    : tasksOverTime

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Organization Overview</h1>
        <p className="text-sm text-slate-400">Are agents producing accepted output autonomously, at a reasonable cost?</p>
      </div>

      {/* Alerts strip */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg border border-amber-800/40 bg-amber-950/20">
          <span className="text-xs font-medium text-amber-400">Alerts ({alerts.length})</span>
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-1.5">
              <AlertBadge severity={alert.severity} label={alert.type.replace(/_/g, ' ')} />
              <span className="text-xs text-slate-400">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hero: AutonomyBar */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Agent Autonomy Breakdown</h2>
        <AutonomyBar breakdown={autonomyBreakdown} onBandClick={setActiveBand} activeBand={activeBand} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Tasks Started" value={kpis.tasksStarted.value} format="number" trend={kpis.tasksStarted.trendPct} sparkline={kpis.tasksStarted.sparkline} />
        <KpiCard title="Autonomy Rate" value={kpis.autonomyRate.value} format="percent" trend={kpis.autonomyRate.trendPct} sparkline={kpis.autonomyRate.sparkline} tooltip="% of terminal tasks classified as autonomous (merged PR + <20% human edits)" />
        <KpiCard title="Cost/Merged PR" value={kpis.costPerMergedPr.value} format="currency" trend={kpis.costPerMergedPr.trendPct} sparkline={kpis.costPerMergedPr.sparkline} />
        <KpiCard title="Median Time to PR" value={kpis.medianTimeToPr.value} format="duration" trend={kpis.medianTimeToPr.trendPct} />
        <KpiCard title="Active Users" value={kpis.activeUsers.value} format="number" trend={kpis.activeUsers.trendPct} sparkline={kpis.activeUsers.sparkline} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">
            Tasks over time {activeBand ? `— ${activeBand.replace(/_/g, ' ')} only` : ''}
          </h2>
          <StackedAreaChart data={filteredOverTime} series={BAND_SERIES} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Team comparison</h2>
          <ScatterChart data={teamScatter} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/pages/__tests__/OverviewPage.test.tsx
```

Expected: PASS — 4 tests (may need `{ timeout: 1500 }` if mock API is slow in test env)

- [ ] **Step 5: Commit**

```bash
git add src/pages/OverviewPage.tsx src/pages/__tests__/OverviewPage.test.tsx
git commit -m "feat: implement OverviewPage with AutonomyBar, KPI cards, scatter chart"
```

---

### Task 3: OutcomesPage

**Files:**
- Modify: `src/pages/OutcomesPage.tsx`
- Create: `src/pages/__tests__/OutcomesPage.test.tsx`

**Primary question:** "Is agent output being accepted with minimal human rework?"

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import OutcomesPage from '../OutcomesPage'

function renderPage() {
  return render(
    <MemoryRouter><FilterProvider><OutcomesPage /></FilterProvider></MemoryRouter>,
  )
}

describe('OutcomesPage', () => {
  it('renders 4 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      const labels = ['Merge Rate', 'Human Edit Distance', 'CI Pass Rate', 'Revert Rate']
      labels.forEach(l => expect(screen.getByText(l)).toBeInTheDocument())
    }, { timeout: 1000 })
  })

  it('renders edit distance trend chart', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/edit distance/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders PR outcomes table with at least 3 rows', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3)
    }, { timeout: 1000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/OutcomesPage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Replace `src/pages/OutcomesPage.tsx`**

```tsx
import { getOutcomesMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { LineChart } from '../components/charts/LineChart'
import { BarChart } from '../components/charts/BarChart'
import { OutcomeTable } from '../components/tables/OutcomeTable'
import { Skeleton } from '../components/ui/Skeleton'
import { formatPercent } from '../lib/utils'

export default function OutcomesPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getOutcomesMetrics(period), [period, teamId, model])

  const BAND_SERIES = [
    { key: 'autonomous',    label: 'Autonomous',     color: '#10b981' },
    { key: 'human_assisted',label: 'Human-assisted', color: '#0ea5e9' },
    { key: 'human_rescued', label: 'Human-rescued',  color: '#f59e0b' },
    { key: 'failed',        label: 'Failed',         color: '#f43f5e' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading outcomes">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  const { kpis, editDistanceTrend, outcomeByTaskType, reviewCommentsTrend, prOutcomes } = data

  const editDistanceSeries = [{ key: 'value', label: 'Edit Distance %', color: '#6366f1' }]
  const commentsSeries = [{ key: 'value', label: 'Avg Review Comments', color: '#0ea5e9' }]
  const outcomeData = outcomeByTaskType.map(d => ({ name: d.taskType.replace(/_/g, ' '), ...d }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Outcomes & Quality</h1>
        <p className="text-sm text-slate-400">Is agent output being accepted with minimal human rework?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Merge Rate" value={kpis.mergeRate.value} format="percent" trend={kpis.mergeRate.trendPct} tooltip="Merged PRs ÷ PRs opened by agent" />
        <KpiCard title="Human Edit Distance" value={kpis.humanEditDistancePct.value / 100} format="percent" trend={kpis.humanEditDistancePct.trendPct} tooltip="Avg human commits/lines after the agent, over total" />
        <KpiCard title="CI Pass Rate" value={kpis.ciFirstAttemptPassRate.value} format="percent" trend={kpis.ciFirstAttemptPassRate.trendPct} tooltip="Share of agent PRs whose FIRST CI run passed" />
        <KpiCard title="Revert Rate" value={kpis.revertRate.value} format="percent" trend={kpis.revertRate.trendPct} tooltip="PRs reverted ÷ merged PRs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Human edit distance trend</h2>
          <LineChart data={editDistanceTrend} series={editDistanceSeries} formatY={v => `${v.toFixed(1)}%`} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Review comments per PR</h2>
          <LineChart data={reviewCommentsTrend} series={commentsSeries} formatY={v => v.toFixed(1)} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 col-span-full">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Outcome by task type</h2>
          <BarChart data={outcomeData} series={BAND_SERIES} xKey="name" stacked formatY={v => formatPercent(v)} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">PR outcomes by repo & task type</h2>
        <OutcomeTable rows={prOutcomes} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/pages/__tests__/OutcomesPage.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/OutcomesPage.tsx src/pages/__tests__/OutcomesPage.test.tsx
git commit -m "feat: implement OutcomesPage with edit distance trend and PR outcomes table"
```

---

### Task 4: CostPage

**Files:**
- Modify: `src/pages/CostPage.tsx`
- Create: `src/pages/__tests__/CostPage.test.tsx`

**Primary question:** "Are we spending wisely on agent tasks?"

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import CostPage from '../CostPage'

function renderPage() {
  return render(<MemoryRouter><FilterProvider><CostPage /></FilterProvider></MemoryRouter>)
}

describe('CostPage', () => {
  it('renders 4 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      ['Total Spend', 'Cost/Task', 'Cost/Merged PR', 'Token Waste'].forEach(l =>
        expect(screen.getByText(l)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })

  it('renders cost/PR by task type horizontal bar chart', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/cost.*task type/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders team cost breakdown table with Platform row', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/CostPage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Replace `src/pages/CostPage.tsx`**

```tsx
import { getCostMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { AreaChart } from '../components/charts/AreaChart'
import { BudgetGauge } from '../components/charts/BudgetGauge'
import { BarChart } from '../components/charts/BarChart'
import { TeamTable } from '../components/tables/TeamTable'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatPercent } from '../lib/utils'

const MONTHLY_BUDGET_USD = 50_000

export default function CostPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getCostMetrics(period), [period, teamId, model])

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading cost">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  const { kpis, spendTrend, budgetBurnPct, costPerMergedPrByTaskType, teamBreakdown } = data
  const spentUsd = budgetBurnPct * MONTHLY_BUDGET_USD

  const costByType = costPerMergedPrByTaskType
    .filter(d => d.costUsd > 0)
    .sort((a, b) => b.costUsd - a.costUsd)
    .map(d => ({ name: d.taskType.replace(/_/g, ' '), costUsd: d.costUsd }))

  const costSeries = [{ key: 'costUsd', label: 'Cost/Merged PR', color: '#6366f1' }]
  const spendSeries = [{ key: 'value', label: 'Daily Spend', color: '#6366f1' }]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Cost & Efficiency</h1>
        <p className="text-sm text-slate-400">Are we spending wisely on agent tasks?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Spend" value={kpis.totalSpend.value} format="currency" trend={kpis.totalSpend.trendPct} sparkline={kpis.totalSpend.sparkline} />
        <KpiCard title="Cost/Task" value={kpis.costPerTask.value} format="currency" trend={kpis.costPerTask.trendPct} />
        <KpiCard title="Cost/Merged PR" value={kpis.costPerMergedPr.value} format="currency" trend={kpis.costPerMergedPr.trendPct} />
        <KpiCard title="Token Waste" value={kpis.tokenWastePct.value} format="percent" trend={kpis.tokenWastePct.trendPct} tooltip="Tokens spent on tasks that produced no merged PR" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Spend over time</h2>
          <AreaChart data={spendTrend} dataKey="value" formatY={formatCurrency} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 flex flex-col items-center">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4 self-start">Monthly budget</h2>
          <BudgetGauge spentUsd={spentUsd} budgetUsd={MONTHLY_BUDGET_USD} />
          <p className="mt-2 text-xs text-slate-400">{formatCurrency(spentUsd)} of {formatCurrency(MONTHLY_BUDGET_USD)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Cost/merged PR by task type</h2>
        <BarChart data={costByType} series={costSeries} layout="horizontal" xKey="name" height={220} formatY={formatCurrency} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Team cost breakdown</h2>
        <TeamTable rows={teamBreakdown} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/pages/__tests__/CostPage.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/CostPage.tsx src/pages/__tests__/CostPage.test.tsx
git commit -m "feat: implement CostPage with budget gauge and horizontal task-type bar chart"
```

---

### Task 5: ReliabilityPage

**Files:**
- Modify: `src/pages/ReliabilityPage.tsx`
- Create: `src/pages/__tests__/ReliabilityPage.test.tsx`

**Primary question:** "Are agents healthy? Where do they fail and why?"

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import ReliabilityPage from '../ReliabilityPage'

function renderPage() {
  return render(<MemoryRouter><FilterProvider><ReliabilityPage /></FilterProvider></MemoryRouter>)
}

describe('ReliabilityPage', () => {
  it('renders P95 task duration KPI card', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/P95 Task Duration/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders tool performance table with at least 4 rows', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(4)
    }, { timeout: 1000 })
  })

  it('opens SpanDrawer when a task row is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(2)
    }, { timeout: 1000 })
    // click first task row (after header)
    const rows = screen.getAllByRole('row')
    const taskRow = rows.find(r => r.getAttribute('aria-label')?.startsWith('Task'))
    if (taskRow) await user.click(taskRow)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/ReliabilityPage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Replace `src/pages/ReliabilityPage.tsx`**

```tsx
import { useState } from 'react'
import { getReliabilityMetrics, getTaskList, getTaskSpans } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { LineChart } from '../components/charts/LineChart'
import { BarChart } from '../components/charts/BarChart'
import { ToolTable } from '../components/tables/ToolTable'
import { TaskList } from '../components/tables/TaskList'
import { SpanDrawer } from '../components/overlays/SpanDrawer'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDuration, formatPercent } from '../lib/utils'
import type { AgentTask, TraceSpan } from '../types'

export default function ReliabilityPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getReliabilityMetrics(period), [period, teamId, model])
  const { data: tasks, loading: tasksLoading } = useMockData(
    () => getTaskList({ period, teamId: teamId ?? undefined, model: model ?? undefined }),
    [period, teamId, model],
  )

  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)
  const [spans, setSpans] = useState<TraceSpan[]>([])
  const [spansLoading, setSpansLoading] = useState(false)

  async function handleTaskClick(task: AgentTask) {
    setSelectedTask(task)
    setSpansLoading(true)
    const result = await getTaskSpans(task.id)
    setSpans(result)
    setSpansLoading(false)
  }

  const ERROR_CATEGORIES = ['tool_error', 'timeout', 'env_setup', 'policy_block', 'model_error', 'test_failure'] as const
  const CATEGORY_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#e879f9', '#0ea5e9', '#10b981']
  const errorSeries = ERROR_CATEGORIES.map((cat, i) => ({
    key: cat,
    label: cat.replace(/_/g, ' '),
    color: CATEGORY_COLORS[i],
  }))

  const durationSeries = [
    { key: 'p50', label: 'P50', color: '#6366f1' },
    { key: 'p95', label: 'P95', color: '#f43f5e' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading reliability">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  const { kpis, durationTrend, errorRateByCategory, toolPerformance } = data

  const toolLeaderboard = [...toolPerformance]
    .sort((a, b) => b.errorRate - a.errorRate)
    .map(t => ({ name: t.tool.replace(/_/g, ' '), errorRate: t.errorRate }))
  const leaderboardSeries = [{ key: 'errorRate', label: 'Error Rate', color: '#f43f5e' }]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Reliability & Traces</h1>
        <p className="text-sm text-slate-400">Are agents healthy? Where do they fail and why?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="P95 Task Duration" value={kpis.p95TaskDurationMs.value} format="duration" trend={kpis.p95TaskDurationMs.trendPct} />
        <KpiCard title="Tool Failure Rate" value={kpis.toolFailureRate.value} format="percent" trend={kpis.toolFailureRate.trendPct} />
        <KpiCard title="Timeout Rate" value={kpis.timeoutRate.value} format="percent" trend={kpis.timeoutRate.trendPct} />
        <KpiCard title="Env Setup P95" value={kpis.envSetupP95Ms.value} format="duration" trend={kpis.envSetupP95Ms.trendPct} tooltip="P95 of operator-provisioned env_setup spans" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Task duration P50 / P95</h2>
          <LineChart data={durationTrend} series={durationSeries} formatY={formatDuration} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Error rate by category</h2>
          <LineChart data={errorRateByCategory} series={errorSeries} formatY={v => formatPercent(v)} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Tool reliability leaderboard</h2>
          <BarChart data={toolLeaderboard} series={leaderboardSeries} layout="horizontal" xKey="name" height={220} formatY={v => formatPercent(v)} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Tool performance</h2>
          <ToolTable rows={toolPerformance} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Recent tasks (click to view spans)</h2>
        <TaskList tasks={(tasks ?? []).slice(0, 50)} onTaskClick={handleTaskClick} loading={tasksLoading} />
      </div>

      <SpanDrawer
        open={selectedTask !== null}
        taskId={selectedTask?.id ?? ''}
        spans={spans}
        onClose={() => { setSelectedTask(null); setSpans([]) }}
        loading={spansLoading}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/pages/__tests__/ReliabilityPage.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/ReliabilityPage.tsx src/pages/__tests__/ReliabilityPage.test.tsx
git commit -m "feat: implement ReliabilityPage with span drawer, tool leaderboard, error category trends"
```

---

### Task 6: GovernancePage

**Files:**
- Modify: `src/pages/GovernancePage.tsx`
- Create: `src/pages/__tests__/GovernancePage.test.tsx`

**Primary question:** "Are agents operating within policy boundaries?"

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import GovernancePage from '../GovernancePage'

function renderPage() {
  return render(<MemoryRouter><FilterProvider><GovernancePage /></FilterProvider></MemoryRouter>)
}

describe('GovernancePage', () => {
  it('renders 3 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      ['Policy Blocks', 'Secrets Detected', 'Human Approvals'].forEach(l =>
        expect(screen.getByText(l)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })

  it('event log has at least one row of each event type', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(3)
    }, { timeout: 1000 })
  })

  it('filtering to secret_detected shows only those rows', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('combobox').length > 0, { timeout: 1000 })
    await user.selectOptions(screen.getByRole('combobox'), 'secret_detected')
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1) // skip header
      rows.forEach(r => expect(r.textContent).toMatch(/secret|no events/i))
    })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/GovernancePage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Replace `src/pages/GovernancePage.tsx`**

```tsx
import { getGovernanceMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { StackedAreaChart } from '../components/charts/StackedAreaChart'
import { EventLog } from '../components/tables/EventLog'
import { Skeleton } from '../components/ui/Skeleton'

export default function GovernancePage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getGovernanceMetrics(period), [period, teamId, model])

  const EVENT_SERIES = [
    { key: 'policy_block',            label: 'Policy Block',    color: '#f43f5e' },
    { key: 'secret_detected',         label: 'Secret Detected', color: '#f59e0b' },
    { key: 'human_approval_required', label: 'Human Approval',  color: '#8b5cf6' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading governance">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const { kpis, eventsOverTime, events } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Governance & Audit</h1>
        <p className="text-sm text-slate-400">Are agents operating within policy boundaries?</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Policy Blocks" value={kpis.policyBlocks.value} format="number" trend={kpis.policyBlocks.trendPct} />
        <KpiCard title="Secrets Detected" value={kpis.secretsDetected.value} format="number" trend={kpis.secretsDetected.trendPct} />
        <KpiCard title="Human Approvals" value={kpis.humanApprovalsRequired.value} format="number" trend={kpis.humanApprovalsRequired.trendPct} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Security events over time</h2>
        <StackedAreaChart data={eventsOverTime} series={EVENT_SERIES} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Event log</h2>
        <EventLog events={events} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/pages/__tests__/GovernancePage.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/GovernancePage.tsx src/pages/__tests__/GovernancePage.test.tsx
git commit -m "feat: implement GovernancePage with security event stacked area and filterable event log"
```

---

### Task 7: TeamDetailPage

**Files:**
- Modify: `src/pages/TeamDetailPage.tsx`
- Create: `src/pages/__tests__/TeamDetailPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import TeamDetailPage from '../TeamDetailPage'

function renderPage(teamId = 'team-platform') {
  return render(
    <MemoryRouter initialEntries={[`/teams/${teamId}`]}>
      <FilterProvider>
        <Routes>
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        </Routes>
      </FilterProvider>
    </MemoryRouter>,
  )
}

describe('TeamDetailPage', () => {
  it('shows team name in header', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders 4 mini-sections', async () => {
    renderPage()
    await waitFor(() => {
      ['Outcomes', 'Cost', 'Reliability', 'Governance'].forEach(s =>
        expect(screen.getByText(s)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })

  it('each section has a View full link', async () => {
    renderPage()
    await waitFor(() => {
      const links = screen.getAllByText(/view full/i)
      expect(links.length).toBeGreaterThanOrEqual(4)
    }, { timeout: 1000 })
  })

  it('renders member list with at least 2 rows', async () => {
    renderPage()
    await waitFor(() => {
      const memberTable = screen.getByRole('table', { name: /members/i })
      expect(memberTable.querySelectorAll('tr').length).toBeGreaterThanOrEqual(3)
    }, { timeout: 1000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/TeamDetailPage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Replace `src/pages/TeamDetailPage.tsx`**

```tsx
import { Link, useParams } from 'react-router-dom'
import { getTeamDetail } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatDuration, formatPercent } from '../lib/utils'

const SECTION_LINKS: Record<string, string> = {
  Outcomes:   '/outcomes',
  Cost:       '/cost',
  Reliability:'/reliability',
  Governance: '/governance',
}

export default function TeamDetailPage() {
  const { teamId = '' } = useParams<{ teamId: string }>()
  const { period } = useFilters()
  const { data, loading } = useMockData(() => getTeamDetail(teamId, period), [teamId, period])

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading team detail">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  const { team, autonomyRate, taskCount, spendUsd, sections, members } = data

  const MINI_SECTIONS = [
    { label: 'Outcomes',    kpis: sections.outcomes,    labels: ['Merge Rate', 'CI Pass Rate'] },
    { label: 'Cost',        kpis: sections.cost,        labels: ['Total Spend', 'Cost/Task'] },
    { label: 'Reliability', kpis: sections.reliability, labels: ['P95 Duration', 'Tool Failure Rate'] },
    { label: 'Governance',  kpis: sections.governance,  labels: ['Policy Blocks', 'Secrets Detected'] },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-50">{team.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{team.memberCount} members</p>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-slate-400">Tasks</p><p className="text-2xl font-bold tabular-nums text-slate-50">{taskCount}</p></div>
            <div><p className="text-xs text-slate-400">Autonomy</p><p className="text-2xl font-bold tabular-nums text-slate-50">{formatPercent(autonomyRate)}</p></div>
            <div><p className="text-xs text-slate-400">Spend</p><p className="text-2xl font-bold tabular-nums text-slate-50">{formatCurrency(spendUsd)}</p></div>
          </div>
        </div>
      </div>

      {/* Mini sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MINI_SECTIONS.map(({ label, kpis, labels }) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</h2>
              <Link
                to={`${SECTION_LINKS[label]}?team=${teamId}`}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                View full →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {kpis.map((kpi, i) => (
                <KpiCard key={i} title={labels[i]} value={kpi.value} format="number" trend={kpi.trendPct} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Team members</h2>
        <table className="w-full" aria-label="Members">
          <thead className="bg-slate-800">
            <tr>
              {['Name', 'Email', 'First Active', 'Last Active'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-slate-800/50">
                <td className="px-3 py-2 text-sm text-slate-200 font-medium">{m.name}</td>
                <td className="px-3 py-2 text-sm text-slate-400">{m.email}</td>
                <td className="px-3 py-2 text-sm text-slate-400">{new Date(m.firstActive).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-sm text-slate-400">{new Date(m.lastActive).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/pages/__tests__/TeamDetailPage.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/TeamDetailPage.tsx src/pages/__tests__/TeamDetailPage.test.tsx
git commit -m "feat: implement TeamDetailPage with 4 mini-sections and member list"
```

---

### Task 8: RepoDetailPage

**Files:**
- Modify: `src/pages/RepoDetailPage.tsx`
- Create: `src/pages/__tests__/RepoDetailPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import RepoDetailPage from '../RepoDetailPage'

function renderPage(repoId = 'repo-platform-core') {
  return render(
    <MemoryRouter initialEntries={[`/repos/${repoId}`]}>
      <FilterProvider>
        <Routes>
          <Route path="/repos/:repoId" element={<RepoDetailPage />} />
        </Routes>
      </FilterProvider>
    </MemoryRouter>,
  )
}

describe('RepoDetailPage', () => {
  it('renders repo readiness strip with 3 boolean badges', async () => {
    renderPage()
    await waitFor(() => {
      const badges = ['Test command', 'CI configured', 'Agent instructions']
      badges.forEach(b => expect(screen.getByText(new RegExp(b, 'i'))).toBeInTheDocument())
    }, { timeout: 1000 })
  })

  it('renders repo name in header', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/platform-core/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders 4 mini-sections', async () => {
    renderPage()
    await waitFor(() => {
      ['Outcomes', 'Cost', 'Reliability', 'Governance'].forEach(s =>
        expect(screen.getByText(s)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/pages/__tests__/RepoDetailPage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Replace `src/pages/RepoDetailPage.tsx`**

```tsx
import { Link, useParams } from 'react-router-dom'
import { getRepoDetail } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatPercent } from '../lib/utils'

function ReadinessBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${ok ? 'border-emerald-700 bg-emerald-950/40 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
      <span aria-hidden>{ok ? '✓' : '✗'}</span>
      {label}
    </div>
  )
}

const SECTION_LINKS: Record<string, string> = {
  Outcomes:   '/outcomes',
  Cost:       '/cost',
  Reliability:'/reliability',
  Governance: '/governance',
}

export default function RepoDetailPage() {
  const { repoId = '' } = useParams<{ repoId: string }>()
  const { period } = useFilters()
  const { data, loading } = useMockData(() => getRepoDetail(repoId, period), [repoId, period])

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading repo detail">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  const { repo, autonomyRate, taskCount, spendUsd, sections } = data

  const MINI_SECTIONS = [
    { label: 'Outcomes',    kpis: sections.outcomes,    labels: ['Merge Rate', 'CI Pass Rate'] },
    { label: 'Cost',        kpis: sections.cost,        labels: ['Total Spend', 'Cost/Task'] },
    { label: 'Reliability', kpis: sections.reliability, labels: ['P95 Duration', 'Tool Failure Rate'] },
    { label: 'Governance',  kpis: sections.governance,  labels: ['Policy Blocks', 'Secrets Detected'] },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-50 font-mono">{repo.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{repo.id}</p>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-slate-400">Tasks</p><p className="text-2xl font-bold text-slate-50">{taskCount}</p></div>
            <div><p className="text-xs text-slate-400">Autonomy</p><p className="text-2xl font-bold text-slate-50">{formatPercent(autonomyRate)}</p></div>
            <div><p className="text-xs text-slate-400">Spend</p><p className="text-2xl font-bold text-slate-50">{formatCurrency(spendUsd)}</p></div>
          </div>
        </div>
      </div>

      {/* Repo Readiness strip */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Repo Readiness</h2>
        <div className="flex flex-wrap gap-2">
          <ReadinessBadge ok={repo.testCommandDetected} label="Test command detected" />
          <ReadinessBadge ok={repo.ciConfigured} label="CI configured" />
          <ReadinessBadge ok={repo.agentInstructionsPresent} label="Agent instructions present" />
        </div>
      </div>

      {/* Mini sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MINI_SECTIONS.map(({ label, kpis, labels }) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</h2>
              <Link to={`${SECTION_LINKS[label]}?repo=${repoId}`} className="text-xs text-indigo-400 hover:text-indigo-300">
                View full →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {kpis.map((kpi, i) => (
                <KpiCard key={i} title={labels[i]} value={kpi.value} format="number" trend={kpi.trendPct} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/pages/__tests__/RepoDetailPage.test.tsx
```

Expected: PASS

- [ ] **Step 5: Run all page tests**

```bash
pnpm test:run src/pages/__tests__/
```

Expected: all PASS across all 8 page test files

- [ ] **Step 6: Run full coverage check**

```bash
pnpm test:coverage
```

Expected: ≥80% line coverage overall; check for any gaps

- [ ] **Step 7: Commit**

```bash
git add src/pages/RepoDetailPage.tsx src/pages/__tests__/RepoDetailPage.test.tsx
git commit -m "feat: implement RepoDetailPage with readiness strip and 4 mini-sections"
```

---

## Stage 5 Complete

At this point you have:
- All 8 dashboard pages implemented with real mock data
- Every page has an integration test verifying its primary question is answered
- Loading skeletons for all async fetches
- SpanDrawer accessible from ReliabilityPage
- Full coverage check passing at ≥80%

**Next:** Stage 6 — Storybook stories + CI/CD workflows
