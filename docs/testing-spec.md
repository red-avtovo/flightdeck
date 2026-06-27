# Testing Specification
## Flightdeck — Org-Level AI Coding Agent Analytics Portal

---

## 1. Testing Philosophy

- **Unit tests**: pure functions (generators, formatters, aggregators) — no DOM, fast
- **Component tests**: rendering, interactions, edge cases — React Testing Library + jsdom
- **Integration tests**: full page renders with mock data — verify the page answers its primary question
- **Storybook a11y tests**: every component story passes axe-core at WCAG AA
- **No snapshot tests**: brittle, low signal-to-noise for UI components

All tests run via `vitest`. Coverage target: **≥ 80% lines across `src/`**, with 100% on `src/mock/` and `src/lib/`.

---

## 2. Test File Conventions

```
src/
├── mock/
│   ├── generators/__tests__/
│   │   ├── generateTeams.test.ts
│   │   ├── generateRepos.test.ts
│   │   ├── generateTasks.test.ts
│   │   ├── generateSpans.test.ts
│   │   ├── generatePROutcomes.test.ts
│   │   └── generateSecurityEvents.test.ts
│   └── __tests__/
│       └── api.test.ts
├── lib/
│   └── __tests__/
│       └── utils.test.ts
├── components/
│   ├── cards/__tests__/
│   │   ├── KpiCard.test.tsx
│   │   └── BudgetGauge.test.tsx (via stories + RTL)
│   ├── tables/__tests__/
│   │   ├── TeamTable.test.tsx
│   │   ├── TaskList.test.tsx
│   │   └── EventLog.test.tsx
│   └── overlays/__tests__/
│       └── SpanDrawer.test.tsx
└── pages/__tests__/
    ├── LoginPage.test.tsx
    ├── OverviewPage.test.tsx
    ├── OutcomesPage.test.tsx
    ├── CostPage.test.tsx
    ├── ReliabilityPage.test.tsx
    ├── GovernancePage.test.tsx
    ├── TeamDetailPage.test.tsx
    └── RepoDetailPage.test.tsx
```

---

## 3. Unit Tests: Utility Functions (`lib/utils.ts`)

### formatCurrency
```
formatCurrency(0)           → "$0.00"
formatCurrency(1234.5)      → "$1,234.50"
formatCurrency(0.001)       → "$0.001"    // sub-cent for cost/task
formatCurrency(-50)         → "-$50.00"
```

### formatDuration
```
formatDuration(500)         → "500ms"
formatDuration(1500)        → "1.5s"
formatDuration(90000)       → "1m 30s"
```

### formatNumber
```
formatNumber(999)           → "999"
formatNumber(1000)          → "1K"
formatNumber(1_500_000)     → "1.5M"
```

### formatPercent
```
formatPercent(0.9532)       → "95.3%"
formatPercent(1.0)          → "100%"
formatPercent(0)            → "0%"
```

### computeTrend
```
computeTrend(100, 80)       → +25.0    // % increase from 80→100
computeTrend(80, 100)       → -20.0    // % decrease from 100→80
computeTrend(100, 0)        → null     // no prior data
```

### classifyAutonomy
```
classifyAutonomy({ status: 'completed', prMerged: true,  editDistancePct: 10 }) → 'autonomous'
classifyAutonomy({ status: 'completed', prMerged: true,  editDistancePct: 45 }) → 'human_assisted'
classifyAutonomy({ status: 'completed', prMerged: true,  editDistancePct: 80 }) → 'human_rescued'
classifyAutonomy({ status: 'failed',    prMerged: false, editDistancePct: 0  }) → 'failed'
classifyAutonomy({ status: 'cancelled', prMerged: false, editDistancePct: 0  }) → 'failed'
```

---

## 4. Unit Tests: Mock Data Generators

### generateTasks
- Returns array of `AgentTask` records
- All records have non-null `id`, `teamId`, `repoId`, `userId`
- `startedAt` dates span the requested 90-day window
- Volume is higher on weekdays than weekends (ratio ≥ 1.2×)
- **Determinism**: same seed → identical output on repeated calls

### generateSpans
- Each span has a valid `taskId` matching a task in the corpus
- `durationMs > 0` for all spans
- Error spans (`status: 'error'`) are present for tasks with `status: 'failed'`

### generatePROutcomes
- `humanEditDistancePct` is between 0–100
- `autonomyBand` matches `classifyAutonomy` output for the given record
- Merged PRs have non-null `mergedAt`

### generateSecurityEvents
- At least one event of each type: `policy_block`, `secret_detected`, `human_approval_required`
- One injected cost-spike day visible in events (severity `critical`)

### Mock API (`api.ts`)
- `getOrgOverview('7d')` returns shorter time series than `getOrgOverview('90d')`
- `getTaskList({ status: 'failed' })` returns only failed tasks
- `getTaskSpans(taskId)` returns spans only for the given task
- All functions return Promises that resolve (never reject on valid input)
- Simulated delay is between 100–200ms

---

## 5. Component Tests

### KpiCard
```
GIVEN value=0.421, format="percent", trend=+3.2
THEN renders "42.1%"
AND renders "+3.2%" with green/emerald class
AND sparkline SVG element is present

GIVEN trend=-5.2
THEN renders "-5.2%" with red/rose class

GIVEN no sparkline data
THEN renders without error
```

### BudgetGauge
```
GIVEN spent=7500, budget=10000
THEN renders "75%" in center text
AND arc does not have danger color class

GIVEN spent=11000, budget=10000
THEN renders "110%" in center text
AND arc has danger color class
AND text "Over budget" is visible
```

### TeamTable
```
GIVEN 4 team rows
THEN renders 4 data rows + header row
AND clicking "Spend" column header sorts ascending
AND clicking again sorts descending
AND each team name is a link with href containing teamId

GIVEN empty array
THEN renders "No teams found" empty state
```

