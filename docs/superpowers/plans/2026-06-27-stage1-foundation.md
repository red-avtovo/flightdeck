# Stage 1: Foundation — Scaffold, Types, PRNG & Utils

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Flightdeck project with all build tooling, type definitions, the seeded PRNG, and utility functions — the foundation every later stage depends on.

**Architecture:** Vite 6 + React 18 + TypeScript SPA. All files live at the repo root `/Users/abochev/code/assignment/`. Tailwind CSS v3 dark-mode-first. Vitest for unit tests.

**Tech Stack:** pnpm, Vite 6, React 18, TypeScript 5.8, Tailwind CSS 3, Vitest 3

## Global Constraints

- Package manager: pnpm; `pnpm-lock.yaml` must be committed
- All files at repo root `/Users/abochev/code/assignment/`
- Vite `base: '/flightdeck/'` — required for GitHub Pages
- Dark mode: Tailwind `darkMode: 'class'`; `<html class="dark">` always set in `index.html`
- Minimum supported width: 768px
- Storybook spec says 10.4.6 — if that version is unavailable on npm, use the latest stable 8.x; the API is identical
- All mock data deterministic: mulberry32 PRNG, seed=42
- Test coverage target: ≥80% lines overall; 100% for `src/lib/` and `src/mock/`
- English only, USD currency, no i18n

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | All dependencies and scripts |
| `vite.config.ts` | Vite + React plugin + `/flightdeck/` base |
| `tsconfig.json` | TypeScript compiler config |
| `tailwind.config.ts` | Dark mode, custom autonomy-band + chart colors |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `vitest.config.ts` | jsdom environment, setup file, coverage thresholds |
| `index.html` | HTML entry point — sets `class="dark"` on `<html>` |
| `src/index.css` | Tailwind directives + Inter font import |
| `src/main.tsx` | React DOM mount point |
| `src/App.tsx` | Placeholder — replaced entirely in Stage 3 |
| `src/test/setup.ts` | jest-dom + Recharts ResponsiveContainer mock |
| `src/types/index.ts` | All TypeScript interfaces and union types |
| `src/mock/seed.ts` | mulberry32 PRNG — exports `createRng(seed)` |
| `src/mock/__tests__/seed.test.ts` | Determinism + distribution tests |
| `src/lib/utils.ts` | formatCurrency, formatDuration, formatNumber, formatPercent, computeTrend, classifyAutonomy |
| `src/lib/__tests__/utils.test.ts` | Unit tests — 100% coverage on all six functions |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: nothing
- Produces: a project that compiles with `pnpm build` and exits cleanly on `pnpm test:run`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "flightdeck",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "storybook:test": "test-storybook"
  },
  "dependencies": {
    "@fontsource/inter": "^5.1.1",
    "lucide-react": "^0.511.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.3"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^8.6.0",
    "@storybook/addon-essentials": "^8.6.0",
    "@storybook/react-vite": "^8.6.0",
    "@storybook/test-runner": "^0.21.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^4.5.2",
    "@vitest/coverage-v8": "^3.2.4",
    "autoprefixer": "^10.4.21",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "storybook": "^8.6.0",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/flightdeck/',
})
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'autonomy-autonomous': '#10b981',
        'autonomy-assisted': '#0ea5e9',
        'autonomy-rescued': '#f59e0b',
        'autonomy-failed': '#f43f5e',
        'chart-1': '#6366f1',
        'chart-2': '#10b981',
        'chart-3': '#0ea5e9',
        'chart-4': '#f59e0b',
        'chart-5': '#f43f5e',
        'chart-6': '#8b5cf6',
        'chart-7': '#14b8a6',
        'chart-8': '#e879f9',
        surface: '#0f172a',
        'surface-elevated': '#1e293b',
        border: '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80 },
      exclude: [
        'src/test/**',
        '**/*.d.ts',
        'src/main.tsx',
        '**/*.stories.tsx',
        'src/App.tsx',
        'tailwind.config.ts',
        'postcss.config.js',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
  },
})
```

- [ ] **Step 7: Create `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  }
})
```

- [ ] **Step 8: Create `index.html`**

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flightdeck</title>
  </head>
  <body class="bg-slate-900 text-slate-50 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create `src/index.css`**

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 11: Create `src/App.tsx`** (placeholder, replaced in Stage 3)

```tsx
export default function App() {
  return <div className="min-h-screen bg-slate-900 text-slate-50 p-8">Flightdeck loading…</div>
}
```

- [ ] **Step 12: Install dependencies**

```bash
cd /Users/abochev/code/assignment
pnpm install
```

Expected: resolves packages, creates `node_modules/` and `pnpm-lock.yaml`

- [ ] **Step 13: Verify the build compiles**

```bash
pnpm build
```

Expected: `dist/` created with no TypeScript errors

- [ ] **Step 14: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json tailwind.config.ts postcss.config.js vitest.config.ts index.html src/index.css src/main.tsx src/App.tsx src/test/setup.ts
git commit -m "feat: scaffold Flightdeck project with Vite, React, Tailwind, Vitest"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: all TypeScript types imported by every other module

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export type Period = '7d' | '30d' | '90d'

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked'
export type TaskType = 'bug_fix' | 'feature' | 'tests' | 'docs' | 'refactor' | 'dependency_update'
export type PRStatus = 'open' | 'merged' | 'closed_unmerged' | 'reverted'
export type SpanType = 'model_call' | 'shell_command' | 'git_operation' | 'test_run' | 'policy_check' | 'env_setup'
export type SpanStatus = 'ok' | 'error' | 'blocked' | 'timeout'
export type ErrorCategory = 'tool_error' | 'timeout' | 'env_setup' | 'policy_block' | 'model_error' | 'test_failure'
export type SecurityEventType = 'policy_block' | 'secret_detected' | 'human_approval_required'
export type Severity = 'critical' | 'warning' | 'info'
export type AutonomyBand = 'autonomous' | 'human_assisted' | 'human_rescued' | 'failed'

export interface Team {
  id: string
  name: string
  memberCount: number
}

export interface Repo {
  id: string
  name: string
  teamId: string
  testCommandDetected: boolean
  ciConfigured: boolean
  agentInstructionsPresent: boolean
}

export interface User {
  id: string
  teamId: string
  name: string
  email: string
  firstActive: string
  lastActive: string
}

export interface AgentTask {
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
  autonomyBand: AutonomyBand | null
}

export interface TraceSpan {
  id: string
  taskId: string
  type: SpanType
  name: string
  startedAt: string
  durationMs: number
  status: SpanStatus
  errorCategory?: ErrorCategory
  source: 'agent' | 'operator'
  costUsd?: number
  inputTokens?: number
  outputTokens?: number
}

export interface PullRequestOutcome {
  id: string
  taskId: string
  repoId: string
  openedAt: string
  mergedAt: string | null
  status: PRStatus
  ciStatus: 'passed' | 'failed' | 'not_run'
  ciFirstAttemptPassed: boolean
  ciAttempts: number
  reviewComments: number
  changeRequests: number
  agentCommits: number
  humanCommitsAfterAgent: number
  humanEditDistancePct: number
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  autonomyBand: AutonomyBand
}

export interface SecurityEvent {
  id: string
  taskId: string
  repoId: string
  teamId: string
  severity: Severity
  type: SecurityEventType
  createdAt: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface Kpi {
  value: number
  trendPct: number | null
  sparkline: TrendPoint[]
}

export interface Alert {
  id: string
  severity: Severity
  source: 'security_event' | 'cost_anomaly'
  type: SecurityEventType | 'cost_spike'
  message: string
  refId: string
  createdAt: string
}

export interface TeamMetrics {
  teamId: string
  teamName: string
  taskCount: number
  autonomyRate: number
  spendUsd: number
  costPerTask: number
  costPerMergedPr: number
  tokenWastePct: number
}

export interface OrgOverview {
  autonomyBreakdown: Record<AutonomyBand, number>
  kpis: Record<'tasksStarted' | 'autonomyRate' | 'costPerMergedPr' | 'medianTimeToPr' | 'activeUsers', Kpi>
  tasksOverTime: Array<{ date: string } & Record<AutonomyBand, number>>
  teamScatter: TeamMetrics[]
  alerts: Alert[]
}

export interface OutcomesMetrics {
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

export interface CostMetrics {
  kpis: Record<'totalSpend' | 'costPerTask' | 'costPerMergedPr' | 'tokenWastePct', Kpi>
  spendTrend: TrendPoint[]
  budgetBurnPct: number
  costPerMergedPrByTaskType: Array<{ taskType: TaskType; costUsd: number }>
  teamBreakdown: TeamMetrics[]
}

export interface ToolStat {
  tool: SpanType
  callCount: number
  errorRate: number
  p50LatencyMs: number
  p95LatencyMs: number
}

export interface ReliabilityMetrics {
  kpis: Record<'p95TaskDurationMs' | 'toolFailureRate' | 'timeoutRate' | 'envSetupP95Ms', Kpi>
  durationTrend: Array<{ date: string; p50: number; p95: number }>
  errorRateByCategory: Array<{ date: string } & Record<ErrorCategory, number>>
  toolPerformance: ToolStat[]
}

export interface GovernanceMetrics {
  kpis: Record<'policyBlocks' | 'secretsDetected' | 'humanApprovalsRequired', Kpi>
  eventsOverTime: Array<{ date: string } & Record<SecurityEventType, number>>
  events: SecurityEvent[]
}

export interface TeamDetail {
  team: Team
  autonomyRate: number
  taskCount: number
  spendUsd: number
  sections: {
    outcomes: Kpi[]
    cost: Kpi[]
    reliability: Kpi[]
    governance: Kpi[]
  }
  members: User[]
}

export interface RepoDetail {
  repo: Repo
  autonomyRate: number
  taskCount: number
  spendUsd: number
  sections: {
    outcomes: Kpi[]
    cost: Kpi[]
    reliability: Kpi[]
    governance: Kpi[]
  }
}

export interface TaskFilters {
  period: Period
  teamId?: string
  model?: string
  status?: TaskStatus
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0 with no output

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add complete TypeScript type definitions"
```

