# Technical Implementation Specification
## Flightdeck — Org-Level AI Coding Agent Analytics Portal

---

## 1. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React 18 + TypeScript | Type safety, ecosystem, component model |
| Build | Vite | Fast HMR, native ESM, static output for GH Pages |
| Routing | React Router v6 | Nested routes, layout routes, `basename` for GH Pages |
| Styling | Tailwind CSS v3 | Utility-first, dark mode via `class` strategy |
| Components | shadcn/ui | Accessible, headless, Tailwind-compatible |
| Charts | Recharts | React-native, composable, responsive containers |
| State | React Context + useReducer | No external dep needed for mock-data app |
| Data | Custom mock service | Deterministic mulberry32 seeded generation |
| Testing | Vitest + React Testing Library | Fast, Jest-compatible, Vite-integrated |
| Component docs | Storybook 10.4.6 (`@storybook/react-vite`) | Shares Vite config, deploys alongside dashboard |
| A11y | `@storybook/addon-a11y` (axe-core) | WCAG AA enforcement in CI |
| Linting | ESLint + Prettier | Consistent code style |
| Package manager | pnpm | Lockfile committed, cache key = `pnpm-lock.yaml` hash |

---

## 2. Project Structure

```
flightdeck/
├── .github/
│   └── workflows/
│       ├── ci.yml              # type check + tests + storybook a11y
│       └── deploy.yml          # build + deploy to GH Pages
├── .storybook/
│   ├── main.ts                 # @storybook/react-vite, addons
│   └── preview.ts              # Tailwind import, dark background decorator
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── OverviewPage.tsx
│   │   ├── OutcomesPage.tsx
│   │   ├── CostPage.tsx
│   │   ├── ReliabilityPage.tsx
│   │   ├── GovernancePage.tsx
│   │   ├── TeamDetailPage.tsx
│   │   └── RepoDetailPage.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── AreaChart.tsx
│   │   │   ├── StackedAreaChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── ScatterChart.tsx
│   │   │   ├── ChartTooltip.tsx      # shared legend-style tooltip (colour swatch + series label + value)
│   │   │   ├── SparklineChart.tsx
│   │   │   ├── AutonomyBar.tsx
│   │   │   └── BudgetGauge.tsx
│   │   ├── cards/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── AlertBadge.tsx
│   │   │   └── AlertsPanel.tsx     # Overview "Active alerts" list (dot + type + detail, deep-links)
│   │   ├── tables/
│   │   │   ├── TeamTable.tsx
│   │   │   ├── OutcomeTable.tsx
│   │   │   ├── ToolTable.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── EventLog.tsx
│   │   └── overlays/
│   │       └── SpanDrawer.tsx
│   ├── mock/
│   │   ├── seed.ts             # mulberry32 seeded PRNG, seed=42
│   │   ├── scenario.ts         # ScenarioProfile knobs + COMPANIES (healthy/problematic)
│   │   ├── generators/
│   │   │   ├── generateTeams.ts
│   │   │   ├── generateRepos.ts
│   │   │   ├── generateUsers.ts
│   │   │   ├── generateTasks.ts     # AgentTask corpus, 90 days
│   │   │   ├── generateSpans.ts     # TraceSpan per task (status-coherent, see note below)
│   │   │   ├── generatePROutcomes.ts
│   │   │   └── generateSecurityEvents.ts
│   │   └── api.ts              # mock API functions with simulated delay
│   │
│   │   # Data coherence: a task's trace and counters must match its status —
│   │   #   • completed task → NO failing spans (env/agent all `ok`) and `failedToolCallCount === 0`
│   │   #   • failed task    → ≥ 1 failing span (env error, or a forced final agent span) and `failedToolCallCount ≥ 1`
│   │   # Enforced in generateSpans/generateTasks and guarded by their unit tests.
│   ├── hooks/
│   │   ├── useFilters.ts
│   │   └── useMockData.ts      # generic loading-state wrapper
│   ├── context/
│   │   └── FilterContext.tsx
│   ├── auth/
│   │   ├── RequireAuth.tsx     # sessionStorage guard, redirects to /login
│   │   └── session.ts          # mock session: CURRENT_USER + login/logout/isAuthenticated
│   ├── types/
│   │   └── index.ts
│   ├── lib/
│   │   └── utils.ts            # formatCurrency, formatDuration, formatNumber,
│   │                           # formatPercent, computeTrend, classifyAutonomy
│   └── test/
│       └── setup.ts            # jest-dom + Recharts ResponsiveContainer mock
├── public/
│   └── 404.html                # SPA deep-link fallback for GH Pages (re-serves index.html)
├── vite.config.ts              # base: '/flightdeck/'
├── tailwind.config.ts
├── vitest.config.ts
└── package.json
```

