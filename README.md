# Flightdeck

**Org-level analytics for AI coding agents.** Flightdeck answers one question for
engineering leadership:

> **Are our agents producing accepted engineering output autonomously, at a reasonable cost?**

The unit of value is a **merged PR the agent wrote** — not a token, a run, or an
activity count. That framing is what separates Flightdeck from generic LLM
observability dashboards.

🔗 **Live demo:** https://red-avtovo.github.io/flightdeck/
📚 **Storybook:** https://red-avtovo.github.io/flightdeck/storybook/

> This is a **front-end demo** running entirely on deterministic mock data — there
> is no backend. See [Data & sources](#data--sources) for where each chart's
> numbers would come from in a real deployment.

---

## What's inside

Five org-level views plus team/repo drill-downs:

| Page | Answers | Highlights |
|------|---------|-----------|
| **Overview** | Are agents delivering value? | Autonomy breakdown (autonomous / assisted / rescued / failed), 5 KPIs, tasks-over-time, team comparison, an active-alerts panel |
| **Outcomes & Quality** | Is output accepted with little rework? | Merge rate, human edit distance, CI first-pass rate, revert rate; PR-outcomes table |
| **Cost & Efficiency** | Are we spending wisely? | Total spend, cost/task, cost/merged-PR, token waste, spend trend, monthly-budget gauge |
| **Reliability & Traces** | Where do agents fail and why? | P95 duration, tool-failure/timeout rates, errors by category, per-task span drawer |
| **Governance & Audit** | Are agents within policy? | Critical-alert count, policy blocks, secrets detected, human approvals, event log |

Global filters (time range / team / model) apply across pages. Alerts on the
Overview, the sidebar Governance badge, and the Governance page all derive from a
single source, and each alert deep-links to its event.

---

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS v3 · React Router v6 · Recharts ·
Storybook · Vitest + React Testing Library · pnpm. Deployed to GitHub Pages.

---

## Getting started

**Prerequisites:** Node 22 and pnpm 11 (`corepack enable` will provide the pinned
pnpm version from `package.json`).

```bash
pnpm install        # also wires the tracked pre-commit hook (see below)
pnpm dev            # start Vite dev server → http://localhost:5173
```

### Build & preview the production bundle

```bash
pnpm build          # tsc -b && vite build  →  dist/
pnpm preview        # serve the built bundle locally
```

The app is built with `base: /flightdeck/` for GitHub Pages; a `404.html`
fallback + a boot-time URL restore make deep links survive a refresh.

---

## Testing & quality

```bash
pnpm test:run         # unit + component tests (Vitest)
pnpm test:coverage    # same, with the 80% line/function coverage gate
pnpm storybook        # interactive component explorer → http://localhost:6006
pnpm build-storybook  # static Storybook build
pnpm storybook:test   # a11y + render smoke tests against the built Storybook
```

**Run everything CI runs, locally:**

```bash
pnpm ci:local         # tsc, coverage, build, Storybook build + a11y/render tests
```

A **tracked pre-commit hook** (`.githooks/pre-commit`, activated by the `prepare`
script on `pnpm install`) runs that same suite before each commit, so red commits
never reach CI. Bypass in a pinch with `git commit --no-verify` or
`SKIP_CI_HOOK=1`.

CI (`.github/workflows/ci.yml`) runs type-check + tests, the Storybook a11y job,
the production build, and deploys to GitHub Pages on `main`.

---

## Demo scenarios

The login screen is a **workspace picker**. Each company maps to a deterministic
data scenario for the session, so you can show the dashboard in two states:

- **Acme Corp** — a *healthy* fleet (high autonomy, costs in budget, few alerts)
- **Globex Industries** — a *problematic* fleet (low merge rate, high failure, frequent alerts)

The choice is stored in `sessionStorage` and re-applied on refresh. Switching
scenarios = log out and pick the other workspace.

---

## Data & sources

All data is **synthetic and deterministic** — generated from a seeded `mulberry32`
PRNG (seed `42`) so every render, test, and CI run sees identical numbers. A
scenario *profile* tunes the probabilities (never the draw order), which keeps each
scenario reproducible. Generators live in `src/mock/generators/`, the profiles in
`src/mock/scenario.ts`, and the query layer in `src/mock/api.ts`.

In a real deployment, the charts would be fed by these systems:

| Real-world source | Provides | Feeds (examples) |
|-------------------|----------|------------------|
| **Agent platform / orchestrator** (e.g. Claude Code on the web, Agent API) | Task lifecycle (started/completed/failed/cancelled), task type, model, token usage, tool-call counts, human-intervention flags | Tasks Started, Active Users, autonomy classification, tool-call volume |
| **Model provider usage/billing API** | Input/output tokens × per-model price | Total Spend, Cost/Task, Cost/Merged PR, Token Waste, budget burn |
| **Version control host** (GitHub / GitLab API + webhooks) | PR opened/merged/closed/reverted, review comments, change requests, agent vs. human commits, files/lines changed, time-to-merge | Merge Rate, Revert Rate, Human Edit Distance, Median Time to PR, Cost/Merged PR, autonomy bands |
| **CI/CD system** (GitHub Actions, etc.) | First-attempt pass, attempt count, final status | CI First-Pass Rate |
| **Agent runtime tracing** (OpenTelemetry-style spans) | Per-span type, duration, status (ok/error/timeout/blocked), error category | P95 Duration, Tool Failure & Timeout rates, Errors by Category, Tool Performance, span drawer |
| **Environment provisioning / "Agent Operator"** | `env_setup` spans (provisioning time & failures) | Env Setup P95 |
| **Security / policy engine** (guardrails, secret scanners, approval workflows) | Policy blocks, secret detections, human-approval-required events + severity | Governance KPIs, security-events chart, event log, alerts |
| **Identity / org directory** (Okta SSO, HRIS) | Users, teams, repo ownership | Team/user grouping, drill-downs, "signed-in as" identity |

---

## Project structure

```
src/
├── pages/            # one file per route (Overview, Cost, …, drill-downs, Login)
├── components/       # charts/, tables/, cards/, layout/, overlays/, ui/
├── mock/             # seed.ts, scenario.ts, generators/, api.ts (the data layer)
├── context/          # FilterContext (period / team / model)
├── hooks/            # useFilters, useMockData
├── auth/             # mock SSO session + RequireAuth guard
└── lib/              # formatters, autonomy classification, helpers
docs/                 # requirements-spec.md, technical-spec.md, testing-spec.md
.githooks/            # tracked pre-commit hook
```

For deeper detail see [`docs/requirements-spec.md`](docs/requirements-spec.md)
(the source of truth for behaviour) and
[`docs/technical-spec.md`](docs/technical-spec.md) (architecture & data model).