### SpanDrawer
```
GIVEN open=true, spans=[...5 spans including 1 error]
THEN drawer is visible
AND 5 span rows rendered
AND error span row has rose/red highlight class
AND pressing Escape closes the drawer

GIVEN open=false
THEN drawer is not in the document
```

### EventLog
```
GIVEN 6 events, filter="policy_block"
THEN renders only events of type policy_block
AND severity badge is present on each row

GIVEN empty events after filter
THEN renders "No events found" empty state
```

---

## 6. Page Integration Tests

### LoginPage
```
GIVEN unauthenticated user at /login
THEN renders Okta-branded login form
AND "Continue with Okta" button is present
AND clicking the button sets sessionStorage["authenticated"]
AND user is redirected to /overview
```

### RequireAuth guard
```
GIVEN no sessionStorage["authenticated"]
WHEN user navigates to /overview
THEN user is redirected to /login

GIVEN sessionStorage["authenticated"] = "true"
WHEN user navigates to /overview
THEN /overview renders normally
```

### OverviewPage
```
GIVEN mock data loaded
THEN AutonomyBar renders with 4 labelled segments
AND 5 KPI cards are present (Tasks Started, Autonomy Rate, Cost/Merged PR, Median Time to PR, Active Users)
AND each KPI card shows a non-zero value
AND team scatter chart renders with at least 4 dots
AND alerts strip is visible

GIVEN loading state
THEN skeleton placeholders are visible, no error state
```

### OutcomesPage
```
GIVEN mock data loaded
THEN 4 KPI cards present (Merge Rate, Human Edit Distance, CI Pass Rate, Revert Rate)
AND edit distance trend chart renders
AND outcome-by-task-type stacked bar renders ≥ 4 bars
AND PR outcomes table has at least 3 rows

GIVEN Human Edit Distance card
THEN value is formatted as percentage
AND tooltip describing attribution method is accessible
```

### CostPage
```
GIVEN period=30d
THEN spend over time chart renders
AND cost/PR by task type horizontal bar chart renders ≥ 3 bars
AND team cost table is present with "Platform" team row

GIVEN switching period to 7d
THEN chart data updates (fewer data points visible)
AND cost/PR values are formatted as currency with sub-cent precision
```

### ReliabilityPage
```
GIVEN mock data loaded
THEN P95 task duration KPI card is present
AND task duration chart renders 2 distinct lines (P50 and P95)
AND tool performance table shows at least 4 tool types with error rate and P95 columns
AND task list renders at least 5 rows

GIVEN clicking a task row
THEN span drawer opens
AND at least 3 span rows are visible in the drawer
```

### GovernancePage
```
GIVEN mock data loaded
THEN 3 KPI cards present (Policy Blocks, Secrets Detected, Human Approvals)
AND stacked area chart renders with 3 series
AND event log has at least one row of each event type

GIVEN filter set to "secret_detected"
THEN event log shows only secret_detected rows
```

### TeamDetailPage
```
GIVEN teamId="platform"
THEN header shows "Platform" team name
AND 4 mini-sections are present (Outcomes, Cost, Reliability, Governance)
AND each section has a "View full →" link
AND member list renders at least 2 rows
```

### RepoDetailPage
```
GIVEN repoId="repo-1"
THEN Repo Readiness strip is visible
AND 3 boolean badges are present (Test command, CI, Agent instructions)
AND repo-scoped metrics differ from org-wide metrics
```

---

## 7. Storybook Accessibility Tests

Run via `@storybook/addon-a11y` (axe-core) in CI (`storybook test`).

**Pass criteria:** No violations of severity `critical` or `serious`. `moderate` violations are warnings only and do not fail the build.

**Specific checks enforced across all stories:**
| Rule | Applies to |
|------|-----------|
| `button-name` | All icon-only buttons must have `aria-label` |
| `color-contrast` | All text meets WCAG AA (4.5:1 normal, 3:1 large) |
| `image-alt` | Chart containers with `role="img"` must have `aria-label` |
| `link-name` | All `<a>` and `<Link>` elements have accessible text |
| `label` | All form inputs have associated labels |
| `focus-trap` | SpanDrawer focus is trapped when open |

---

## 8. Acceptance Criteria

| ID | Criterion | Test type |
|----|-----------|-----------|
| AC-01 | Unauthenticated user is redirected to /login | Integration |
| AC-02 | Clicking "Continue with Okta" enters the dashboard | Integration |
| AC-03 | /overview renders AutonomyBar with 4 segments | Integration |
| AC-04 | Changing period from 30d to 7d updates all charts | Integration |
| AC-05 | Clicking a team name navigates to /teams/:id | Component |
| AC-06 | Team detail page shows only that team's data | Integration |
| AC-07 | Task row click opens SpanDrawer with span list | Integration |
| AC-08 | Cost/merged PR by task type chart renders with labels | Integration |
| AC-09 | Budget gauge turns red when spend > 90% of budget | Component |
| AC-10 | Governance event log filters by event type | Component |
| AC-11 | All pages render without console errors | Integration |
| AC-12 | Loading skeletons visible before mock API resolves | Component |
| AC-13 | All Storybook stories pass a11y audit (no critical/serious) | Storybook |
| AC-14 | CI pipeline passes on clean main branch | CI |
| AC-15 | Dashboard and Storybook are accessible on GitHub Pages | Manual |

---

## 9. Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80 },
      exclude: ['src/test/**', '**/*.d.ts', 'src/main.tsx', '**/*.stories.tsx']
    }
  }
})
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'

// Recharts ResponsiveContainer requires a real DOM size — mock it in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  }
})
```