---

## 3. Routing Architecture

```
/login                    → LoginPage (public)
/                         → redirect → /overview (RequireAuth)
/overview                 → OverviewPage
/outcomes                 → OutcomesPage
/cost                     → CostPage
/reliability              → ReliabilityPage
/governance               → GovernancePage
/teams/:teamId            → TeamDetailPage
/repos/:repoId            → RepoDetailPage
```

All dashboard routes are wrapped by `<RequireAuth>` and share `<AppShell>` as the layout via React Router nested routing. `<BrowserRouter basename="/flightdeck">` is used for GitHub Pages compatibility.

**Deep-link refresh (GitHub Pages + BrowserRouter).** GitHub Pages has no server-side rewrites, so deep-link refresh uses the two-part SPA redirect dance: `public/404.html` (served for any unknown path) redirects to the app root with the requested path/query encoded into `?p=<path>&q=<query>` (literal `&` escaped as `~and~`), and `restoreDeepLink()` (called from `main.tsx` **before** `createRoot().render`, so the router never sees the encoded URL) rewrites the URL back via `history.replaceState`. Without the restore step the app boots at the root, matches `path="/"`, and bounces every refresh to `/overview`. Refreshing or directly opening any deep route (e.g. `/cost`) then boots the SPA at the correct location instead of 404ing. Mocked auth survives the refresh because `<RequireAuth>` reads `sessionStorage`, which persists across reloads within the same tab (FR-01). BrowserRouter is a hard requirement — HashRouter is not used.

---

## 4. Data Model

