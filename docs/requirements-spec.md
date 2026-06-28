# Requirements Specification
## Flightdeck — Org-Level AI Coding Agent Analytics Portal

---

## 1. Product Context

Engineering organizations running cloud AI coding agents (e.g., Claude Code on the web) need visibility into whether those agents are delivering real engineering value — not just activity. The primary audience is engineering leadership (VP/CTO), platform leads, and team/repo managers.

The North Star question the product answers:
> **Are our agents producing accepted engineering output autonomously, at a reasonable cost?**

The unit of value is a **merged PR the agent wrote**, not a token or a run. This deliberately separates Flightdeck from generic LLM observability dashboards.

---

## 2. User Personas

### Persona A: Engineering VP / CTO
- Needs: Autonomy rate trend, cost per merged PR, team comparisons, cost anomalies
- Visits: Weekly, 5-minute glance
- Critical question: "Are agents actually doing the work, or are engineers rewriting everything?"

### Persona B: Platform / DevOps Lead
- Needs: Tool failure rates, P95 task duration, trace-level debugging, security events
- Visits: Daily, deep investigation
- Critical question: "Are agents healthy? Where do they fail and why?"

### Persona C: Team Lead / Engineering Manager
- Needs: My team's autonomy rate, spend breakdown, top repos, human edit distance
- Visits: Weekly, 10-minute review
- Critical question: "Is my team getting real value from agents at an acceptable cost?"

---

## 3. Functional Requirements

### FR-01: Mock SSO Login (`/login`)
- Okta-branded login page with org logo. Instead of a single sign-in button it presents **demo workspaces** (companies) to choose from
- **Workspace = scenario:** picking a company writes `authenticated: true` + the company id to `sessionStorage`, selects that company's **data scenario** (e.g. Acme Corp → healthy fleet, Globex Industries → struggling fleet), and redirects to `/overview`. The org name in the TopBar reflects the chosen workspace
- `<RequireAuth>` route guard wraps all dashboard routes — unauthenticated users redirect to `/login`
- Refreshing the page within the same tab preserves session **and scenario** (the dataset is re-selected from `sessionStorage` at boot); opening a new tab requires re-login
- **Signed-in identity:** the authenticated mock user (name, role, email, initials avatar) is shown in the sidebar footer for a professional, "you are signed in as…" feel. Identity comes from a single mock session module (`src/auth/session.ts`)
- **Log out:** a Log out control in the sidebar footer drops the auth state (removes the `authenticated` flag) and returns to `/login`

### FR-02: Organization Overview (`/overview`)
- **Hero:** Agent Autonomy Breakdown — full-width segmented bar showing % of **terminal tasks** (status completed / failed / cancelled) in each band: Autonomous / Human-assisted / Human-rescued / Failed. Non-terminal tasks (queued / running) are excluded from the denominator. A reverted PR counts as Failed, not as a merged band.
- **KPI cards (5):** Tasks Started, Autonomy Rate, Cost/Merged PR, Median Time to PR, Active Users — each with sparkline + % vs prior period
- **Charts:**
  - Tasks over time (area, stacked by autonomy band)
  - Team scatter (x = task volume, y = autonomy rate — no ranking, pattern view)
- **Alerts panel:** A titled "Active alerts" panel listing each alert as a separated, scannable row — a severity-coloured dot, the alert **type** in bold, and a muted **detail** (task + repo, or a measurable reason like "$9,820/day · 150% over budget"); the type is not repeated in the detail. Each row links to its source and has a dismiss control. Alerts are **derived, not stored** — synthesized from high-severity Security Events plus the injected cost-spike anomaly (see Technical Spec `Alert` type) and returned inline on `getOrgOverview`. This active-alert count is the **single source of truth**: the same number drives the Governance sidebar badge and the Governance "Critical Alerts" KPI, and each security-event alert deep-links to its row in the Governance event log
- **Global time range:** 7d / 30d / 90d (segmented button group)

### FR-03: Outcomes & Quality (`/outcomes`)
- **KPI cards (4):** Merge Rate, Human Edit Distance %, CI Pass Rate (first attempt), Revert Rate — each with a sparkline + % vs prior period (Edit Distance and Revert Rate are lower-is-better)
  - **Merge Rate** = merged PRs ÷ PRs opened by the agent
  - **Human Edit Distance %** = `humanEditDistancePct` averaged over merged PRs (human commits/lines after the agent ÷ total)
  - **CI Pass Rate (first attempt)** = share of agent PRs whose **first** CI run passed (`ciFirstAttemptPassed`), independent of any later reruns (`ciStatus` holds the final status)
  - **Revert Rate** = PRs with status `reverted` ÷ merged PRs
- **Charts:**
  - Human edit distance trend over time (line, with a dashed least-squares trend overlay)
  - Outcome by task type (stacked bar of **absolute task counts** — autonomous/assisted/rescued/failed per task type, not percentages)
  - Review comments per PR trend (line, with a dashed least-squares trend overlay)
