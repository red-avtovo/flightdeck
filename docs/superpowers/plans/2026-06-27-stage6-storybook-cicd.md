# Stage 6: Storybook & CI/CD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Storybook with a11y testing, write story files for every component, and set up GitHub Actions CI/CD pipelines that enforce type checking, test coverage, a11y, and deploy to GitHub Pages.

**Architecture:** Storybook 8.6 with `@storybook/react-vite` shares the Vite config. All stories use the dark background decorator and wrap with `MemoryRouter` + `FilterProvider`. CI runs on every push; deploy runs on push to `main` after CI passes using GitHub Actions Pages artifact (not `gh-pages` branch).

**Tech Stack:** Storybook 8.6, `@storybook/addon-a11y`, GitHub Actions, GitHub Pages

## Prerequisites

Stages 1–5 complete. All components and pages exist with tests passing.

---

## File Map

| File | Purpose |
|------|---------|
| `.storybook/main.ts` | Storybook configuration — framework, addons, story glob |
| `.storybook/preview.ts` | Global decorators — Tailwind dark bg, MemoryRouter, FilterProvider |
| `src/components/cards/KpiCard.stories.tsx` | KpiCard story variants |
| `src/components/cards/AlertBadge.stories.tsx` | AlertBadge severity variants |
| `src/components/charts/BudgetGauge.stories.tsx` | BudgetGauge 50% / 90% / 110% |
| `src/components/charts/SparklineChart.stories.tsx` | With data, flat, empty |
| `src/components/charts/AutonomyBar.stories.tsx` | All bands, single band |
| `src/components/charts/ScatterChart.stories.tsx` | Multiple dots, single dot, empty |
| `src/components/tables/TeamTable.stories.tsx` | Populated, empty, sorted |
| `src/components/tables/OutcomeTable.stories.tsx` | Populated, empty |
| `src/components/tables/ToolTable.stories.tsx` | Populated, all-errors variant |
| `src/components/tables/TaskList.stories.tsx` | Mixed statuses, all-failed, empty |
| `src/components/tables/EventLog.stories.tsx` | Populated, filtered, empty |
| `src/components/overlays/SpanDrawer.stories.tsx` | Open with spans, error span, loading |
| `src/pages/LoginPage.stories.tsx` | Default |
| `.github/workflows/ci.yml` | type-check + unit tests + coverage + Storybook a11y |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages (Actions artifact) |

---

### Task 1: Storybook Configuration

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`

**Interfaces:**
- Consumes: Vite config, Tailwind, `FilterProvider`, `MemoryRouter`
- Produces: `pnpm storybook` opens at `localhost:6006` with dark background and accessible stories

- [ ] **Step 1: Create `.storybook/main.ts`**

```typescript
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
```

- [ ] **Step 2: Create `.storybook/preview.ts`**

```typescript
import type { Preview } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../src/context/FilterContext'
import '../src/index.css'
import React from 'react'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name',    enabled: true },
          { id: 'image-alt',      enabled: true },
          { id: 'link-name',      enabled: true },
          { id: 'label',          enabled: true },
        ],
      },
    },
  },
  decorators: [
    Story => React.createElement(
      MemoryRouter,
      null,
      React.createElement(FilterProvider, null, React.createElement(Story)),
    ),
  ],
}

export default preview
```

- [ ] **Step 3: Verify Storybook starts**

```bash
pnpm storybook --ci
```

Leave it running for 10 seconds, then kill with Ctrl+C. Expected: starts on port 6006 without errors.

- [ ] **Step 4: Commit**

```bash
git add .storybook/main.ts .storybook/preview.ts
git commit -m "feat: configure Storybook 8.6 with a11y addon, dark background, MemoryRouter decorator"
```

---

### Task 2: KpiCard, AlertBadge, BudgetGauge, SparklineChart Stories

**Files:**
- Create: `src/components/cards/KpiCard.stories.tsx`
- Create: `src/components/cards/AlertBadge.stories.tsx`
- Create: `src/components/charts/BudgetGauge.stories.tsx`
- Create: `src/components/charts/SparklineChart.stories.tsx`

- [ ] **Step 1: Create `src/components/cards/KpiCard.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { KpiCard } from './KpiCard'