```typescript
// src/types/index.ts

type Period = '7d' | '30d' | '90d'

type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked'
type TaskType = 'bug_fix' | 'feature' | 'tests' | 'docs' | 'refactor' | 'dependency_update'
type PRStatus = 'open' | 'merged' | 'closed_unmerged' | 'reverted'
type SpanType = 'model_call' | 'shell_command' | 'git_operation' | 'test_run' | 'policy_check' | 'env_setup'
type SpanStatus = 'ok' | 'error' | 'blocked' | 'timeout'
type ErrorCategory = 'tool_error' | 'timeout' | 'env_setup' | 'policy_block' | 'model_error' | 'test_failure'
type SecurityEventType = 'policy_block' | 'secret_detected' | 'human_approval_required'
type Severity = 'critical' | 'warning' | 'info'

// Bands are assigned per TERMINAL task (status: completed | failed | cancelled) via
// classifyAutonomy(task, prOutcome?). Non-terminal tasks (queued/running) are excluded from
// autonomy breakdowns; the Overview hero denominator is all terminal tasks in the period.
// autonomous:     PR merged + edit distance < 20%, not reverted
// human_assisted: PR merged + edit distance 20–70%, not reverted
// human_rescued:  PR merged + edit distance > 70%, OR required a rerun / human intervention, not reverted
// failed:         task failed or cancelled, produced no PR, PR closed unmerged, or PR reverted
type AutonomyBand = 'autonomous' | 'human_assisted' | 'human_rescued' | 'failed'

interface Team {
  id: string
  name: string
  memberCount: number
}

interface Repo {
  id: string
  name: string
  teamId: string
  testCommandDetected: boolean
  ciConfigured: boolean
  agentInstructionsPresent: boolean
  protected: boolean          // production-tier; governance events here escalate in severity
}

interface User {
  id: string
  teamId: string
  name: string
  email: string
  firstActive: string
  lastActive: string
}

interface AgentTask {
  id: string
  orgId: string
  teamId: string
  repoId: string
  userId: string
  taskType: TaskType
  status: TaskStatus
  startedAt: string
  completedAt: string | null
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  toolCallCount: number
  failedToolCallCount: number
  policyBlockCount: number
  humanInterventionRequired: boolean
  prId: string | null
  autonomyBand: AutonomyBand | null   // null while non-terminal; derived via classifyAutonomy
}

interface TraceSpan {
  id: string
  taskId: string
  type: SpanType
  name: string
  startedAt: string
  durationMs: number
  status: SpanStatus
  errorCategory?: ErrorCategory   // set when status is 'error' or 'timeout'
  source: 'agent' | 'operator'    // 'operator' = Agent Operator provisioning layer (env_setup spans)
  costUsd?: number
  inputTokens?: number
  outputTokens?: number
}

interface PullRequestOutcome {
  id: string
  taskId: string
  repoId: string
  openedAt: string
  mergedAt: string | null
  status: PRStatus
  ciStatus: 'passed' | 'failed' | 'not_run'   // final CI status after any reruns
  ciFirstAttemptPassed: boolean               // basis for "CI Pass Rate (first attempt)"
  ciAttempts: number
  reviewComments: number
  changeRequests: number
  agentCommits: number
  humanCommitsAfterAgent: number   // basis for edit distance
  humanEditDistancePct: number     // 0–100
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  autonomyBand: AutonomyBand
}

interface SecurityEvent {
  id: string
  taskId: string
  repoId: string
  teamId: string
  severity: Severity   // DERIVED (see below), not random
  type: SecurityEventType
  createdAt: string
}

// Severity is derived from category + repo tier via a per-category rule table in
// generateSecurityEvents (`SEVERITY_RULES`). The 3 severities are fixed; new
// categories slot into the table (unmapped → `info`):
//   secret_detected         → critical on a protected repo, else warning
//   policy_block            → warning on a protected repo, else info
//   human_approval_required → warning on a protected repo, else info (never critical)
// ⇒ critical = a secret exposed on a protected (production) repo. That set is exactly
//   what `buildOrgAlerts` surfaces as Overview alerts / the sidebar badge.

// ============================================================
// Aggregate / response types — returned by the mock API (§5).
// Derived from the entities above; computed per request, not stored.
// ============================================================

interface TrendPoint { date: string; value: number }

// KPI-card payload: current value, % change vs the prior period, sparkline series.
interface Kpi { value: number; trendPct: number; sparkline: TrendPoint[] }

// Overview "Alerts strip". Alerts are DERIVED, not stored: high-severity
// SecurityEvents plus the injected cost-spike anomaly. Returned inline on getOrgOverview.
// The strip is client-side dismissible and links through to /governance (FR-02).
interface Alert {
  id: string
  severity: Severity
  source: 'security_event' | 'cost_anomaly'
  type: SecurityEventType | 'cost_spike'
  message: string
  refId: string            // SecurityEvent.id, or the synthesized cost-anomaly id
  createdAt: string
}

interface TeamMetrics {
  teamId: string
  teamName: string
  taskCount: number
  autonomyRate: number
  spendUsd: number
  costPerTask: number
  costPerMergedPr: number
  tokenWastePct: number
}

interface OrgOverview {
  autonomyBreakdown: Record<AutonomyBand, number>   // share of terminal tasks, sums to 1
  kpis: Record<'tasksStarted' | 'autonomyRate' | 'costPerMergedPr' | 'medianTimeToPr' | 'activeUsers', Kpi>
  tasksOverTime: Array<{ date: string } & Record<AutonomyBand, number>>
  teamScatter: TeamMetrics[]
  alerts: Alert[]
}

interface OutcomesMetrics {
  kpis: Record<'mergeRate' | 'humanEditDistancePct' | 'ciFirstAttemptPassRate' | 'revertRate', Kpi>
  editDistanceTrend: TrendPoint[]
  outcomeByTaskType: Array<{ taskType: TaskType } & Record<AutonomyBand, number>>
  reviewCommentsTrend: TrendPoint[]
  prOutcomes: Array<{
    repoId: string
    taskType: TaskType
    mergeRate: number
    avgEditDistancePct: number
    ciFirstAttemptPassRate: number
  }>
}

interface CostMetrics {
  kpis: Record<'totalSpend' | 'costPerTask' | 'costPerMergedPr' | 'tokenWastePct', Kpi>
  spendTrend: TrendPoint[]
  spentUsd: number                       // 30-day-projected spend; drives the radial gauge (red > 90%)
  budgetUsd: number                      // monthly budget (single source of truth)
  costPerMergedPrByTaskType: Array<{ taskType: TaskType; costUsd: number }>
  teamBreakdown: TeamMetrics[]
}

// Tool identity = span type; aggregated from TraceSpan. Drives both the
// tool performance table and the tool reliability leaderboard (§7).
interface ToolStat {
  tool: SpanType
  callCount: number
  errorRate: number
  p50LatencyMs: number
  p95LatencyMs: number
}

interface ReliabilityMetrics {
  kpis: Record<'p95TaskDurationMs' | 'toolFailureRate' | 'timeoutRate' | 'envSetupP95Ms', Kpi>
  durationTrend: Array<{ date: string; p50: number; p95: number }>
  errorRateByCategory: Array<{ date: string } & Record<ErrorCategory, number>>   // 6 categories
  toolPerformance: ToolStat[]
}

interface GovernanceMetrics {
  kpis: Record<'policyBlocks' | 'secretsDetected' | 'humanApprovalsRequired', Kpi>
  eventsOverTime: Array<{ date: string } & Record<SecurityEventType, number>>
  events: SecurityEvent[]
  criticalAlerts: number   // critical security events in period = the Overview alert count
}

// Extends User with per-member usage stats for the selected period (FR-07).
// Presented under the caption "Self-service stats — not a ranking".
interface MemberWithUsage extends User {
  taskCount: number    // tasks started by this member in the period
  autonomyRate: number // 0–1 ratio of this member's tasks that completed autonomously
  spendUsd: number     // total USD cost of this member's tasks in the period
}

interface TeamDetail {
  team: Team
  autonomyRate: number
  taskCount: number
  spendUsd: number
  // 2 key metrics per mini-section (FR-07):
  //   outcomes:    Merge Rate (percent) + Avg Edit Distance (percent)
  //   cost:        Cost/Merged PR (currency) + Token Waste % (percent)
  //   reliability: P95 Task Duration (duration ms) + Tool Failure Rate (percent)
  //   governance:  Policy Blocks (number) + Secrets Detected (number)
  // Each mini-section's "View full →" link navigates to the matching org page
  // pre-filtered to this team (FR-07), e.g. `/outcomes?team=<teamId>`.
  sections: { outcomes: Kpi[]; cost: Kpi[]; reliability: Kpi[]; governance: Kpi[] }
  members: MemberWithUsage[]  // per-member usage stats (FR-07); not a ranking
}

interface RepoDetail {
  repo: Repo          // includes the readiness booleans (FR-08 strip)
  teamName: string    // human-readable name of the owning team (e.g. "Product")
  autonomyRate: number
  taskCount: number
  spendUsd: number
  // Same 2-metric mini-sections as TeamDetail (no member list on repo drill-down)
  sections: { outcomes: Kpi[]; cost: Kpi[]; reliability: Kpi[]; governance: Kpi[] }
}

interface TaskFilters {
  period: Period
  teamId?: string
  model?: string
  status?: TaskStatus
}
```