- **Table:** PR outcomes — repo / task type / merge rate / avg edit distance / CI pass rate. Sortable. Task type renders as a colour-coded badge (one hue per type) and the rate columns are traffic-light coloured (green good / amber warning / red poor, with the edit-distance scale flipped since less rework is better)

### FR-04: Cost & Efficiency (`/cost`)
- **KPI cards (4):** Total Spend, Cost/Task, Cost/Merged PR, Token Waste %
  - **Token Waste %** = tokens spent on work that produced no accepted output ÷ total tokens. "Wasted" tokens = tokens from terminal tasks that did **not** result in a merged PR (failed / cancelled / PR closed-unmerged) **plus** tokens from tasks whose PR was later `reverted`. Tokens from successful merged PRs are never counted as waste.
- **Charts:**
  - Spend over time (area, Y-axis formatted as currency with ≤2 decimals; hover tooltip shares the same formatter so values display as dollars, e.g. `$14.09`)
  - Budget burn gauge (radial — emerald when normal, amber warning at ≥ 75%, turns red at > 90%)
  - Cost/merged PR by task type (horizontal bar — e.g., "bug_fix: $18, feature: $74, docs: $12")
- **Table:** Team cost breakdown — team / spend / tasks / cost per task / cost per merged PR / waste %. Sortable.

### FR-05: Reliability & Traces (`/reliability`)
- **KPI cards (4):** P95 Task Duration, Tool Failure Rate, Timeout Rate, Env Setup P95
  - **Timeout Rate** = spans with status `timeout` ÷ all spans (from agent observability spans)
  - **Env Setup P95** = P95 of `env_setup` span duration. These spans do **not** come from agent observability — they originate from the **Agent Operator** (the provisioning layer that deploys environments) and are merged into the task trace with `source: 'operator'`
- **Charts:**
  - Task duration P50/P95 trend (multi-line)
  - Errors by category trend (**multi-line — one line per error category**; shows absolute error counts per category, not a percentage/rate; required, not a single aggregate line). The legend is **interactive** — clicking a category shows/hides its line so the chart can be thinned out when all six are too busy to read
  - **Tool reliability leaderboard** (horizontal bar) — tools ranked by error rate, most-broken first. This is a *tool* leaderboard, not a team/engineer ranking (those remain out of scope)
- **Tool performance table:** tool type / call count / error rate / P50 latency / P95 latency (aggregated from `TraceSpan` grouped by span type)
- **Task list:** Recent tasks, filterable by status (completed / failed / blocked)
- **Span drawer:** Clicking a task opens a slide-over with a flat span list (type, name, duration, status)

### FR-06: Governance & Audit (`/governance`)
- **KPI cards (4):** Critical Alerts, Policy Blocks (count + rate), Secrets Detected, Human Approvals Required. **Critical Alerts** is the count of critical security events in the period — the same number shown in the Overview alerts strip and the sidebar badge — so a warning seen on the Overview is findable here.
- **Chart:** Security events over time — stacked area (policy_block / secret_detected / human_approval_required)
- **Event log:** Filterable by type. Columns: severity badge / type / task ID / repo / timestamp. No individual user column. A row can be **deep-linked from an Overview alert** (`/governance?event=<id>`) — the target row is scrolled into view and highlighted.

### FR-07: Team Drill-Down (`/teams/:teamId`)
- Header: team name + tasks, autonomy rate, total spend
- 4 mini-sections (Outcomes, Cost, Reliability, Governance): 2 key metrics each + "View full →" link pre-filtered
- Team member list with individual usage stats (self-service, not a ranking)

### FR-08: Repo Drill-Down (`/repos/:repoId`)
- Same template as team drill-down, scoped to the repo
- **Repo Readiness strip:** 3 boolean badges — Test command detected / CI configured / Agent instructions present

### FR-09: Global Filters
- Time range: 7d / 30d / 90d, rendered as a **segmented button group** (not a dropdown); persists across page navigation within session
- Team filter: all / specific team (dropdown)
- Model filter: all / specific model (dropdown)
- **All three filters are functional**: Team and Model are threaded into every org-level metric query (`getOrgOverview`, `getOutcomesMetrics`, `getCostMetrics`, `getReliabilityMetrics`, `getGovernanceMetrics`) so KPIs, charts, tables, and derived alerts all reflect the active filter set. Passing `null` for Team/Model means "all"
- Team and Model selectors are hidden on drill-down pages (those scope by their route param); the Period button group remains
- Drill-down pages scope locally and do not write back to global filters
- The three controls (Period group, Team pill, Model pill) share one control height so they sit on a single aligned row

---

## 4. Non-Functional Requirements

### NFR-01: Static Deployment
- Entire app must build to static files (no SSR, no server)
- Deployed to GitHub Pages at `https://<org>.github.io/flightdeck/`
- Storybook deployed at `https://<org>.github.io/flightdeck/storybook/`
- Vite `base` config set to `/flightdeck/`, React Router uses matching `basename`
- Deployed via the **GitHub Actions Pages artifact** (Pages source = "GitHub Actions"), not a `gh-pages` branch
- **BrowserRouter is required.** A `public/404.html` SPA fallback re-serves `index.html` so deep-link refreshes (e.g. reloading `/cost`) resolve client-side instead of 404ing
- Mocked authentication and the current route both survive a page refresh (session in `sessionStorage`; deep route restored via the 404 fallback)