const meta: Meta<typeof KpiCard> = {
  title: 'Cards/KpiCard',
  component: KpiCard,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof KpiCard>

const SPARKLINE = [
  { date: '2026-06-01', value: 0.38 },
  { date: '2026-06-08', value: 0.40 },
  { date: '2026-06-15', value: 0.39 },
  { date: '2026-06-22', value: 0.42 },
]

export const Default: Story = {
  args: { title: 'Autonomy Rate', value: 0.421, format: 'percent', trend: 3.2, sparkline: SPARKLINE },
}

export const PositiveTrend: Story = {
  args: { title: 'Tasks Started', value: 1247, format: 'number', trend: 12.5, sparkline: SPARKLINE },
}

export const NegativeTrend: Story = {
  args: { title: 'Cost/Merged PR', value: 48.50, format: 'currency', trend: -5.2, sparkline: SPARKLINE },
}

export const Loading: Story = {
  args: { title: 'Active Users', value: 0, format: 'number', trend: null, loading: true },
}

export const ZeroValue: Story = {
  args: { title: 'Revert Rate', value: 0, format: 'percent', trend: null },
}
```

- [ ] **Step 2: Create `src/components/cards/AlertBadge.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { AlertBadge } from './AlertBadge'

const meta: Meta<typeof AlertBadge> = {
  title: 'Cards/AlertBadge',
  component: AlertBadge,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof AlertBadge>

export const Critical: Story = { args: { severity: 'critical', label: 'critical' } }
export const Warning:  Story = { args: { severity: 'warning',  label: 'warning' } }
export const Info:     Story = { args: { severity: 'info',     label: 'info' } }
```

- [ ] **Step 3: Create `src/components/charts/BudgetGauge.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { BudgetGauge } from './BudgetGauge'

const meta: Meta<typeof BudgetGauge> = {
  title: 'Charts/BudgetGauge',
  component: BudgetGauge,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof BudgetGauge>

export const Normal:     Story = { args: { spentUsd: 5000,  budgetUsd: 10000 } }
export const Warning:    Story = { args: { spentUsd: 9000,  budgetUsd: 10000 } }
export const OverBudget: Story = { args: { spentUsd: 11000, budgetUsd: 10000 } }
```

- [ ] **Step 4: Create `src/components/charts/SparklineChart.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { SparklineChart } from './SparklineChart'

const meta: Meta<typeof SparklineChart> = {
  title: 'Charts/SparklineChart',
  component: SparklineChart,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof SparklineChart>

export const WithData: Story = {
  args: {
    data: [
      { date: '2026-06-01', value: 0.35 },
      { date: '2026-06-08', value: 0.40 },
      { date: '2026-06-15', value: 0.38 },
      { date: '2026-06-22', value: 0.43 },
    ],
    className: 'text-indigo-400',
  },
}

export const FlatLine: Story = {
  args: {
    data: [
      { date: '2026-06-01', value: 0.4 },
      { date: '2026-06-22', value: 0.4 },
    ],
  },
}

export const Empty: Story = { args: { data: [] } }
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/KpiCard.stories.tsx src/components/cards/AlertBadge.stories.tsx src/components/charts/BudgetGauge.stories.tsx src/components/charts/SparklineChart.stories.tsx
git commit -m "feat: add Storybook stories for KpiCard, AlertBadge, BudgetGauge, SparklineChart"
```

---

### Task 3: Chart + Table + Overlay Stories

**Files:**
- Create: `src/components/charts/AutonomyBar.stories.tsx`
- Create: `src/components/charts/ScatterChart.stories.tsx`
- Create: `src/components/tables/TeamTable.stories.tsx`
- Create: `src/components/tables/OutcomeTable.stories.tsx`
- Create: `src/components/tables/ToolTable.stories.tsx`
- Create: `src/components/tables/TaskList.stories.tsx`
- Create: `src/components/tables/EventLog.stories.tsx`
- Create: `src/components/overlays/SpanDrawer.stories.tsx`
- Create: `src/pages/LoginPage.stories.tsx`

- [ ] **Step 1: Create `src/components/charts/AutonomyBar.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { AutonomyBar } from './AutonomyBar'

const meta: Meta<typeof AutonomyBar> = {
  title: 'Charts/AutonomyBar',
  component: AutonomyBar,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AutonomyBar>

export const AllBands: Story = {
  args: {
    breakdown: { autonomous: 0.40, human_assisted: 0.30, human_rescued: 0.18, failed: 0.12 },
  },
}

export const SingleBand: Story = {
  args: {
    breakdown: { autonomous: 1.0, human_assisted: 0, human_rescued: 0, failed: 0 },
  },
}

export const ActiveBand: Story = {
  args: {
    breakdown: { autonomous: 0.40, human_assisted: 0.30, human_rescued: 0.18, failed: 0.12 },
    activeBand: 'autonomous',
  },
}
```

- [ ] **Step 2: Create `src/components/charts/ScatterChart.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ScatterChart } from './ScatterChart'
import type { TeamMetrics } from '../../types'

const meta: Meta<typeof ScatterChart> = {
  title: 'Charts/ScatterChart',
  component: ScatterChart,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ScatterChart>

const TEAMS: TeamMetrics[] = [
  { teamId: 'team-1', teamName: 'Platform',     taskCount: 300, autonomyRate: 0.42, spendUsd: 15000, costPerTask: 50, costPerMergedPr: 120, tokenWastePct: 0.08 },
  { teamId: 'team-2', teamName: 'Product',      taskCount: 200, autonomyRate: 0.38, spendUsd: 9000,  costPerTask: 45, costPerMergedPr: 100, tokenWastePct: 0.10 },
  { teamId: 'team-3', teamName: 'Data Science', taskCount: 150, autonomyRate: 0.55, spendUsd: 7500,  costPerTask: 50, costPerMergedPr: 85,  tokenWastePct: 0.06 },
  { teamId: 'team-4', teamName: 'Mobile',       taskCount: 100, autonomyRate: 0.50, spendUsd: 5000,  costPerTask: 50, costPerMergedPr: 90,  tokenWastePct: 0.05 },
]

export const MultiplePoints: Story = { args: { data: TEAMS } }
export const SinglePoint:    Story = { args: { data: [TEAMS[0]] } }
export const Empty:          Story = { args: { data: [] } }
```

- [ ] **Step 3: Create `src/components/tables/TeamTable.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { TeamTable } from './TeamTable'
import type { TeamMetrics } from '../../types'

const meta: Meta<typeof TeamTable> = {
  title: 'Tables/TeamTable',
  component: TeamTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof TeamTable>

const ROWS: TeamMetrics[] = [
  { teamId: 'team-platform', teamName: 'Platform', taskCount: 300, autonomyRate: 0.42, spendUsd: 15000, costPerTask: 50, costPerMergedPr: 120, tokenWastePct: 0.08 },
  { teamId: 'team-product',  teamName: 'Product',  taskCount: 200, autonomyRate: 0.38, spendUsd: 9000,  costPerTask: 45, costPerMergedPr: 100, tokenWastePct: 0.10 },
  { teamId: 'team-mobile',   teamName: 'Mobile',   taskCount: 100, autonomyRate: 0.50, spendUsd: 5000,  costPerTask: 50, costPerMergedPr: 90,  tokenWastePct: 0.05 },
]

export const Populated: Story = { args: { rows: ROWS } }
export const Empty:     Story = { args: { rows: [] } }
export const Loading:   Story = { args: { rows: [], loading: true } }
```

- [ ] **Step 4: Create `src/components/tables/OutcomeTable.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { OutcomeTable } from './OutcomeTable'

const meta: Meta<typeof OutcomeTable> = {
  title: 'Tables/OutcomeTable',
  component: OutcomeTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof OutcomeTable>

const ROWS = [
  { repoId: 'repo-platform-core', taskType: 'bug_fix' as const,  mergeRate: 0.82, avgEditDistancePct: 22, ciFirstAttemptPassRate: 0.78 },
  { repoId: 'repo-product-web',   taskType: 'feature' as const,   mergeRate: 0.71, avgEditDistancePct: 45, ciFirstAttemptPassRate: 0.65 },
  { repoId: 'repo-ds-pipelines',  taskType: 'refactor' as const,  mergeRate: 0.90, avgEditDistancePct: 12, ciFirstAttemptPassRate: 0.88 },
]

export const Populated: Story = { args: { rows: ROWS } }
export const Empty:     Story = { args: { rows: [] } }
```

- [ ] **Step 5: Create `src/components/tables/ToolTable.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ToolTable } from './ToolTable'
import type { ToolStat } from '../../types'

const meta: Meta<typeof ToolTable> = {
  title: 'Tables/ToolTable',
  component: ToolTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ToolTable>

const ROWS: ToolStat[] = [
  { tool: 'model_call',    callCount: 1200, errorRate: 0.02, p50LatencyMs: 1800, p95LatencyMs: 8500 },
  { tool: 'shell_command', callCount: 950,  errorRate: 0.08, p50LatencyMs: 450,  p95LatencyMs: 3200 },
  { tool: 'git_operation', callCount: 600,  errorRate: 0.04, p50LatencyMs: 120,  p95LatencyMs: 800 },
  { tool: 'test_run',      callCount: 400,  errorRate: 0.15, p50LatencyMs: 5000, p95LatencyMs: 25000 },
  { tool: 'policy_check',  callCount: 300,  errorRate: 0.01, p50LatencyMs: 80,   p95LatencyMs: 400 },
  { tool: 'env_setup',     callCount: 250,  errorRate: 0.05, p50LatencyMs: 8000, p95LatencyMs: 35000 },
]

const ALL_ERRORS: ToolStat[] = ROWS.map(r => ({ ...r, errorRate: 0.9 + Math.random() * 0.1 }))

export const Populated:  Story = { args: { rows: ROWS } }
export const AllErrors:  Story = { args: { rows: ALL_ERRORS } }
```

- [ ] **Step 6: Create `src/components/tables/TaskList.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { TaskList } from './TaskList'
import type { AgentTask } from '../../types'

const meta: Meta<typeof TaskList> = {
  title: 'Tables/TaskList',
  component: TaskList,
  parameters: { layout: 'padded' },
  args: { onTaskClick: () => undefined },
}
export default meta
type Story = StoryObj<typeof TaskList>

const makeTask = (overrides: Partial<AgentTask>): AgentTask => ({
  id: 'task-1', orgId: 'org-1', teamId: 'team-1', repoId: 'repo-1', userId: 'user-1',
  taskType: 'bug_fix', status: 'completed', startedAt: '2026-06-01T10:00:00Z',
  completedAt: '2026-06-01T10:30:00Z', model: 'claude-sonnet-4-6',
  inputTokens: 5000, outputTokens: 2000, costUsd: 0.04,
  toolCallCount: 12, failedToolCallCount: 0, policyBlockCount: 0,
  humanInterventionRequired: false, prId: 'pr-1', autonomyBand: 'autonomous',
  ...overrides,
})

export const MixedStatuses: Story = {
  args: {
    tasks: [
      makeTask({ id: 'task-1', status: 'completed', autonomyBand: 'autonomous' }),
      makeTask({ id: 'task-2', status: 'failed',    autonomyBand: 'failed',         taskType: 'feature' }),
      makeTask({ id: 'task-3', status: 'completed', autonomyBand: 'human_assisted', taskType: 'refactor' }),
      makeTask({ id: 'task-4', status: 'running',   autonomyBand: null,             completedAt: null }),
      makeTask({ id: 'task-5', status: 'completed', autonomyBand: 'human_rescued',  taskType: 'docs' }),
    ],
  },
}

export const AllFailed: Story = {
  args: {
    tasks: Array.from({ length: 3 }, (_, i) =>
      makeTask({ id: `task-${i}`, status: 'failed', autonomyBand: 'failed', taskType: 'feature' })
    ),
  },
}

export const Empty: Story = { args: { tasks: [] } }
```

- [ ] **Step 7: Create `src/components/tables/EventLog.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { EventLog } from './EventLog'
import type { SecurityEvent } from '../../types'

const meta: Meta<typeof EventLog> = {
  title: 'Tables/EventLog',
  component: EventLog,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof EventLog>

const EVENTS: SecurityEvent[] = [
  { id: 'e1', taskId: 't1', repoId: 'repo-1', teamId: 'team-1', severity: 'critical', type: 'policy_block',            createdAt: '2026-06-01T10:00:00Z' },
  { id: 'e2', taskId: 't2', repoId: 'repo-1', teamId: 'team-1', severity: 'warning',  type: 'secret_detected',          createdAt: '2026-06-02T11:00:00Z' },
  { id: 'e3', taskId: 't3', repoId: 'repo-2', teamId: 'team-2', severity: 'info',     type: 'human_approval_required', createdAt: '2026-06-03T12:00:00Z' },
  { id: 'e4', taskId: 't4', repoId: 'repo-2', teamId: 'team-2', severity: 'warning',  type: 'policy_block',            createdAt: '2026-06-04T09:00:00Z' },
]

export const Populated: Story = { args: { events: EVENTS } }
export const Empty:     Story = { args: { events: [] } }
```

- [ ] **Step 8: Create `src/components/overlays/SpanDrawer.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { SpanDrawer } from './SpanDrawer'
import type { TraceSpan } from '../../types'

const meta: Meta<typeof SpanDrawer> = {
  title: 'Overlays/SpanDrawer',
  component: SpanDrawer,
  parameters: { layout: 'fullscreen' },
  args: { open: true, taskId: 'task-demo-001', onClose: () => undefined },
}
export default meta
type Story = StoryObj<typeof SpanDrawer>

const SPANS: TraceSpan[] = [
  { id: 'span-1', taskId: 'task-demo-001', type: 'env_setup',     name: 'provision-env',    startedAt: '2026-06-01T10:00:00Z', durationMs: 8200,  status: 'ok',    source: 'operator' },
  { id: 'span-2', taskId: 'task-demo-001', type: 'model_call',    name: 'model-call-1',     startedAt: '2026-06-01T10:00:08Z', durationMs: 3100,  status: 'ok',    source: 'agent', inputTokens: 2000, outputTokens: 800 },
  { id: 'span-3', taskId: 'task-demo-001', type: 'shell_command', name: 'shell-1',          startedAt: '2026-06-01T10:00:11Z', durationMs: 450,   status: 'error', source: 'agent', errorCategory: 'tool_error' },
  { id: 'span-4', taskId: 'task-demo-001', type: 'git_operation', name: 'git-commit',       startedAt: '2026-06-01T10:00:12Z', durationMs: 120,   status: 'ok',    source: 'agent' },
  { id: 'span-5', taskId: 'task-demo-001', type: 'test_run',      name: 'test-run-1',       startedAt: '2026-06-01T10:00:13Z', durationMs: 12000, status: 'ok',    source: 'agent' },
]

export const OpenWithSpans:   Story = { args: { spans: SPANS, loading: false } }
export const OpenWithErrorSpan: Story = { args: { spans: SPANS, loading: false } }
export const Loading:         Story = { args: { spans: [], loading: true } }
```

- [ ] **Step 9: Create `src/pages/LoginPage.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import LoginPage from './LoginPage'

const meta: Meta<typeof LoginPage> = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof LoginPage>

export const Default: Story = {}
```

- [ ] **Step 10: Build Storybook to verify all stories compile**

```bash
pnpm build-storybook
```

Expected: `storybook-static/` generated with no errors

- [ ] **Step 11: Commit**

```bash
git add src/components/charts/AutonomyBar.stories.tsx src/components/charts/ScatterChart.stories.tsx src/components/tables/TeamTable.stories.tsx src/components/tables/OutcomeTable.stories.tsx src/components/tables/ToolTable.stories.tsx src/components/tables/TaskList.stories.tsx src/components/tables/EventLog.stories.tsx src/components/overlays/SpanDrawer.stories.tsx src/pages/LoginPage.stories.tsx
git commit -m "feat: add Storybook stories for all components and LoginPage"
```

---

### Task 4: CI/CD Workflows

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- `ci.yml`: runs on every push + PR — type check, unit tests with coverage ≥80%, Storybook build + a11y
- `deploy.yml`: runs on push to `main` after `ci.yml` passes — builds dashboard + Storybook, deploys to GitHub Pages via Actions artifact

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Type check & unit tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm exec tsc --noEmit

      - name: Unit tests with coverage
        run: pnpm test:coverage --reporter=text
        # Fails if lines < 80% (threshold set in vitest.config.ts)

  storybook-test:
    name: Storybook build & a11y
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Storybook
        run: pnpm build-storybook --quiet

      - name: Run Storybook a11y tests
        run: pnpm storybook:test --url file://$(pwd)/storybook-static/index.html
        # Fails on any critical or serious axe-core violation

  build:
    name: Build dashboard
    runs-on: ubuntu-latest
    needs: [test, storybook-test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build dashboard
        run: pnpm build

      - name: Build Storybook into dist/storybook
        run: pnpm build-storybook -o dist/storybook --quiet

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: []   # Relies on artifact uploaded by ci.yml build job
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deploy
        uses: actions/deploy-pages@v4
```

Note: the `deploy.yml` job consumes the artifact uploaded by `ci.yml`'s `build` job. Both workflows trigger on push to `main`. GitHub Pages must be configured to use the "GitHub Actions" source (Settings → Pages → Source: "GitHub Actions").

- [ ] **Step 3: Commit CI/CD workflows**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "feat: add CI/CD workflows — type check, tests, Storybook a11y, Pages deploy"
```

- [ ] **Step 4: Push to GitHub and verify CI passes**

```bash
git push origin main
```

Then open the repository on GitHub → Actions tab. Wait for:
- `CI` workflow to turn green (type check + tests + storybook a11y + build)
- `Deploy to GitHub Pages` workflow to deploy

Expected URLs after deploy:
- Dashboard: `https://<your-org>.github.io/flightdeck/`
- Storybook: `https://<your-org>.github.io/flightdeck/storybook/`

- [ ] **Step 5: Verify GitHub Pages**

Open `https://<your-org>.github.io/flightdeck/` in a browser:
1. Login page appears
2. Click "Continue with Okta" → overview loads with real data
3. Navigate all 5 sidebar routes — no console errors
4. Refresh on `/cost` → still renders (SPA fallback working)
5. Open `https://<your-org>.github.io/flightdeck/storybook/` — all stories visible

---

## Stage 6 Complete

At this point you have:
- Storybook configured with dark background, a11y addon, and 13 story files covering every component
- GitHub Actions CI enforcing type check, ≥80% test coverage, and zero critical/serious a11y violations
- Automatic GitHub Pages deployment on every push to `main`
- Live dashboard accessible at `https://<org>.github.io/flightdeck/`
- Live Storybook accessible at `https://<org>.github.io/flightdeck/storybook/`

**Flightdeck implementation is complete.**