---

## 5. Mock Data Strategy

### Seeded RNG
`mulberry32` PRNG, seed `42`. Same seed = same data across all renders, tests, and CI runs.

### Demo scenarios
`scenario.ts` defines a `ScenarioProfile` (status weights, PR-merge thresholds, edit-distance
ranges, CI/failure/alert probabilities, token scale) and two profiles — **healthy** and
**problematic** — plus the `COMPANIES` shown on the login screen. The generators take a profile,
so the same seed produces an optimistic or a struggling fleet; only probabilities/ranges vary,
never the draw count, so each scenario stays deterministic. `api.ts` builds one dataset per
scenario (cached) and `setScenario()` swaps the active one via mutable bindings the helpers close
over. The login workspace choice persists in `sessionStorage`; `main.tsx` calls `setScenario` at
boot so a refresh re-loads the right dataset before the app renders. Scenario is fixed per
session (no live toggle), so pages don't need it in their fetch deps.

### Data Volume
- 90 days of history
- 4 teams: Platform, Product, Data Science, Mobile
- 5 repos: one per team + one cross-team repo
- 12 users distributed across teams
- 6 task types: bug_fix, feature, tests, docs, refactor, dependency_update
- 3 models: claude-opus-4, claude-sonnet-4-6, claude-haiku-4-5
- ~800–1500 `AgentTask` records with realistic weekday/weekend volume distribution

### Distribution Patterns
- Task volume: higher Mon–Fri, ~30% lower Sat–Sun, slight upward growth trend over 90 days
- Cost: correlated with token usage; opus-4 ~5× haiku-4-5
- Task duration: log-normal (realistic long tail); P95 ≈ 4–8× median
- Error rate: 3–8% base, one injected spike at ~day 60 for alert demo
- Edit distance: varies by task type (docs: low, feature: high)
- Autonomy band distribution: ~40% autonomous, 30% human-assisted, 18% human-rescued, 12% failed
- One injected cost spike at ~day 60 (2.4× daily average) to demonstrate governance alert

