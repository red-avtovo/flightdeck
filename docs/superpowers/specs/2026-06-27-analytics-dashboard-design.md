# Flightdeck — Design Spec
**Product:** Flightdeck — Org-Level AI Coding Agent Analytics Portal
**Repo:** `flightdeck`
**Date:** 2026-06-27

---

## 1. Product Context

Engineering organizations running cloud AI coding agents (e.g., Claude Code on the web) need visibility into whether those agents are delivering real engineering value — not just activity. The primary audience is engineering leadership (VP/CTO), platform leads, and team/repo managers.

The product answers one North Star question:
> **Are our agents producing accepted engineering output autonomously, at a reasonable cost?**

This deliberately separates from generic LLM dashboards. The unit of value is a **merged PR the agent wrote**, not a token or a run.

---

## 2. Data Model

All data is mocked deterministically. The mock maps 1:1 to what a real pipeline would produce:

- **AgentTask** — root span from OpenTelemetry trace (task lifecycle, status, cost, model, token usage)
- **TraceSpan** — child spans per operation (model_call, shell, git, test_runner, policy_check)
- **PullRequestOutcome** — from GitHub webhooks (merge status, CI, review comments, agent vs human commits)
- **SecurityEvent** — from platform policy engine (policy_block, secret_detected, human_approval_required)

### Human edit distance attribution
Requires GitHub App authentication (agent commits as `claude-agent[bot]`). Edit distance = lines changed by non-bot authors between agent's last commit and merge commit ÷ total lines in agent's diff. Surfaced as a percentage in the UI with a tooltip explaining the attribution method.

### Core entities
```typescript
type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked'
type TaskType = 'bug_fix' | 'feature' | 'tests' | 'docs' | 'refactor' | 'dependency_update' | 'investigation'
type PRStatus = 'open' | 'merged' | 'closed_unmerged' | 'reverted'
type SpanType = 'model_call' | 'tool_call' | 'shell_command' | 'git_operation' | 'test_run' | 'policy_check'
type SecurityEventType = 'policy_block' | 'secret_detected' | 'human_approval_required'

// Autonomy classification (derived from edit distance + PR outcome)
type AutonomyBand = 'autonomous' | 'human_assisted' | 'human_rescued' | 'failed'
// autonomous: merged, edit distance < 20%
// human_assisted: merged, edit distance 20–70%
// human_rescued: merged, edit distance > 70%, or rerun required
// failed: not merged, abandoned, or cancelled
```

Mock data volume: 4 teams, 5 repos, 12 users, 6 task types, 3 models, 90 days of history.

---

## 3. Architecture

**Stack:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, React Router v6, Vitest + RTL, Storybook 10.4.6.

**Routing:**
```
/login                → Mock SSO login (Okta-branded)
/                     → redirect /overview (requires session)
/overview             → Overview page
/outcomes             → Outcomes & Quality
/cost                 → Cost & Efficiency
/reliability          → Reliability & Traces
/governance           → Governance & Audit
/teams/:teamId        → Team drill-down
/repos/:repoId        → Repo drill-down
```

**Mock SSO (`/login`):** Okta-branded login page with org logo, email field, and "Continue with Okta" button. On click, writes `authenticated: true` to `sessionStorage` and redirects to `/overview`. A route guard (`<RequireAuth>`) wraps all dashboard routes — unauthenticated users are redirected to `/login`. Refreshing the page within the same tab keeps the session; opening a new tab requires re-login. No real token, no real network call.

**Global FilterContext** holds `period: '7d'|'30d'|'90d'`, `teamId: string|null`, `model: string|null`. All pages subscribe. Drill-down pages scope locally and don't write back to global filters.

**Layout:** Fixed left sidebar 240px (collapses to icon-only < 1280px) + 64px top bar (global filter pickers) + scrollable main. Dark mode first.

---

## 4. Pages

### Page 1: Overview
**Primary question:** Are agents delivering value org-wide right now?

**Hero section:** Agent Autonomy Breakdown — full-width segmented bar showing % of completed tasks in each band: Autonomous / Human-assisted / Human-rescued / Failed. This directly answers "who did the work?" rather than "did the pipeline complete?"

**KPI cards (5):**
- Tasks Started (+ % vs prior period, sparkline)
- Autonomy Rate (% autonomous merges, sparkline)
- Cost / Merged PR (sparkline)
- Median Time to PR (sparkline)
- Active Users (sparkline)