### NFR-02: Storybook
- Version: 10.4.6 with `@storybook/react-vite`
- Every component in `src/components/` has a story file with all meaningful state variants
- All stories pass `@storybook/addon-a11y` accessibility checks (axe-core)
- CI fails on any `critical` or `serious` a11y violation

### NFR-03: CI/CD
- `ci.yml`: runs on every push and PR — type check, unit tests (≥80% coverage), Storybook build + a11y tests
- `deploy.yml`: runs on push to `main` after CI passes — builds dashboard + Storybook, deploys to GitHub Pages

### NFR-04: Performance
- All pages render initial data within 1.5s
- Pages lazy-loaded (React.lazy + Suspense)
- All data for a page fetched in parallel (Promise.all)

### NFR-05: Usability
- Progressive disclosure: KPIs first, charts second, tables/detail on demand
- Every page answers exactly one primary question
- Dark mode first — warm dark theme (near-black warm neutrals, orange brand accent); see §5 for the design palette
- Mobile-responsive down to 768px (minimum supported width; per-breakpoint behavior defined in Technical Spec §10 "Responsive Behavior")
- Page title shown once in the TopBar; org page `<h1>` elements are screen-reader only (`sr-only`) to avoid visual duplication while maintaining heading structure

### NFR-06: Data
- All data mocked via deterministic seeded service (seed: 42)
- 90 days of history, 4 teams, 5 repos, 12 users, 6 task types, 3 models
- Realistic distributions: log-normal latency, weekday/weekend volume patterns, injected cost spike for alert demo

### NFR-07: Reliability
- No unhandled errors on any page
- Loading skeleton states for all async fetches
- Empty states for all zero-data scenarios

---

## 5. Design Palette

The Flightdeck UI uses a **warm dark theme** derived from the reference desktop task-app design. The brand accent is **orange**; the neutral scale is warm (brownish-black, not cool slate-blue). This section is the source of truth for all colour decisions; the Technical Spec §10 maps these roles to concrete Tailwind tokens.

### 5.1 Semantic Role → Hex

| Role | Hex | Notes |
|------|-----|-------|
| `background` | `#1a1714` | Deepest app background (window chrome, sidebar rail) |
| `surface` | `#201e1b` | Primary panel / sidebar content area |
| `surface-elevated` | `#252220` | Cards, dropdowns, table rows, drawer overlays |
| `border` | `#3a3530` | Dividers, card outlines, input strokes |
| `text-primary` | `#f0ece6` | Headlines, KPI values, active nav labels |
| `text-secondary` | `#a89f96` | Body copy, table cell text |
| `text-muted` | `#6b6460` | Labels, section headings, placeholder text |
| `brand` | `#f97316` | Orange accent — flower logo, active task icon, primary CTA |
| `brand-light` | `#fb923c` | Hover state, soft brand tint |
| `brand-dark` | `#ea6c00` | Pressed state, darker brand emphasis |
| `success` | `#22c55e` | Completed-task checkmarks, positive trend indicators |
| `warning` | `#f59e0b` | Amber — budget approaching limit, the "Auto" preset star |
| `error` | `#ef4444` | Failed tasks, over-budget gauge, critical alerts |
| `info` | `#6366f1` | Blue/indigo secondary icon accent, info-severity badges |

### 5.2 Autonomy Band Colours

These remain semantically fixed and continue to use their current roles; only the neutral scale around them changes:

| Band | Colour | Hex |
|------|--------|-----|
| Autonomous | emerald-500 | `#10b981` |
| Human-assisted | sky-500 | `#0ea5e9` |
| Human-rescued | amber-500 | `#f59e0b` |
| Failed | rose-500 | `#f43f5e` |

### 5.3 Chart Series Palette (8 colours)

A warm-harmonised 8-colour categorical palette for multi-series charts. Series are assigned in order 1→8:

| Token | Hex | Character |
|-------|-----|-----------|
| chart-1 | `#f97316` | Orange — brand |
| chart-2 | `#22c55e` | Green |
| chart-3 | `#6366f1` | Indigo |
| chart-4 | `#f59e0b` | Amber |
| chart-5 | `#ef4444` | Red |
| chart-6 | `#a78bfa` | Violet |
| chart-7 | `#14b8a6` | Teal |
| chart-8 | `#fb7185` | Rose |

Autonomy-band series always use the fixed `autonomy-*` colours above, not this chart rotation.

---

## 6. Out of Scope

- Real API / database integration
- Real SSO / token validation
- Real-time streaming updates
- Write operations (no budget editing in UI)
- DORA comparison metrics (agent vs baseline deployments)
- Individual engineer leaderboards or rankings
- Full trace replay (flat span list per task is sufficient)
- Mobile native app
- Internationalization (i18n) and localization (l10n) — UI is English only, no locale-aware formatting beyond USD currency