### Mock API Shape
```typescript
// src/mock/api.ts — all return Promise<T> with 100–200ms simulated delay

// Org-level metrics accept optional global filters. teamId/model default to
// undefined/null = "all"; both are threaded through tasksFor()/priorTasksFor()
// so KPIs, charts, tables, and derived alerts reflect the active filter set.
getOrgOverview(period: Period, teamId?: string | null, model?: string | null): Promise<OrgOverview>
// Live count for the sidebar Governance badge = buildOrgAlerts(...).length (same source as the Overview strip).
getActiveAlertCount(period: Period, teamId?: string | null, model?: string | null): Promise<number>
getTeamMetrics(period: Period): Promise<TeamMetrics[]>
getOutcomesMetrics(period: Period, teamId?: string | null, model?: string | null): Promise<OutcomesMetrics>
getCostMetrics(period: Period, teamId?: string | null, model?: string | null): Promise<CostMetrics>
getReliabilityMetrics(period: Period, teamId?: string | null, model?: string | null): Promise<ReliabilityMetrics>
getGovernanceMetrics(period: Period, teamId?: string | null, model?: string | null): Promise<GovernanceMetrics>
getTeamDetail(teamId: string, period: Period): Promise<TeamDetail>
getRepoDetail(repoId: string, period: Period): Promise<RepoDetail>
getTaskList(filters: TaskFilters): Promise<AgentTask[]>
getTaskSpans(taskId: string): Promise<TraceSpan[]>
getSecurityEvents(period: Period): Promise<SecurityEvent[]>
```

---

## 6. Component Architecture

### KpiCard
```tsx
<KpiCard
  title="Autonomy Rate"
  value={0.421}
  format="percent"
  trend={+3.2}              // % change vs prior period
  higherIsBetter={true}     // direction-aware trend color (default true);
                            // when false a rising value is bad → rose, falling → emerald.
                            // Used for lower-is-better KPIs: cost/duration/error/waste/revert metrics.
  sparkline={timeSeriesPoints}
  tooltip="% of tasks merged with < 20% human edits"
/>
```

### AlertsPanel
Overview "Active alerts" panel. Renders `Alert[]` as a titled card with one row per alert: a severity-coloured dot, the alert `type` in bold (sentence-cased), and a muted `message` detail (task + repo for security events, or a measurable reason for the cost spike — the type is deliberately not repeated in the message). Each row is a `<Link>` to the alert's source (`/governance?event=<refId>` for security events, `/cost` for the cost spike); the dismiss button sits outside the link so dismissing never navigates. Renders nothing when the list is empty.

### SpanDrawer
Slide-over panel. Opens when a task row is clicked in the TaskList. Renders a flat list of `TraceSpan` records sorted by `startedAt`. Each span row shows: type icon, name, duration badge, status dot. Error spans highlighted in rose. Closes on Escape or backdrop click. The fixed backdrop + panel are **portaled to `document.body`** (via `createPortal`) so they span the full viewport (`top:0`) regardless of where the drawer is rendered — rendered in-place inside a page's `space-y-*` wrapper, the `> * + *` margin would otherwise shift the fixed overlay down ~2rem.

### AutonomyBar
Full-width segmented bar. Four segments with labels and percentages. Clicking a segment filters the tasks-over-time chart below to that band only.

### ScatterChart
Generic Recharts scatter component (kept generic for reuse beyond teams). On the Overview it renders the team scatter: each dot is a team. No axis labels implying rank — axis titles are "Task Volume" and "Autonomy Rate". A **median cross** (two labelled `ReferenceLine`s at the org median of each axis, "Median volume" / "Median autonomy") splits the teams into four quadrants for pattern reading. A custom hover tooltip shows team name, task volume, autonomy %, and which quadrant the team falls in (e.g. "High volume · low autonomy") — quadrant wording is descriptive, never a ranking.