**Charts (2):**
- Tasks over time (area chart, stacked by autonomy band)
- Team scatter: x = task volume, y = autonomy rate. Each dot = one team. No ranking — shows pattern. High-volume + low-autonomy teams are visible as a signal, not a leaderboard.

**Alerts strip:** Dismissible bar at the bottom. Count of active alerts by severity, links to /governance.

---

### Page 2: Outcomes & Quality
**Primary question:** Is the code agents write actually good?

**KPI cards (4):**
- Merge Rate
- Human Edit Distance (% of agent lines human-edited, trend)
- CI Pass Rate (first attempt)
- Revert Rate

**Charts (3):**
- Human edit distance trend over time (line)
- Outcome by task type (stacked bar: autonomous/assisted/rescued/failed per task type)
- Review comments per PR trend (line)

**Table:** PR outcomes — repo / task type / merge rate / avg edit distance / CI pass rate. Sortable.

---

### Page 3: Cost & Efficiency
**Primary question:** Where is money going and what are we getting for it?

**KPI cards (4):**
- Total Spend
- Cost / Task
- Cost / Merged PR
- Token Waste % (tokens on failed/abandoned tasks / total tokens)

**Charts (3):**
- Spend over time (line)
- Budget burn gauge (radial, turns red when > 90%)
- Cost / merged PR by task type (horizontal bar — signature visual: "bug_fix: $18, feature: $74, docs: $12")

**Table:** Team cost breakdown — team / spend / tasks / cost per task / cost per merged PR / waste %. Sortable.

---

### Page 4: Reliability & Traces
**Primary question:** Are agents healthy? Where do they fail?

**KPI cards (4):**
- P95 Task Duration
- Tool Failure Rate
- Timeout Rate
- Env Setup P95

**Charts (2):**
- Task duration P50/P95 trend (multi-line)
- Error rate by category trend (line)

**Tool performance table:** tool type / call count / error rate / P50 latency / P95 latency. Aggregated from TraceSpan data.

**Task list:** Recent tasks, filterable by status (completed / failed / blocked). Clicking a task opens a **slide-over drawer** with a flat span list: each span shows type, name, duration, status. Covers the individual investigation path without a full trace timeline.

---

### Page 5: Governance & Audit
**Primary question:** Are agents operating safely within policy?

**KPI cards (3):**
- Policy Blocks (count + rate)
- Secrets Detected (count)
- Human Approvals Required (count)

**Chart (1):**
- Security events over time — stacked area by event type (policy_block / secret_detected / human_approval_required)

**Event log:** Filterable by type. Columns: severity badge / type / task ID / repo / timestamp. No individual user column — team-level only.

---

### Drill-downs (Team + Repo)

**Shared template:**
- Header: entity name + 3 top-line stats (tasks, autonomy rate, total spend)
- 4 mini-sections (Outcomes, Cost, Reliability, Governance): 2 key metrics each + "View full →" link to the relevant page pre-filtered
- Reuses all existing components, no new UI patterns

**Repo drill-down addition:** Repo Readiness strip — 3 boolean badges: Test command detected / CI configured / Agent instructions present. Explains why some repos have lower autonomy rates.

---

## 5. Metric Decisions: What We Included and Why

| Metric | Decision | Rationale |
|--------|----------|-----------|
| Autonomy Rate | ✅ North Star | Measures agent value, not activity |
| Cost / Merged PR | ✅ Headline | CEO-readable unit economics |
| Human Edit Distance | ✅ Signature quality metric | Best proxy for actual output quality |
| Task funnel (Started→Merged) | Moved to Reliability | Useful for debugging dropoff, not value signal |
| Top teams leaderboard | Replaced with scatter | Leaderboard incentivizes gaming; scatter shows pattern |
| Individual engineer ranking | ❌ Out of scope | Surveillance optics, bad incentives |
| DORA comparison (agent vs baseline) | ❌ Future scope | Requires cross-system data (deployments, incidents) |
| Repo readiness score | ✅ Partial (drill-down only) | Explains quality variance without requiring full scoring model |
| Total token count | Demoted to supporting metric | Activity signal, not value signal |
| Lines of code generated | ❌ Out of scope | Gameable, more code ≠ better |

---

## 6. Presentation Scope

The GitHub Pages deployment is the primary review artifact. Reviewers get two URLs:

| URL | What it shows |
|-----|---------------|
| `https://<org>.github.io/<repo>/` | Live dashboard (login → full portal) |
| `https://<org>.github.io/<repo>/storybook/` | Component library with all states |