---

### Task 3: PRNG Seed Utility

**Files:**
- Create: `src/mock/seed.ts`
- Create: `src/mock/__tests__/seed.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `createRng(seed: number): Rng` — used by every generator in Stage 2

- [ ] **Step 1: Write the failing test at `src/mock/__tests__/seed.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../seed'

describe('createRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    )
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng(42)
    const b = createRng(99)
    const seqA = Array.from({ length: 10 }, () => a.next())
    const seqB = Array.from({ length: 10 }, () => b.next())
    expect(seqA).not.toEqual(seqB)
  })

  it('next() returns values in [0, 1)', () => {
    const rng = createRng(42)
    for (let i = 0; i < 1000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('nextInt returns integers in [min, max]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 500; i++) {
      const v = rng.nextInt(1, 10)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
    }
  })

  it('nextFloat returns floats in [min, max)', () => {
    const rng = createRng(42)
    for (let i = 0; i < 500; i++) {
      const v = rng.nextFloat(5, 15)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThan(15)
    }
  })

  it('pick selects an element from the array', () => {
    const rng = createRng(42)
    const arr = ['a', 'b', 'c'] as const
    for (let i = 0; i < 200; i++) {
      expect(arr).toContain(rng.pick(arr))
    }
  })

  it('nextBool defaults to ~50% true', () => {
    const rng = createRng(42)
    const trueCount = Array.from({ length: 1000 }, () => rng.nextBool()).filter(Boolean).length
    expect(trueCount).toBeGreaterThan(400)
    expect(trueCount).toBeLessThan(600)
  })

  it('nextBool(0.9) returns true ~90% of the time', () => {
    const rng = createRng(42)
    const trueCount = Array.from({ length: 1000 }, () => rng.nextBool(0.9)).filter(Boolean).length
    expect(trueCount).toBeGreaterThan(850)
  })

  it('logNormal returns positive values', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      expect(rng.logNormal(7, 0.5)).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/mock/__tests__/seed.test.ts
```

Expected: FAIL — "Cannot find module '../seed'"

- [ ] **Step 3: Create `src/mock/seed.ts`**

```typescript
export interface Rng {
  next(): number
  nextInt(min: number, max: number): number
  nextFloat(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  nextBool(probability?: number): boolean
  logNormal(meanLog: number, sigmaLog: number): number
}

function mulberry32(seed: number): () => number {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed: number = 42): Rng {
  const rand = mulberry32(seed)
  return {
    next: rand,
    nextInt: (min, max) => Math.floor(rand() * (max - min + 1)) + min,
    nextFloat: (min, max) => rand() * (max - min) + min,
    pick: <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)],
    nextBool: (p = 0.5) => rand() < p,
    logNormal: (meanLog, sigmaLog) => {
      const u1 = Math.max(rand(), 1e-10)
      const u2 = rand()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      return Math.exp(meanLog + sigmaLog * z)
    },
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test:run src/mock/__tests__/seed.test.ts
```

Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/mock/seed.ts src/mock/__tests__/seed.test.ts
git commit -m "feat: add mulberry32 seeded PRNG utility"
```

---

### Task 4: Utility Functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/__tests__/utils.test.ts`

**Interfaces:**
- Consumes: `AutonomyBand`, `TaskStatus` from `src/types/index.ts`
- Produces:
  - `formatCurrency(n: number): string`
  - `formatDuration(ms: number): string`
  - `formatNumber(n: number): string`
  - `formatPercent(ratio: number): string`
  - `computeTrend(current: number, prior: number): number | null`
  - `classifyAutonomy(input: AutonomyInput): AutonomyBand`
  - `AutonomyInput` interface (exported)
  - `percentile(sorted: number[], p: number): number`
  - `isoDate(date: Date): string`

- [ ] **Step 1: Write the failing tests at `src/lib/__tests__/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  computeTrend,
  classifyAutonomy,
  percentile,
  isoDate,
} from '../utils'

describe('formatCurrency', () => {
  it('formats zero', () => expect(formatCurrency(0)).toBe('$0.00'))
  it('formats thousands', () => expect(formatCurrency(1234.5)).toBe('$1,234.50'))
  it('formats sub-cent', () => expect(formatCurrency(0.001)).toBe('$0.001'))
  it('formats negative', () => expect(formatCurrency(-50)).toBe('-$50.00'))
})

describe('formatDuration', () => {
  it('shows ms below 1000', () => expect(formatDuration(500)).toBe('500ms'))
  it('shows seconds for 1000–59999ms', () => expect(formatDuration(1500)).toBe('1.5s'))
  it('shows minutes and seconds', () => expect(formatDuration(90000)).toBe('1m 30s'))
  it('shows whole seconds', () => expect(formatDuration(2000)).toBe('2s'))
})

describe('formatNumber', () => {
  it('passes through below 1000', () => expect(formatNumber(999)).toBe('999'))
  it('formats thousands as K', () => expect(formatNumber(1000)).toBe('1K'))
  it('formats millions as M', () => expect(formatNumber(1_500_000)).toBe('1.5M'))
})

describe('formatPercent', () => {
  it('rounds to one decimal', () => expect(formatPercent(0.9532)).toBe('95.3%'))
  it('handles 100%', () => expect(formatPercent(1.0)).toBe('100%'))
  it('handles 0%', () => expect(formatPercent(0)).toBe('0%'))
})

describe('computeTrend', () => {
  it('returns positive % for increase', () => expect(computeTrend(100, 80)).toBeCloseTo(25.0))
  it('returns negative % for decrease', () => expect(computeTrend(80, 100)).toBeCloseTo(-20.0))
  it('returns null when prior is 0', () => expect(computeTrend(100, 0)).toBeNull())
})

describe('classifyAutonomy', () => {
  it('autonomous: merged + edit < 20%', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 10 })).toBe('autonomous'))
  it('human_assisted: merged + edit 20–70%', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 45 })).toBe('human_assisted'))
  it('human_rescued: merged + edit > 70%', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 80 })).toBe('human_rescued'))
  it('human_rescued: humanInterventionRequired overrides edit distance', () =>
    expect(
      classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 10, humanInterventionRequired: true }),
    ).toBe('human_rescued'))
  it('failed: task status failed', () =>
    expect(classifyAutonomy({ status: 'failed', prMerged: false, editDistancePct: 0 })).toBe('failed'))
  it('failed: task status cancelled', () =>
    expect(classifyAutonomy({ status: 'cancelled', prMerged: false, editDistancePct: 0 })).toBe('failed'))
  it('failed: PR reverted', () =>
    expect(
      classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 5, prReverted: true }),
    ).toBe('failed'))
  it('failed: no PR', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: false, editDistancePct: 0 })).toBe('failed'))
  it('boundary: edit distance exactly 20% → human_assisted', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 20 })).toBe('human_assisted'))
  it('boundary: edit distance exactly 70% → human_assisted', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 70 })).toBe('human_assisted'))
})

describe('percentile', () => {
  it('returns P50 of sorted array', () => {
    const sorted = [1, 2, 3, 4, 5]
    expect(percentile(sorted, 50)).toBe(3)
  })
  it('returns P95 of sorted array', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1)
    expect(percentile(sorted, 95)).toBe(95)
  })
})

describe('isoDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date('2025-06-15T10:30:00Z')
    expect(isoDate(d)).toBe('2025-06-15')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/lib/__tests__/utils.test.ts
```

Expected: FAIL — "Cannot find module '../utils'"

- [ ] **Step 3: Create `src/lib/utils.ts`**

```typescript
import type { AutonomyBand, TaskStatus } from '../types'

export interface AutonomyInput {
  status: TaskStatus
  prMerged: boolean
  editDistancePct: number
  prReverted?: boolean
  humanInterventionRequired?: boolean
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs > 0 && abs < 0.01) {
    return `${sign}$${abs.toFixed(3)}`
  }
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) {
    const s = parseFloat(seconds.toFixed(1))
    return s === Math.floor(s) ? `${Math.floor(s)}s` : `${s}s`
  }
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${parseFloat((n / 1_000_000).toFixed(1))}M`
  if (n >= 1000) return `${parseFloat((n / 1000).toFixed(1))}K`
  return String(n)
}

export function formatPercent(ratio: number): string {
  const pct = ratio * 100
  if (pct === 100) return '100%'
  if (pct === 0) return '0%'
  return `${pct.toFixed(1)}%`
}

export function computeTrend(current: number, prior: number): number | null {
  if (prior === 0) return null
  return parseFloat((((current - prior) / prior) * 100).toFixed(1))
}

export function classifyAutonomy(input: AutonomyInput): AutonomyBand {
  const {
    status,
    prMerged,
    editDistancePct,
    prReverted = false,
    humanInterventionRequired = false,
  } = input
  if (status === 'failed' || status === 'cancelled' || !prMerged || prReverted) return 'failed'
  if (humanInterventionRequired || editDistancePct > 70) return 'human_rescued'
  if (editDistancePct >= 20) return 'human_assisted'
  return 'autonomous'
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  const idx = Math.ceil((p / 100) * sortedAsc.length) - 1
  return sortedAsc[Math.max(0, Math.min(idx, sortedAsc.length - 1))]
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
pnpm test:run src/lib/__tests__/utils.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 5: Check coverage on lib/utils.ts**

```bash
pnpm test:coverage --reporter=text -- src/lib/__tests__/utils.test.ts
```

Expected: 100% lines on `src/lib/utils.ts`

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils.ts src/lib/__tests__/utils.test.ts
git commit -m "feat: add utility functions (formatters, classifyAutonomy, percentile)"
```

---

## Stage 1 Complete

At this point you have:
- A compilable Vite + React + TypeScript project with Tailwind dark mode
- All TypeScript type definitions that every other stage imports
- A deterministic seeded PRNG (`createRng`) ready for generators
- Fully tested utility functions with 100% line coverage

**Next:** Stage 2 — Mock Data Layer (generators + API)