### AppShell Layout
- Sidebar: 240px fixed, icon-only collapse < 1280px, active nav item highlighted.
  Two nav groups: the primary dashboard links (Overview, Outcomes, Cost,
  Reliability, Governance — the Governance item carries a **live** count badge
  (`getActiveAlertCount`, filter-aware, hidden at 0) that equals the Overview's
  active-alert count, not a hardcoded number), and a **Teams** group whose links open `/teams/:teamId`.
  The Teams group is the primary in-app entry point to the FR-07/FR-08 drill-downs
  (the org-level routes alone are otherwise unreachable from the chrome).
  The footer shows the signed-in mock user (initials avatar + name/role/email from
  `auth/session.ts`) and a **Log out** button that calls `logout()` and routes to
  `/login`; the avatar + logout icon stay reachable in the collapsed (icon-only) state.
- TopBar: 64px. Current page title on the left, org name shown as a secondary
  label; global filter pickers on the right. The **Period** filter is a segmented
  button group (`role="group"` labelled "Time range", one `aria-pressed` button per
  range), not a dropdown; Team and Model remain `<select>` dropdowns. Per **FR-09**
  the global Team and Model filters apply only to org-level pages — on drill-down
  routes (`/teams/:teamId`, `/repos/:repoId`) the TopBar shows the **period button
  group only**, because drill-downs scope locally and never write back to the global
  filters. Org pages read `teamId`/`model` from `FilterContext` and pass them into
  the corresponding `get*Metrics(period, teamId, model)` call so charts re-query when
  any filter changes. The Period group and the Team/Model `FilterPill`s all carry a
  shared `h-9` height (with `items-center`) so the three controls align on one row —
  without it each height is intrinsic (the Period group's stacked `p-1` + button
  `py-1` made it taller than the single-`py-1` pills around shorter `<select>`s).
  **Note on page headings:** org pages render their page title as an `sr-only` `<h1>`
  because the TopBar shows it visibly, avoiding a duplicate while preserving heading
  structure for screen readers and accessibility compliance.
- Main: `max-w-7xl mx-auto px-6 py-8`, scrollable

---

## 7. Chart Specifications

| Chart | Page | Recharts type | Notes |
|-------|------|---------------|-------|
| Tasks over time | Overview | AreaChart (stacked) | 4 series by autonomy band; **absolute task counts** on Y (`valueFormat="number"`, the default) |
| Team scatter | Overview | ScatterChart | Dot per team, no ranking; ignores the team filter (always cross-team), selected team highlighted via `highlightTeamId` |
| Edit distance trend | Outcomes | LineChart | Single line + dashed trend overlay (`trend` prop) |
| Outcome by task type | Outcomes | BarChart (stacked) | 6 task types on x-axis; **absolute task counts** (`allowDecimals={false}`), not percentages |
| Review comments trend | Outcomes | LineChart | Single line + dashed trend overlay (`trend` prop) |
| Spend over time | Cost | AreaChart | Single series, Y-axis formatted as currency; tooltip reuses formatter |
| Budget gauge | Cost | Custom SVG arc | Radial, red > 90%; arc sized so the percentage sits centered inside the bowl, with the state label (e.g. "Over budget") tucked above the number rather than below it |
| Cost/PR by task type | Cost | BarChart (horizontal) | Signature visual |
| Task duration P50/P95 | Reliability | LineChart (2 lines) | |
| Errors by category | Reliability | LineChart (multi-line) | One line per error category (6); Y-axis shows absolute error counts per day (not a percentage/rate); integer formatter; `toggleable` legend (interactive chips show/hide each series) |
| Tool reliability leaderboard | Reliability | BarChart (horizontal) | Tools ranked by error rate, most-broken first |
| Security events | Governance | AreaChart (stacked) | 3 event types |
| Sparklines | KPI cards | Custom inline SVG | No axes, no tooltip |

All Recharts charts use `<ResponsiveContainer width="100%" height={...}>`, the shared `ChartTooltip` (a dark, legend-style tooltip rendering a colour swatch + series label + formatted value per entry — never a bare number; dashed `__trend_*` overlays are filtered out), consistent 8-color palette from Tailwind config, and an empty state overlay when data is absent.

---

## 8. Storybook Configuration

**`.storybook/main.ts`**
```ts
framework: '@storybook/react-vite'
addons: ['@storybook/addon-essentials', '@storybook/addon-a11y']
stories: ['../src/**/*.stories.tsx']
```

**`.storybook/preview.ts`**
```ts
// Import Tailwind, set dark background, wrap stories in BrowserRouter + FilterContext
```

### Stories Required Per Component

Per **NFR-02**, *every* component in `src/components/` ships at least a Default
story with all meaningful state variants. The generic chart wrappers (LineChart,
AreaChart, StackedAreaChart, BarChart) each ship a populated + empty-state story;
the table below enumerates the additional variants for the stateful components.