### What reviewers experience
1. Land on the Okta-branded login screen (`/login`)
2. Click "Continue with Okta" — immediately enters the dashboard (no credentials)
3. Navigate all 5 pages + team and repo drill-downs
4. All data is deterministic — the same numbers every time, suitable for a live walkthrough
5. Global filters (period, team, model) work and update all charts
6. Clicking a task on the Reliability page opens the span drawer

### What the Storybook shows
Every reusable component with all meaningful states: default, loading skeleton, empty, error, and edge cases (e.g., budget gauge at 110%, KPI card with negative trend, event log with 0 rows). This is the component API documentation and the accessibility audit surface.

---

## 7. Storybook

**Version:** 10.4.6 with `@storybook/react-vite` framework (shares Vite config, no separate bundler).

**Deployed to:** `/storybook/` path on GitHub Pages, built as a static output alongside the dashboard.

### Stories coverage

Every component in `src/components/` gets a story file. Required story variants per component:

| Component | Required story variants |
|-----------|------------------------|
| KpiCard | Default, positive trend, negative trend, loading skeleton, zero value |
| BudgetGauge | 50% normal, 90% warning, 110% over-budget |
| SparklineChart | With data, empty/flat |
| AlertBadge | Critical, warning, info, resolved |
| TeamTable | Populated, empty state, sorted |
| WorkflowTable | Populated, empty state |
| SpanDrawer | Open with spans, open with error span, loading |
| AutonomyBar | All four bands populated, single band (edge case) |
| TeamScatter | Multiple teams, single team, all same autonomy rate |
| LoginPage | Default (the only state) |

### Accessibility requirements

All stories must pass **Storybook's `@storybook/addon-a11y`** accessibility checks (axe-core under the hood). The CI pipeline runs `storybook build` + `storybook test --coverage` and fails if any a11y violation of severity `critical` or `serious` is reported. `moderate` violations are flagged as warnings but do not fail the build.

Specific checks enforced:
- All interactive elements have accessible names (no icon-only buttons without `aria-label`)
- Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Chart elements have `role="img"` and `aria-label` describing the data
- Focus order is logical (sidebar → top bar → main content)

---

## 8. CI/CD Pipeline (GitHub Actions)

Two workflows:

### `ci.yml` — runs on every push and PR to `main`
```
jobs:
  test:
    - Install deps (pnpm)
    - Type check (tsc --noEmit)
    - Unit + component tests (vitest run --coverage)
    - Fail if coverage < 80%

  storybook-test:
    - Build Storybook (storybook build)
    - Run Storybook tests incl. a11y (storybook test)
    - Fail on any critical/serious a11y violation

  build:
    needs: [test, storybook-test]
    - Build dashboard (vite build --base=/<repo>/)
    - Build Storybook into dist/storybook/
    - Upload dist/ as artifact
```

### `deploy.yml` — runs on push to `main` only (after `ci.yml` passes)
```
jobs:
  deploy:
    needs: ci / build artifact
    - Download dist/ artifact
    - Deploy to GitHub Pages (actions/deploy-pages)
```

**Base URL handling:** Vite's `base` config is set to `/<repo-name>/` so all asset paths resolve correctly on GitHub Pages. React Router uses `basename` matching the same base. Storybook is output to `dist/storybook/` so it lands at `/<repo-name>/storybook/`.

**`pnpm` lockfile** is committed. `node_modules` is never cached across major version bumps — cache key includes `pnpm-lock.yaml` hash.

---

## 9. Testing Strategy

- **Unit tests (Vitest):** All mock generators (seeded determinism), all utility formatters (formatCurrency, formatDuration, formatNumber, formatPercent, computeTrend, classifyAutonomy)
- **Component tests (RTL):** KpiCard, BudgetGauge, TeamTable, WorkflowTable, SpanDrawer — render, interact, assert
- **Integration tests (RTL):** Each page renders correct primary content with mock data; loading skeletons visible before data resolves; filter changes propagate to charts
- **Storybook a11y tests:** All stories pass axe-core at WCAG AA, no critical/serious violations
- **Coverage target:** ≥ 80% lines across `src/`

---

## 10. Out of Scope

- Real API / database integration
- Real SSO / token validation
- Real-time streaming updates
- Write operations (no budget editing in UI)
- DORA comparison metrics
- Individual engineer leaderboards
- Full trace replay (flat span list per task is sufficient)