| Component | Story variants |
|-----------|---------------|
| KpiCard | Default, positive trend, negative trend, lower-is-better (inverted color), loading, zero value |
| BudgetGauge | Normal (< 75%, emerald fill), warning (75–90%, amber fill, "Approaching budget"), over-budget (> 90%, rose fill, "Over budget") — red > 90% mandated by FR-04 |
| SparklineChart | With data, flat/empty |
| AlertBadge | Critical, warning, info, resolved |
| TeamTable | Populated, empty state, sorted |
| OutcomeTable | Populated, empty state, sorted |
| ToolTable | Populated, all-errors variant |
| TaskList | Mixed statuses, all-failed, empty |
| SpanDrawer | Open with spans, open with error span, loading |
| EventLog | Populated, filtered, empty |
| AutonomyBar | All four bands, single band edge case |
| ScatterChart | Multiple points, single point, empty |
| LoginPage | Default |

---

## 9. CI/CD Pipeline

### `ci.yml` (push + PR to `main`)
```yaml
jobs:
  test:
    steps:
      - pnpm install --frozen-lockfile
      - tsc --noEmit
      - vitest run --coverage          # fails if lines < 80%

  storybook-test:
    steps:
      - pnpm install --frozen-lockfile
      - storybook build -o storybook-static
      - storybook test                 # runs a11y + interaction tests
                                       # fails on critical/serious violations

  build:
    needs: [test, storybook-test]
    steps:
      - vite build --base=/flightdeck/
      - storybook build -o dist/storybook
      - upload dist/ as artifact
```

### `deploy.yml` (push to `main` only)
```yaml
needs: ci
permissions:
  pages: write
  id-token: write
steps:
  - actions/download-artifact          # the dist/ bundle from the build job
  - actions/upload-pages-artifact       # path: dist/
  - actions/deploy-pages                # GitHub Actions artifact-based Pages deploy
```

GitHub Pages is served from the **GitHub Actions artifact** (Pages source = "GitHub Actions"), not a `gh-pages` branch. The uploaded `dist/` artifact contains both the dashboard and `dist/storybook/`, plus `404.html` for SPA deep-link fallback (see §3).

---

## 10. Design System

> **Source of truth for palette roles and hexes: Requirements Spec §5.** This section documents the concrete Tailwind token mapping so the implementer's job is mechanical.

### Color Palette — Warm Dark Theme

The previous cool-slate / indigo palette has been replaced with a warm near-black neutral scale and an orange brand accent, matching the reference design. The implementation strategy is:

1. **Override the `slate` color scale** in `tailwind.config.ts` → `theme.extend.colors.slate` with warm-neutral hexes. This lets all existing `text-slate-*`, `bg-slate-*`, and `border-slate-*` utility classes in the codebase adopt the warm palette automatically, with zero component edits.
2. **Remap custom surface/border tokens** to their warm equivalents.
3. **Shift the brand from `indigo-*` to `orange-*`** by overriding `theme.extend.colors` for the brand token (or extending the orange scale where indigo steps were previously used).

#### Warm-Neutral `slate` Override (slate-50 → slate-950)

Each step replaces its cool-gray Tailwind default with a warm brownish-neutral. Steps follow the same perceptual lightness ladder as the Tailwind slate scale:

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#faf6f2` | Highest-contrast text on dark surfaces |
| `slate-100` | `#f0ece6` | `text-primary` — headlines, KPI values |
| `slate-200` | `#e2dbd3` | Emphasized secondary text |
| `slate-300` | `#c8bfb5` | Body copy (`text-sm text-slate-300`) |
| `slate-400` | `#a89f96` | `text-secondary` / section labels |
| `slate-500` | `#8a8078` | Mid-tone muted text |
| `slate-600` | `#6b6460` | `text-muted` — placeholders, captions |
| `slate-700` | `#504a45` | Subtle borders, dividers |
| `slate-800` | `#3a3530` | `border` token — card outlines, input strokes |
| `slate-850` | `#2e2a26` | (non-standard step; use explicitly if needed) |
| `slate-900` | `#252220` | `surface-elevated` — cards, dropdowns |
| `slate-925` | `#201e1b` | `surface` — primary panels, sidebar |
| `slate-950` | `#1a1714` | `background` — deepest app bg, window chrome |

> Note: Tailwind's default scale has no `slate-850` or `slate-925` steps. These can be added as additional named tokens in `theme.extend.colors` if needed, or the nearest standard step can be used.

#### Custom Token Mapping (`tailwind.config.ts` → `theme.extend.colors`)

| Token key | Hex | Replaces |
|-----------|-----|---------|
| `surface` | `#201e1b` | was `#0f172a` (slate-900 cool) |
| `surface-elevated` | `#252220` | was `#1e293b` (slate-800 cool) |
| `border` | `#3a3530` | was `#334155` (slate-700 cool) |

#### Brand: Orange replaces Indigo

All `indigo-*` brand uses (primary CTA, active nav highlight, chart-1, `primary` color) shift to the orange scale. Map indigo steps to orange equivalents:

| Previous (indigo) | New (orange) | Hex | Role |
|-------------------|-------------|-----|------|
| `indigo-400` | `brand-light` | `#fb923c` | Hover, soft brand tint |
| `indigo-500` | `brand` / `orange-500` | `#f97316` | Primary brand, active states, chart-1 |
| `indigo-600` | `brand-dark` | `#ea6c00` | Pressed, darker emphasis |

Add to `theme.extend.colors`:
```
brand:       '#f97316'
brand-light: '#fb923c'
brand-dark:  '#ea6c00'
```

#### Autonomy Band Colors (unchanged)

| Token | Hex |
|-------|-----|
| `autonomy-autonomous` | `#10b981` (emerald-500) |
| `autonomy-assisted` | `#0ea5e9` (sky-500) |
| `autonomy-rescued` | `#f59e0b` (amber-500) |
| `autonomy-failed` | `#f43f5e` (rose-500) |

#### Chart Series Palette (8 tokens)

Replace the previous indigo-led series with the warm-harmonised palette from Requirements Spec §5.3:

| Token | Hex | Replaces |
|-------|-----|---------|
| `chart-1` | `#f97316` | was `#6366f1` (indigo-500) |
| `chart-2` | `#22c55e` | was `#10b981` (emerald-500) — unchanged value |
| `chart-3` | `#6366f1` | was `#0ea5e9` (sky-500) |
| `chart-4` | `#f59e0b` | was `#f59e0b` (amber-500) — unchanged |
| `chart-5` | `#ef4444` | was `#f43f5e` (rose-500) |
| `chart-6` | `#a78bfa` | was `#8b5cf6` (violet-500) |
| `chart-7` | `#14b8a6` | was `#14b8a6` (teal-500) — unchanged |
| `chart-8` | `#fb7185` | was `#e879f9` (fuchsia-500) |

#### Semantic State Colors

| Role | Hex | Tailwind equivalent |
|------|-----|-------------------|
| `success` | `#22c55e` | green-500 |
| `warning` | `#f59e0b` | amber-500 |
| `error` | `#ef4444` | red-500 |
| `info` | `#6366f1` | indigo-500 |

### Typography
- Font: Inter (bundled via `@fontsource/inter`)
- KPI values: `text-3xl font-bold tabular-nums`
- Section labels: `text-xs font-medium uppercase tracking-wider text-slate-400` (renders as warm muted gray `#a89f96` after override)
- Body: `text-sm text-slate-300` (renders as warm `#c8bfb5` after override)
- i18n/l10n: out of scope — English only, no translation layer, no locale switching

### Layout Grid
- KPI row: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`
- Chart grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Full-width: `col-span-full`

### Responsive Behavior (minimum supported width 768px — NFR-05)
- **≥1280px:** full 240px sidebar; KPI grid up to 5 cols; chart grid 2 cols
- **1024–1279px:** sidebar collapses to icon-only rail (per AppShell `< 1280px`); KPI grid 3 cols; chart grid 2 cols
- **768–1023px (minimum supported):** icon-only sidebar; KPI grid 2 cols; charts and the autonomy hero stack full-width single column; wide tables (Outcome / Team cost / Tool) scroll horizontally inside an overflow container; SpanDrawer expands to full-width
- **Below 768px:** out of scope — no mobile-native target (requirements §5)

---

## 11. Accessibility

- All interactive elements keyboard-navigable, visible focus ring
- Icon-only buttons have `aria-label`
- Charts have `role="img"` and `aria-label` describing the data shown
- Color is never the sole means of conveying information (badges also have text/icon)
- WCAG AA contrast enforced via axe-core in Storybook a11y addon
- Focus order: sidebar → top bar → main content (logical document order)
