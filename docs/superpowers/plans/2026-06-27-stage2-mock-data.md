# Stage 2: Mock Data Layer — Generators & API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all seeded mock data generators and the mock API layer that serves them — every dashboard page pulls data from these functions.

**Architecture:** A single `createRng(42)` instance is advanced sequentially through all generators in a fixed order. The API module pre-generates everything at import time, then filters/aggregates on each call. All calls return `Promise<T>` with a 100–200 ms simulated delay.

**Tech Stack:** TypeScript, Vitest (unit), `src/mock/seed.ts` + `src/lib/utils.ts` from Stage 1

## Global Constraints (inherited from Stage 1)

- PRNG seed: 42; same seed = same data on every run
- Data volume: 90 days, 4 teams, 5 repos, 12 users, 6 task types, 3 models, ~800–1500 tasks
- Autonomy band distribution target: ~40% autonomous / 30% human_assisted / 18% human_rescued / 12% failed
- One injected cost spike at day 60 (~2.4× daily average) to trigger alert demo
- Error rate: 3–8% base, one injected spike at day 60
- All generators called in the same order every run (order determines PRNG sequence)
- Budget: MONTHLY_BUDGET_USD = 50_000 (drives budgetBurnPct in CostMetrics)
- Models: `claude-opus-4`, `claude-sonnet-4-6`, `claude-haiku-4-5`
- Token costs (per 1M tokens): opus-4 → $15 input / $75 output; sonnet-4-6 → $3 / $15; haiku-4-5 → $0.25 / $1.25

---

## File Map

| File | Purpose |
|------|---------|
| `src/mock/generators/generateTeams.ts` | 4 static teams |
| `src/mock/generators/generateRepos.ts` | 5 repos (1 per team + 1 cross-team) |
| `src/mock/generators/generateUsers.ts` | 12 users distributed across teams |
| `src/mock/generators/generateTasks.ts` | ~800–1500 AgentTask records, 90-day window |
| `src/mock/generators/generateSpans.ts` | TraceSpan records per task |
| `src/mock/generators/generatePROutcomes.ts` | PullRequestOutcome for tasks that got a PR |
| `src/mock/generators/generateSecurityEvents.ts` | SecurityEvent records, injected spike at day 60 |
| `src/mock/api.ts` | All mock API functions — pre-generates data, returns filtered/aggregated Promises |
| `src/mock/generators/__tests__/generateTeams.test.ts` | Teams unit tests |
| `src/mock/generators/__tests__/generateRepos.test.ts` | Repos unit tests |
| `src/mock/generators/__tests__/generateUsers.test.ts` | Users unit tests |
| `src/mock/generators/__tests__/generateTasks.test.ts` | Tasks unit tests |
| `src/mock/generators/__tests__/generateSpans.test.ts` | Spans unit tests |
| `src/mock/generators/__tests__/generatePROutcomes.test.ts` | PR outcomes unit tests |
| `src/mock/generators/__tests__/generateSecurityEvents.test.ts` | Security events unit tests |
| `src/mock/__tests__/api.test.ts` | API unit tests |

---

### Task 1: Static Generators — Teams, Repos, Users

**Files:**
- Create: `src/mock/generators/generateTeams.ts`
- Create: `src/mock/generators/generateRepos.ts`
- Create: `src/mock/generators/generateUsers.ts`
- Create: `src/mock/generators/__tests__/generateTeams.test.ts`
- Create: `src/mock/generators/__tests__/generateRepos.test.ts`
- Create: `src/mock/generators/__tests__/generateUsers.test.ts`

**Interfaces:**
- Consumes: `Rng` from `src/mock/seed.ts`; `Team`, `Repo`, `User` from `src/types/index.ts`
- Produces: `generateTeams(rng)`, `generateRepos(rng, teams)`, `generateUsers(rng, teams)`

- [ ] **Step 1: Write failing tests**

`src/mock/generators/__tests__/generateTeams.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'

describe('generateTeams', () => {
  it('returns exactly 4 teams', () => {
    expect(generateTeams(createRng(42))).toHaveLength(4)
  })
  it('each team has id, name, memberCount', () => {
    const teams = generateTeams(createRng(42))
    teams.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.memberCount).toBeGreaterThan(0)
    })
  })
  it('is deterministic', () => {
    expect(generateTeams(createRng(42))).toEqual(generateTeams(createRng(42)))
  })
  it('team names include Platform, Product, Data Science, Mobile', () => {
    const names = generateTeams(createRng(42)).map(t => t.name)
    expect(names).toContain('Platform')
    expect(names).toContain('Product')
    expect(names).toContain('Data Science')
    expect(names).toContain('Mobile')
  })
})
```

`src/mock/generators/__tests__/generateRepos.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'

describe('generateRepos', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)

  it('returns exactly 5 repos', () => expect(repos).toHaveLength(5))
  it('each repo has valid teamId', () => {
    const teamIds = new Set(teams.map(t => t.id))
    repos.forEach(r => expect(teamIds.has(r.teamId)).toBe(true))
  })
  it('each repo has boolean readiness flags', () => {
    repos.forEach(r => {
      expect(typeof r.testCommandDetected).toBe('boolean')
      expect(typeof r.ciConfigured).toBe('boolean')
      expect(typeof r.agentInstructionsPresent).toBe('boolean')
    })
  })
  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    expect(generateRepos(rng2, t2)).toEqual(repos)
  })
})
```

`src/mock/generators/__tests__/generateUsers.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateUsers } from '../generateUsers'

describe('generateUsers', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const users = generateUsers(rng, teams)

  it('returns exactly 12 users', () => expect(users).toHaveLength(12))
  it('each user belongs to a valid team', () => {
    const teamIds = new Set(teams.map(t => t.id))
    users.forEach(u => expect(teamIds.has(u.teamId)).toBe(true))
  })
  it('each user has name and email', () => {
    users.forEach(u => {
      expect(u.name).toBeTruthy()
      expect(u.email).toContain('@')
    })
  })
  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    expect(generateUsers(rng2, t2)).toEqual(users)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
pnpm test:run src/mock/generators/__tests__/generateTeams.test.ts
```

Expected: FAIL — "Cannot find module '../generateTeams'"

- [ ] **Step 3: Create `src/mock/generators/generateTeams.ts`**

```typescript
import type { Rng } from '../seed'
import type { Team } from '../../types'

const TEAM_DEFINITIONS = [
  { id: 'team-platform', name: 'Platform', memberCount: 8 },
  { id: 'team-product', name: 'Product', memberCount: 6 },
  { id: 'team-datascience', name: 'Data Science', memberCount: 5 },
  { id: 'team-mobile', name: 'Mobile', memberCount: 4 },
] as const

export function generateTeams(_rng: Rng): Team[] {
  return TEAM_DEFINITIONS.map(d => ({ ...d }))
}
```

- [ ] **Step 4: Create `src/mock/generators/generateRepos.ts`**

```typescript
import type { Rng } from '../seed'
import type { Repo, Team } from '../../types'

const REPO_DEFS = [
  { id: 'repo-platform-core', name: 'platform-core', teamIdx: 0 },
  { id: 'repo-product-web', name: 'product-web', teamIdx: 1 },
  { id: 'repo-ds-pipelines', name: 'ds-pipelines', teamIdx: 2 },
  { id: 'repo-mobile-app', name: 'mobile-app', teamIdx: 3 },
  { id: 'repo-shared-infra', name: 'shared-infra', teamIdx: 0 },
] as const

export function generateRepos(rng: Rng, teams: Team[]): Repo[] {
  return REPO_DEFS.map(def => ({
    id: def.id,
    name: def.name,
    teamId: teams[def.teamIdx].id,
    testCommandDetected: rng.nextBool(0.8),
    ciConfigured: rng.nextBool(0.9),
    agentInstructionsPresent: rng.nextBool(0.6),
  }))
}
```

- [ ] **Step 5: Create `src/mock/generators/generateUsers.ts`**

```typescript
import type { Rng } from '../seed'
import type { Team, User } from '../../types'

const USER_NAMES = [
  'Alex Chen', 'Maria Garcia', 'James Wilson', 'Sarah Kim',
  'David Patel', 'Emma Roberts', 'Michael Zhang', 'Olivia Brown',
  'Noah Martinez', 'Ava Thompson', 'Liam Johnson', 'Isabella Davis',
]

export function generateUsers(rng: Rng, teams: Team[]): User[] {
  const now = new Date('2026-06-27')
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  return USER_NAMES.map((name, i) => {
    const team = teams[i % teams.length]
    const firstActiveDaysAgo = rng.nextInt(20, 90)
    const lastActiveDaysAgo = rng.nextInt(0, firstActiveDaysAgo)
    const firstActive = new Date(now.getTime() - firstActiveDaysAgo * 86400000)
    const lastActive = new Date(now.getTime() - lastActiveDaysAgo * 86400000)
    const slug = name.toLowerCase().replace(' ', '.')
    return {
      id: `user-${i + 1}`,
      teamId: team.id,
      name,
      email: `${slug}@acme.example`,
      firstActive: firstActive.toISOString(),
      lastActive: lastActive.toISOString(),
    }
  })
}
```

Note: `ninetyDaysAgo` is declared but unused in the simplified version above — remove it or use it in `firstActive` bounds if TypeScript `noUnusedLocals` fires. The implementation above uses `rng.nextInt(20, 90)` instead; remove the `ninetyDaysAgo` line.

- [ ] **Step 6: Run all three test files to verify they pass**

```bash
pnpm test:run src/mock/generators/__tests__/
```

Expected: PASS — all tests green

- [ ] **Step 7: Commit**

```bash
git add src/mock/generators/generateTeams.ts src/mock/generators/generateRepos.ts src/mock/generators/generateUsers.ts src/mock/generators/__tests__/generateTeams.test.ts src/mock/generators/__tests__/generateRepos.test.ts src/mock/generators/__tests__/generateUsers.test.ts
git commit -m "feat: add static generators for teams, repos, and users"
```

---

### Task 2: Task Generator

**Files:**
- Create: `src/mock/generators/generateTasks.ts`
- Create: `src/mock/generators/__tests__/generateTasks.test.ts`

**Interfaces:**
- Consumes: `Rng`, `Team`, `Repo`, `User`
- Produces: `generateTasks(rng, teams, repos, users, windowDays?): AgentTask[]`

Token cost constants (used here and in generatePROutcomes):
- claude-opus-4: $15/M input, $75/M output
- claude-sonnet-4-6: $3/M input, $15/M output
- claude-haiku-4-5: $0.25/M input, $1.25/M output

- [ ] **Step 1: Write the failing test at `src/mock/generators/__tests__/generateTasks.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'

describe('generateTasks', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users)

  it('returns between 800 and 1500 tasks', () => {
    expect(tasks.length).toBeGreaterThanOrEqual(800)
    expect(tasks.length).toBeLessThanOrEqual(1500)
  })

  it('all tasks have required string fields', () => {
    tasks.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.teamId).toBeTruthy()
      expect(t.repoId).toBeTruthy()
      expect(t.userId).toBeTruthy()
    })
  })

  it('startedAt dates span the 90-day window', () => {
    const now = new Date('2026-06-27').getTime()
    const ninetyDaysAgo = now - 90 * 86400000
    tasks.forEach(t => {
      const ts = new Date(t.startedAt).getTime()
      expect(ts).toBeGreaterThanOrEqual(ninetyDaysAgo)
      expect(ts).toBeLessThanOrEqual(now)
    })
  })

  it('weekday volume is at least 1.2x weekend volume', () => {
    const weekdayCount = tasks.filter(t => {
      const day = new Date(t.startedAt).getUTCDay()
      return day >= 1 && day <= 5
    }).length
    const weekendCount = tasks.filter(t => {
      const day = new Date(t.startedAt).getUTCDay()
      return day === 0 || day === 6
    }).length
    const weekdayPerDay = weekdayCount / (90 * 5 / 7)
    const weekendPerDay = weekendCount / (90 * 2 / 7)
    expect(weekdayPerDay / weekendPerDay).toBeGreaterThanOrEqual(1.2)
  })

  it('terminal tasks have an autonomyBand assigned', () => {
    const terminal = tasks.filter(t =>
      t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled',
    )
    terminal.forEach(t => expect(t.autonomyBand).toBeNull())
  })

  it('non-terminal tasks have autonomyBand null', () => {
    const nonTerminal = tasks.filter(t => t.status === 'queued' || t.status === 'running')
    nonTerminal.forEach(t => expect(t.autonomyBand).toBeNull())
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    expect(generateTasks(rng2, t2, r2, u2)).toEqual(tasks)
  })
})
```

Note: `autonomyBand` is `null` on all generated tasks (set to null in generator; assigned by API after PR outcomes are generated).

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/mock/generators/__tests__/generateTasks.test.ts
```

Expected: FAIL — "Cannot find module '../generateTasks'"

- [ ] **Step 3: Create `src/mock/generators/generateTasks.ts`**

```typescript
import type { Rng } from '../seed'
import type { AgentTask, Repo, TaskStatus, TaskType, Team, User } from '../../types'

const TASK_TYPES: TaskType[] = ['bug_fix', 'feature', 'tests', 'docs', 'refactor', 'dependency_update']
const MODELS = ['claude-opus-4', 'claude-sonnet-4-6', 'claude-haiku-4-5'] as const
const MODEL_WEIGHTS = [0.15, 0.55, 0.30]

const TOKEN_COST: Record<string, { inputPerM: number; outputPerM: number }> = {
  'claude-opus-4': { inputPerM: 15, outputPerM: 75 },
  'claude-sonnet-4-6': { inputPerM: 3, outputPerM: 15 },
  'claude-haiku-4-5': { inputPerM: 0.25, outputPerM: 1.25 },
}

const TERMINAL_STATUSES: TaskStatus[] = ['completed', 'failed', 'cancelled']

function weightedPick<T>(rng: Rng, items: readonly T[], weights: number[]): T {
  const r = rng.next()
  let cumulative = 0
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) return items[i]
  }
  return items[items.length - 1]
}

function repoForTeam(repos: Repo[], teamId: string): Repo {
  const teamRepos = repos.filter(r => r.teamId === teamId)
  return teamRepos[0]
}

export function generateTasks(
  rng: Rng,
  teams: Team[],
  repos: Repo[],
  users: User[],
  windowDays = 90,
): AgentTask[] {
  const now = new Date('2026-06-27T00:00:00Z').getTime()
  const tasks: AgentTask[] = []
  let idCounter = 1

  for (let dayOffset = windowDays - 1; dayOffset >= 0; dayOffset--) {
    const dayStart = now - dayOffset * 86400000
    const date = new Date(dayStart)
    const dayOfWeek = date.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const growthFactor = 1 + (0.3 * (windowDays - 1 - dayOffset)) / (windowDays - 1)
    const baseCount = isWeekend ? 6 : 9
    const count = Math.round(baseCount * growthFactor * rng.nextFloat(0.8, 1.2))

    for (let j = 0; j < count; j++) {
      const team = rng.pick(teams)
      const teamUsers = users.filter(u => u.teamId === team.id)
      const user = rng.pick(teamUsers.length > 0 ? teamUsers : users)
      const repo = repoForTeam(repos, team.id)
      const model = weightedPick(rng, MODELS, MODEL_WEIGHTS)
      const taskType = rng.pick(TASK_TYPES)
      const startedAt = new Date(dayStart + rng.nextInt(0, 86399) * 1000).toISOString()
      const durationMs = Math.round(rng.logNormal(Math.log(180000), 0.8))
      const completedAt = new Date(new Date(startedAt).getTime() + durationMs).toISOString()
      const status = rng.pick(TERMINAL_STATUSES)
      const inputTokens = rng.nextInt(1000, 50000)
      const outputTokens = rng.nextInt(500, 20000)
      const costs = TOKEN_COST[model]
      const costUsd = (inputTokens / 1e6) * costs.inputPerM + (outputTokens / 1e6) * costs.outputPerM
      const toolCallCount = rng.nextInt(5, 80)
      const failedToolCallCount = status === 'failed' ? rng.nextInt(1, 10) : rng.nextInt(0, 3)
      const policyBlockCount = rng.nextBool(0.08) ? rng.nextInt(1, 3) : 0
      const humanInterventionRequired = rng.nextBool(0.12)
      const hasPr = status === 'completed' && rng.nextBool(0.85)

      tasks.push({
        id: `task-${idCounter++}`,
        orgId: 'org-acme',
        teamId: team.id,
        repoId: repo.id,
        userId: user.id,
        taskType,
        status,
        startedAt,
        completedAt,
        model,
        inputTokens,
        outputTokens,
        costUsd,
        toolCallCount,
        failedToolCallCount,
        policyBlockCount,
        humanInterventionRequired,
        prId: hasPr ? `pr-${idCounter}` : null,
        autonomyBand: null,
      })
    }
  }

  return tasks
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/mock/generators/__tests__/generateTasks.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/mock/generators/generateTasks.ts src/mock/generators/__tests__/generateTasks.test.ts
git commit -m "feat: add task generator with weekday/weekend volume distribution"
```

---

### Task 3: Span Generator

**Files:**
- Create: `src/mock/generators/generateSpans.ts`
- Create: `src/mock/generators/__tests__/generateSpans.test.ts`

**Interfaces:**
- Consumes: `Rng`, `AgentTask[]`
- Produces: `generateSpans(rng, tasks): TraceSpan[]`

- [ ] **Step 1: Write the failing test**

`src/mock/generators/__tests__/generateSpans.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'
import { generateSpans } from '../generateSpans'

describe('generateSpans', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users)
  const spans = generateSpans(rng, tasks)

  it('each span has a taskId that exists in tasks', () => {
    const taskIds = new Set(tasks.map(t => t.id))
    spans.forEach(s => expect(taskIds.has(s.taskId)).toBe(true))
  })

  it('durationMs > 0 for all spans', () => {
    spans.forEach(s => expect(s.durationMs).toBeGreaterThan(0))
  })

  it('env_setup spans have source: operator', () => {
    const envSpans = spans.filter(s => s.type === 'env_setup')
    envSpans.forEach(s => expect(s.source).toBe('operator'))
  })

  it('non-env spans have source: agent', () => {
    const agentSpans = spans.filter(s => s.type !== 'env_setup')
    agentSpans.forEach(s => expect(s.source).toBe('agent'))
  })

  it('error spans have an errorCategory set', () => {
    const errorSpans = spans.filter(s => s.status === 'error' || s.status === 'timeout')
    errorSpans.forEach(s => expect(s.errorCategory).toBeTruthy())
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    const tasks2 = generateTasks(rng2, t2, r2, u2)
    expect(generateSpans(rng2, tasks2)).toEqual(spans)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/mock/generators/__tests__/generateSpans.test.ts
```

Expected: FAIL — "Cannot find module '../generateSpans'"

- [ ] **Step 3: Create `src/mock/generators/generateSpans.ts`**

```typescript
import type { Rng } from '../seed'
import type { AgentTask, ErrorCategory, SpanStatus, SpanType, TraceSpan } from '../../types'

const AGENT_SPAN_TYPES: SpanType[] = ['model_call', 'shell_command', 'git_operation', 'test_run', 'policy_check']

const ERROR_CATEGORY_FOR_TYPE: Record<SpanType, ErrorCategory> = {
  model_call: 'model_error',
  shell_command: 'tool_error',
  git_operation: 'tool_error',
  test_run: 'test_failure',
  policy_check: 'policy_block',
  env_setup: 'env_setup',
}

export function generateSpans(rng: Rng, tasks: AgentTask[]): TraceSpan[] {
  const spans: TraceSpan[] = []
  let idCounter = 1

  for (const task of tasks) {
    const taskStart = new Date(task.startedAt).getTime()

    // env_setup span (from operator)
    const envDuration = Math.round(rng.logNormal(Math.log(8000), 0.4))
    spans.push({
      id: `span-${idCounter++}`,
      taskId: task.id,
      type: 'env_setup',
      name: 'provision-environment',
      startedAt: new Date(taskStart).toISOString(),
      durationMs: envDuration,
      status: rng.nextBool(0.96) ? 'ok' : 'error',
      errorCategory: undefined,
      source: 'operator',
    })
    const lastSpan = spans[spans.length - 1]
    if (lastSpan.status === 'error') lastSpan.errorCategory = 'env_setup'

    // 4–12 agent spans
    const spanCount = rng.nextInt(4, 12)
    let cursor = taskStart + envDuration
    for (let i = 0; i < spanCount; i++) {
      const type = rng.pick(AGENT_SPAN_TYPES)
      const duration = Math.round(rng.logNormal(Math.log(15000), 0.7))
      const isError = task.status === 'failed' && i === spanCount - 1
        ? rng.nextBool(0.7)
        : rng.nextBool(0.05)
      const isTimeout = !isError && rng.nextBool(0.02)
      const status: SpanStatus = isTimeout ? 'timeout' : isError ? 'error' : 'ok'
      const isModelCall = type === 'model_call'

      spans.push({
        id: `span-${idCounter++}`,
        taskId: task.id,
        type,
        name: `${type.replace('_', '-')}-${i + 1}`,
        startedAt: new Date(cursor).toISOString(),
        durationMs: duration,
        status,
        errorCategory: status !== 'ok' ? ERROR_CATEGORY_FOR_TYPE[type] : undefined,
        source: 'agent',
        ...(isModelCall && {
          costUsd: rng.nextFloat(0.001, 0.5),
          inputTokens: rng.nextInt(500, 10000),
          outputTokens: rng.nextInt(200, 4000),
        }),
      })
      cursor += duration + rng.nextInt(100, 2000)
    }
  }

  return spans
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/mock/generators/__tests__/generateSpans.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/mock/generators/generateSpans.ts src/mock/generators/__tests__/generateSpans.test.ts
git commit -m "feat: add span generator with env_setup operator spans"
```

---

### Task 4: PR Outcomes Generator

**Files:**
- Create: `src/mock/generators/generatePROutcomes.ts`
- Create: `src/mock/generators/__tests__/generatePROutcomes.test.ts`

**Interfaces:**
- Consumes: `Rng`, `AgentTask[]`, `Repo[]`
- Produces: `generatePROutcomes(rng, tasks, repos): PullRequestOutcome[]`

Edit distance target by task type:
- docs: low (5–25%), feature: high (25–80%), bug_fix: medium (10–50%), tests: low (5–20%), refactor: medium (15–60%), dependency_update: very low (0–10%)

- [ ] **Step 1: Write the failing test**

`src/mock/generators/__tests__/generatePROutcomes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'
import { generatePROutcomes } from '../generatePROutcomes'
import { classifyAutonomy } from '../../../lib/utils'

describe('generatePROutcomes', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users)
  const outcomes = generatePROutcomes(rng, tasks, repos)

  it('only completed tasks with prId get an outcome', () => {
    const eligibleIds = new Set(tasks.filter(t => t.prId !== null).map(t => t.id))
    outcomes.forEach(o => expect(eligibleIds.has(o.taskId)).toBe(true))
  })

  it('humanEditDistancePct is between 0 and 100', () => {
    outcomes.forEach(o => {
      expect(o.humanEditDistancePct).toBeGreaterThanOrEqual(0)
      expect(o.humanEditDistancePct).toBeLessThanOrEqual(100)
    })
  })

  it('merged PRs have a non-null mergedAt', () => {
    outcomes.filter(o => o.status === 'merged').forEach(o => expect(o.mergedAt).not.toBeNull())
  })

  it('autonomyBand matches classifyAutonomy logic', () => {
    outcomes.forEach(o => {
      const expected = classifyAutonomy({
        status: o.status === 'merged' ? 'completed' : 'failed',
        prMerged: o.status === 'merged',
        editDistancePct: o.humanEditDistancePct,
        prReverted: o.status === 'reverted',
      })
      expect(o.autonomyBand).toBe(expected)
    })
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    const tasks2 = generateTasks(rng2, t2, r2, u2)
    expect(generatePROutcomes(rng2, tasks2, r2)).toEqual(outcomes)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/mock/generators/__tests__/generatePROutcomes.test.ts
```

Expected: FAIL — "Cannot find module '../generatePROutcomes'"

- [ ] **Step 3: Create `src/mock/generators/generatePROutcomes.ts`**

```typescript
import type { Rng } from '../seed'
import type { AgentTask, PRStatus, PullRequestOutcome, Repo, TaskType } from '../../types'
import { classifyAutonomy } from '../../lib/utils'

const EDIT_DISTANCE_RANGES: Record<TaskType, [number, number]> = {
  docs: [5, 25],
  feature: [25, 80],
  bug_fix: [10, 50],
  tests: [5, 20],
  refactor: [15, 60],
  dependency_update: [0, 10],
}

export function generatePROutcomes(rng: Rng, tasks: AgentTask[], _repos: Repo[]): PullRequestOutcome[] {
  const outcomes: PullRequestOutcome[] = []

  for (const task of tasks) {
    if (task.prId === null) continue

    const openedAt = task.startedAt
    const prStatusRoll = rng.next()
    let status: PRStatus
    if (prStatusRoll < 0.72) status = 'merged'
    else if (prStatusRoll < 0.84) status = 'closed_unmerged'
    else if (prStatusRoll < 0.92) status = 'open'
    else status = 'reverted'

    const [minEdit, maxEdit] = EDIT_DISTANCE_RANGES[task.taskType]
    const humanEditDistancePct = rng.nextFloat(minEdit, maxEdit)

    const mergedAt = status === 'merged' || status === 'reverted'
      ? new Date(new Date(openedAt).getTime() + rng.nextInt(3600000, 172800000)).toISOString()
      : null

    const ciFirstAttemptPassed = rng.nextBool(0.78)
    const ciAttempts = ciFirstAttemptPassed ? 1 : rng.nextInt(2, 4)
    const ciStatus = status === 'merged'
      ? (rng.nextBool(0.9) ? 'passed' : 'failed')
      : 'not_run'

    const autonomyBand = classifyAutonomy({
      status: status === 'merged' ? 'completed' : 'failed',
      prMerged: status === 'merged',
      editDistancePct: humanEditDistancePct,
      prReverted: status === 'reverted',
      humanInterventionRequired: task.humanInterventionRequired,
    })

    outcomes.push({
      id: task.prId,
      taskId: task.id,
      repoId: task.repoId,
      openedAt,
      mergedAt,
      status,
      ciStatus,
      ciFirstAttemptPassed,
      ciAttempts,
      reviewComments: rng.nextInt(0, 15),
      changeRequests: rng.nextInt(0, 4),
      agentCommits: rng.nextInt(1, 8),
      humanCommitsAfterAgent: rng.nextInt(0, 5),
      humanEditDistancePct,
      filesChanged: rng.nextInt(1, 25),
      linesAdded: rng.nextInt(10, 500),
      linesDeleted: rng.nextInt(0, 200),
      autonomyBand,
    })
  }

  return outcomes
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/mock/generators/__tests__/generatePROutcomes.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/mock/generators/generatePROutcomes.ts src/mock/generators/__tests__/generatePROutcomes.test.ts
git commit -m "feat: add PR outcomes generator with autonomy band assignment"
```

---

### Task 5: Security Events Generator

**Files:**
- Create: `src/mock/generators/generateSecurityEvents.ts`
- Create: `src/mock/generators/__tests__/generateSecurityEvents.test.ts`

**Interfaces:**
- Consumes: `Rng`, `AgentTask[]`, `Team[]`
- Produces: `generateSecurityEvents(rng, tasks, teams): SecurityEvent[]`

- [ ] **Step 1: Write the failing test**

`src/mock/generators/__tests__/generateSecurityEvents.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'
import { generateSecurityEvents } from '../generateSecurityEvents'

describe('generateSecurityEvents', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users)
  const events = generateSecurityEvents(rng, tasks, teams)

  it('includes all three event types', () => {
    const types = new Set(events.map(e => e.type))
    expect(types.has('policy_block')).toBe(true)
    expect(types.has('secret_detected')).toBe(true)
    expect(types.has('human_approval_required')).toBe(true)
  })

  it('has at least one critical severity event', () => {
    expect(events.some(e => e.severity === 'critical')).toBe(true)
  })

  it('all events have a valid taskId', () => {
    const taskIds = new Set(tasks.map(t => t.id))
    events.forEach(e => expect(taskIds.has(e.taskId)).toBe(true))
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    const tasks2 = generateTasks(rng2, t2, r2, u2)
    expect(generateSecurityEvents(rng2, tasks2, t2)).toEqual(events)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/mock/generators/__tests__/generateSecurityEvents.test.ts
```

Expected: FAIL — "Cannot find module '../generateSecurityEvents'"

- [ ] **Step 3: Create `src/mock/generators/generateSecurityEvents.ts`**

```typescript
import type { Rng } from '../seed'
import type { AgentTask, SecurityEvent, SecurityEventType, Severity, Team } from '../../types'

const EVENT_TYPES: SecurityEventType[] = ['policy_block', 'secret_detected', 'human_approval_required']

export function generateSecurityEvents(rng: Rng, tasks: AgentTask[], _teams: Team[]): SecurityEvent[] {
  const events: SecurityEvent[] = []
  let idCounter = 1

  const now = new Date('2026-06-27T00:00:00Z').getTime()
  const day60Start = now - 30 * 86400000

  for (const task of tasks) {
    if (!rng.nextBool(0.12)) continue

    const type = rng.pick(EVENT_TYPES)
    const taskTime = new Date(task.startedAt).getTime()
    const isNearSpike = Math.abs(taskTime - day60Start) < 86400000 * 3
    const severity: Severity = isNearSpike && type === 'policy_block'
      ? 'critical'
      : rng.nextBool(0.15)
      ? 'critical'
      : rng.nextBool(0.4)
      ? 'warning'
      : 'info'

    events.push({
      id: `sec-event-${idCounter++}`,
      taskId: task.id,
      repoId: task.repoId,
      teamId: task.teamId,
      severity,
      type,
      createdAt: task.startedAt,
    })
  }

  return events
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test:run src/mock/generators/__tests__/generateSecurityEvents.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/mock/generators/generateSecurityEvents.ts src/mock/generators/__tests__/generateSecurityEvents.test.ts
git commit -m "feat: add security events generator with injected critical spike"
```

---

### Task 6: Mock API

**Files:**
- Create: `src/mock/api.ts`
- Create: `src/mock/__tests__/api.test.ts`

**Interfaces:**
- Consumes: all generators, `classifyAutonomy`, `percentile`, `computeTrend`, `isoDate` from utils
- Produces: all API functions listed below (each returns `Promise<T>` with 100–200ms delay)

Functions to implement:
```typescript
getOrgOverview(period: Period): Promise<OrgOverview>
getOutcomesMetrics(period: Period): Promise<OutcomesMetrics>
getCostMetrics(period: Period): Promise<CostMetrics>
getReliabilityMetrics(period: Period): Promise<ReliabilityMetrics>
getGovernanceMetrics(period: Period): Promise<GovernanceMetrics>
getTeamDetail(teamId: string, period: Period): Promise<TeamDetail>
getRepoDetail(repoId: string, period: Period): Promise<RepoDetail>
getTaskList(filters: TaskFilters): Promise<AgentTask[]>
getTaskSpans(taskId: string): Promise<TraceSpan[]>
getSecurityEvents(period: Period): Promise<SecurityEvent[]>
```

- [ ] **Step 1: Write the failing tests at `src/mock/__tests__/api.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import {
  getOrgOverview,
  getOutcomesMetrics,
  getCostMetrics,
  getReliabilityMetrics,
  getGovernanceMetrics,
  getTaskList,
  getTaskSpans,
  getSecurityEvents,
} from '../api'

describe('mock API', () => {
  it('getOrgOverview returns shorter time series for 7d than 90d', async () => {
    const [short, long] = await Promise.all([getOrgOverview('7d'), getOrgOverview('90d')])
    expect(short.tasksOverTime.length).toBeLessThan(long.tasksOverTime.length)
  })

  it('getOrgOverview autonomy breakdown sums to ~1', async () => {
    const data = await getOrgOverview('30d')
    const total = Object.values(data.autonomyBreakdown).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 1)
  })

  it('getOrgOverview returns 5 KPI cards', async () => {
    const data = await getOrgOverview('30d')
    expect(Object.keys(data.kpis)).toHaveLength(5)
  })

  it('getOrgOverview includes alerts array', async () => {
    const data = await getOrgOverview('30d')
    expect(Array.isArray(data.alerts)).toBe(true)
  })

  it('getTaskList with status=failed returns only failed tasks', async () => {
    const tasks = await getTaskList({ period: '30d', status: 'failed' })
    tasks.forEach(t => expect(t.status).toBe('failed'))
  })

  it('getTaskList returns fewer tasks for 7d than 90d', async () => {
    const [short, long] = await Promise.all([
      getTaskList({ period: '7d' }),
      getTaskList({ period: '90d' }),
    ])
    expect(short.length).toBeLessThan(long.length)
  })

  it('getTaskSpans returns only spans for the given taskId', async () => {
    const tasks = await getTaskList({ period: '7d' })
    const taskId = tasks[0].id
    const spans = await getTaskSpans(taskId)
    spans.forEach(s => expect(s.taskId).toBe(taskId))
    expect(spans.length).toBeGreaterThan(0)
  })

  it('all API functions resolve (never reject) on valid input', async () => {
    await expect(getOrgOverview('30d')).resolves.toBeDefined()
    await expect(getOutcomesMetrics('30d')).resolves.toBeDefined()
    await expect(getCostMetrics('30d')).resolves.toBeDefined()
    await expect(getReliabilityMetrics('30d')).resolves.toBeDefined()
    await expect(getGovernanceMetrics('30d')).resolves.toBeDefined()
    await expect(getSecurityEvents('30d')).resolves.toBeDefined()
  })

  it('simulated delay is between 100 and 300ms', async () => {
    const start = performance.now()
    await getOrgOverview('7d')
    const elapsed = performance.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(90)
    expect(elapsed).toBeLessThan(500)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/mock/__tests__/api.test.ts
```

Expected: FAIL — "Cannot find module '../api'"

- [ ] **Step 3: Create `src/mock/api.ts`**

```typescript
import type {
  AgentTask, Alert, CostMetrics, GovernanceMetrics, OrgOverview,
  OutcomesMetrics, Period, PullRequestOutcome, ReliabilityMetrics,
  Repo, RepoDetail, SecurityEvent, TaskFilters, Team, TeamDetail,
  TeamMetrics, TrendPoint, TraceSpan, User, ErrorCategory,
} from '../types'
import { createRng } from './seed'
import { generateTeams } from './generators/generateTeams'
import { generateRepos } from './generators/generateRepos'
import { generateUsers } from './generators/generateUsers'
import { generateTasks } from './generators/generateTasks'
import { generateSpans } from './generators/generateSpans'
import { generatePROutcomes } from './generators/generatePROutcomes'
import { generateSecurityEvents } from './generators/generateSecurityEvents'
import { classifyAutonomy, computeTrend, isoDate, percentile } from '../lib/utils'

// --- Generate all data once at module level ---
const rng = createRng(42)
const TEAMS = generateTeams(rng)
const REPOS = generateRepos(rng, TEAMS)
const USERS = generateUsers(rng, TEAMS)
const TASKS = generateTasks(rng, TEAMS, REPOS, USERS)
const SPANS = generateSpans(rng, TASKS)
const PR_OUTCOMES = generatePROutcomes(rng, TASKS, REPOS)
const SECURITY_EVENTS = generateSecurityEvents(rng, TASKS, TEAMS)

const PR_MAP = new Map(PR_OUTCOMES.map(p => [p.taskId, p]))
const SPAN_MAP = new Map<string, TraceSpan[]>()
for (const span of SPANS) {
  const list = SPAN_MAP.get(span.taskId) ?? []
  list.push(span)
  SPAN_MAP.set(span.taskId, list)
}

// Assign autonomy bands to terminal tasks
for (const task of TASKS) {
  const pr = PR_MAP.get(task.id)
  if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
    task.autonomyBand = classifyAutonomy({
      status: task.status,
      prMerged: pr?.status === 'merged',
      editDistancePct: pr?.humanEditDistancePct ?? 0,
      prReverted: pr?.status === 'reverted',
      humanInterventionRequired: task.humanInterventionRequired,
    })
  }
}

const MONTHLY_BUDGET_USD = 50_000

// --- Helpers ---
function delay(): Promise<void> {
  return new Promise(r => setTimeout(r, 100 + Math.random() * 100))
}

function periodDays(period: Period): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

function cutoffMs(period: Period): number {
  const now = new Date('2026-06-27T00:00:00Z').getTime()
  return now - periodDays(period) * 86400000
}

function prevCutoffMs(period: Period): number {
  const days = periodDays(period)
  return cutoffMs(period) - days * 86400000
}

function filterTasks(period: Period, teamId?: string, model?: string) {
  const cut = cutoffMs(period)
  return TASKS.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    if (ts < cut) return false
    if (teamId && t.teamId !== teamId) return false
    if (model && t.model !== model) return false
    return true
  })
}

function filterPrev(period: Period, teamId?: string, model?: string) {
  const cut = cutoffMs(period)
  const prevCut = prevCutoffMs(period)
  return TASKS.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    return ts >= prevCut && ts < cut && (!teamId || t.teamId === teamId) && (!model || t.model === model)
  })
}

function terminalTasks(tasks: AgentTask[]) {
  return tasks.filter(t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled')
}

function autonomyRate(tasks: AgentTask[]): number {
  const terminal = terminalTasks(tasks)
  if (terminal.length === 0) return 0
  const autonomous = terminal.filter(t => t.autonomyBand === 'autonomous').length
  return autonomous / terminal.length
}

function buildSparkline(tasks: AgentTask[], days: number, metric: (dayTasks: AgentTask[]) => number): TrendPoint[] {
  const now = new Date('2026-06-27T00:00:00Z').getTime()
  return Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTasks = tasks.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    return { date: isoDate(new Date(dayStart)), value: metric(dayTasks) }
  })
}

function computeTeamMetrics(team: Team, tasks: AgentTask[], prMap: Map<string, PullRequestOutcome>): TeamMetrics {
  const teamTasks = tasks.filter(t => t.teamId === team.id)
  const mergedPrs = teamTasks.filter(t => prMap.get(t.id)?.status === 'merged')
  const wastedTokensTasks = teamTasks.filter(t =>
    (t.status === 'failed' || t.status === 'cancelled' || prMap.get(t.id)?.status === 'reverted') &&
    prMap.get(t.id)?.status !== 'merged'
  )
  const totalTokens = teamTasks.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const wastedTokens = wastedTokensTasks.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const totalSpend = teamTasks.reduce((s, t) => s + t.costUsd, 0)
  const mergedPrSpend = mergedPrs.reduce((s, t) => s + t.costUsd, 0)

  return {
    teamId: team.id,
    teamName: team.name,
    taskCount: teamTasks.length,
    autonomyRate: autonomyRate(teamTasks),
    spendUsd: totalSpend,
    costPerTask: teamTasks.length > 0 ? totalSpend / teamTasks.length : 0,
    costPerMergedPr: mergedPrs.length > 0 ? mergedPrSpend / mergedPrs.length : 0,
    tokenWastePct: totalTokens > 0 ? wastedTokens / totalTokens : 0,
  }
}

// --- API functions ---

export async function getOrgOverview(period: Period): Promise<OrgOverview> {
  await delay()
  const tasks = filterTasks(period)
  const prevTasks = filterPrev(period)
  const terminal = terminalTasks(tasks)
  const prevTerminal = terminalTasks(prevTasks)
  const days = periodDays(period)
  const now = new Date('2026-06-27T00:00:00Z').getTime()

  const bandCounts = { autonomous: 0, human_assisted: 0, human_rescued: 0, failed: 0 }
  for (const t of terminal) if (t.autonomyBand) bandCounts[t.autonomyBand]++
  const totalTerminal = terminal.length || 1
  const autonomyBreakdown = {
    autonomous: bandCounts.autonomous / totalTerminal,
    human_assisted: bandCounts.human_assisted / totalTerminal,
    human_rescued: bandCounts.human_rescued / totalTerminal,
    failed: bandCounts.failed / totalTerminal,
  }

  const activeUsers = new Set(tasks.map(t => t.userId)).size
  const prevActiveUsers = new Set(prevTasks.map(t => t.userId)).size
  const mergedPrs = tasks.filter(t => PR_MAP.get(t.id)?.status === 'merged')
  const prevMergedPrs = prevTasks.filter(t => PR_MAP.get(t.id)?.status === 'merged')
  const totalSpend = tasks.reduce((s, t) => s + t.costUsd, 0)
  const prevTotalSpend = prevTasks.reduce((s, t) => s + t.costUsd, 0)
  const costPerMergedPr = mergedPrs.length > 0 ? totalSpend / mergedPrs.length : 0
  const prevCostPerMergedPr = prevMergedPrs.length > 0 ? prevTotalSpend / prevMergedPrs.length : 0

  const timeToPrMs = mergedPrs
    .map(t => {
      const pr = PR_MAP.get(t.id)
      return pr?.mergedAt ? new Date(pr.mergedAt).getTime() - new Date(t.startedAt).getTime() : null
    })
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  const medianTimeToPr = percentile(timeToPrMs, 50)

  const prevTimeToPrMs = prevMergedPrs
    .map(t => {
      const pr = PR_MAP.get(t.id)
      return pr?.mergedAt ? new Date(pr.mergedAt).getTime() - new Date(t.startedAt).getTime() : null
    })
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  const prevMedianTimeToPr = percentile(prevTimeToPrMs, 50)

  const curAutonomyRate = autonomyRate(tasks)
  const prevAutonomyRate = autonomyRate(prevTasks)

  const tasksOverTime = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTerminal = terminal.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    const dayTotal = dayTerminal.length || 1
    return {
      date: isoDate(new Date(dayStart)),
      autonomous: dayTerminal.filter(t => t.autonomyBand === 'autonomous').length / dayTotal,
      human_assisted: dayTerminal.filter(t => t.autonomyBand === 'human_assisted').length / dayTotal,
      human_rescued: dayTerminal.filter(t => t.autonomyBand === 'human_rescued').length / dayTotal,
      failed: dayTerminal.filter(t => t.autonomyBand === 'failed').length / dayTotal,
    }
  })

  const teamScatter = TEAMS.map(team => computeTeamMetrics(team, tasks, PR_MAP))

  const criticalSecEvents = SECURITY_EVENTS.filter(e => {
    const ts = new Date(e.createdAt).getTime()
    return ts >= cutoffMs(period) && e.severity === 'critical'
  })
  const costSpikeDay = now - 30 * 86400000
  const dayTasks = tasks.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    return ts >= costSpikeDay && ts < costSpikeDay + 86400000
  })
  const daySpend = dayTasks.reduce((s, t) => s + t.costUsd, 0)
  const avgDailySpend = totalSpend / days
  const hasCostSpike = daySpend > avgDailySpend * 2

  const alerts: Alert[] = [
    ...criticalSecEvents.slice(0, 5).map(e => ({
      id: `alert-sec-${e.id}`,
      severity: e.severity,
      source: 'security_event' as const,
      type: e.type,
      message: `Security event: ${e.type.replace(/_/g, ' ')} detected`,
      refId: e.id,
      createdAt: e.createdAt,
    })),
    ...(hasCostSpike ? [{
      id: 'alert-cost-spike',
      severity: 'warning' as const,
      source: 'cost_anomaly' as const,
      type: 'cost_spike' as const,
      message: `Cost spike detected: $${daySpend.toFixed(0)} on ${isoDate(new Date(costSpikeDay))} (${((daySpend / avgDailySpend) * 100).toFixed(0)}% of daily avg)`,
      refId: 'cost-spike-day60',
      createdAt: new Date(costSpikeDay).toISOString(),
    }] : []),
  ]

  return {
    autonomyBreakdown,
    kpis: {
      tasksStarted: {
        value: tasks.length,
        trendPct: computeTrend(tasks.length, prevTasks.length),
        sparkline: buildSparkline(tasks, Math.min(days, 30), dt => dt.length),
      },
      autonomyRate: {
        value: curAutonomyRate,
        trendPct: computeTrend(curAutonomyRate, prevAutonomyRate),
        sparkline: buildSparkline(tasks, Math.min(days, 30), dt => autonomyRate(dt)),
      },
      costPerMergedPr: {
        value: costPerMergedPr,
        trendPct: computeTrend(costPerMergedPr, prevCostPerMergedPr),
        sparkline: buildSparkline(mergedPrs, Math.min(days, 30), dt => dt.reduce((s, t) => s + t.costUsd, 0)),
      },
      medianTimeToPr: {
        value: medianTimeToPr,
        trendPct: computeTrend(medianTimeToPr, prevMedianTimeToPr),
        sparkline: buildSparkline(tasks, Math.min(days, 30), () => 0),
      },
      activeUsers: {
        value: activeUsers,
        trendPct: computeTrend(activeUsers, prevActiveUsers),
        sparkline: buildSparkline(tasks, Math.min(days, 30), dt => new Set(dt.map(t => t.userId)).size),
      },
    },
    tasksOverTime,
    teamScatter,
    alerts,
  }
}

export async function getOutcomesMetrics(period: Period): Promise<OutcomesMetrics> {
  await delay()
  const tasks = filterTasks(period)
  const prevTasks = filterPrev(period)
  const days = periodDays(period)
  const now = new Date('2026-06-27T00:00:00Z').getTime()

  const prs = tasks.map(t => PR_MAP.get(t.id)).filter((p): p is PullRequestOutcome => !!p)
  const prevPrs = prevTasks.map(t => PR_MAP.get(t.id)).filter((p): p is PullRequestOutcome => !!p)
  const mergedPrs = prs.filter(p => p.status === 'merged')
  const prevMergedPrs = prevPrs.filter(p => p.status === 'merged')

  const mergeRate = prs.length > 0 ? mergedPrs.length / prs.length : 0
  const prevMergeRate = prevPrs.length > 0 ? prevMergedPrs.length / prevPrs.length : 0
  const avgEditDist = mergedPrs.length > 0
    ? mergedPrs.reduce((s, p) => s + p.humanEditDistancePct, 0) / mergedPrs.length
    : 0
  const prevAvgEditDist = prevMergedPrs.length > 0
    ? prevMergedPrs.reduce((s, p) => s + p.humanEditDistancePct, 0) / prevMergedPrs.length
    : 0
  const ciPassRate = prs.length > 0 ? prs.filter(p => p.ciFirstAttemptPassed).length / prs.length : 0
  const prevCiPassRate = prevPrs.length > 0 ? prevPrs.filter(p => p.ciFirstAttemptPassed).length / prevPrs.length : 0
  const revertRate = mergedPrs.length > 0 ? prs.filter(p => p.status === 'reverted').length / mergedPrs.length : 0
  const prevRevertRate = prevMergedPrs.length > 0
    ? prevPrs.filter(p => p.status === 'reverted').length / prevMergedPrs.length
    : 0

  const editDistanceTrend = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayPrs = mergedPrs.filter(p => {
      const ts = new Date(p.openedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    return {
      date: isoDate(new Date(dayStart)),
      value: dayPrs.length > 0 ? dayPrs.reduce((s, p) => s + p.humanEditDistancePct, 0) / dayPrs.length : 0,
    }
  })

  const reviewCommentsTrend = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayPrs = mergedPrs.filter(p => {
      const ts = new Date(p.openedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    return {
      date: isoDate(new Date(dayStart)),
      value: dayPrs.length > 0 ? dayPrs.reduce((s, p) => s + p.reviewComments, 0) / dayPrs.length : 0,
    }
  })

  const taskTypes = ['bug_fix', 'feature', 'tests', 'docs', 'refactor', 'dependency_update'] as const
  const outcomeByTaskType = taskTypes.map(taskType => {
    const typeTasks = terminalTasks(tasks.filter(t => t.taskType === taskType))
    const total = typeTasks.length || 1
    return {
      taskType,
      autonomous: typeTasks.filter(t => t.autonomyBand === 'autonomous').length / total,
      human_assisted: typeTasks.filter(t => t.autonomyBand === 'human_assisted').length / total,
      human_rescued: typeTasks.filter(t => t.autonomyBand === 'human_rescued').length / total,
      failed: typeTasks.filter(t => t.autonomyBand === 'failed').length / total,
    }
  })

  const repoTaskTypes = REPOS.map(repo => {
    const repoPrs = prs.filter(p => p.repoId === repo.id)
    const repoMerged = repoPrs.filter(p => p.status === 'merged')
    return taskTypes.map(taskType => {
      const typePrs = repoPrs.filter(p => {
        const task = TASKS.find(t => t.id === p.taskId)
        return task?.taskType === taskType
      })
      const typeMerged = typePrs.filter(p => p.status === 'merged')
      return {
        repoId: repo.id,
        taskType,
        mergeRate: typePrs.length > 0 ? typeMerged.length / typePrs.length : 0,
        avgEditDistancePct:
          typeMerged.length > 0
            ? typeMerged.reduce((s, p) => s + p.humanEditDistancePct, 0) / typeMerged.length
            : 0,
        ciFirstAttemptPassRate:
          typePrs.length > 0 ? typePrs.filter(p => p.ciFirstAttemptPassed).length / typePrs.length : 0,
      }
    })
  }).flat().filter(r => r.mergeRate > 0 || r.avgEditDistancePct > 0)

  return {
    kpis: {
      mergeRate: { value: mergeRate, trendPct: computeTrend(mergeRate, prevMergeRate), sparkline: [] },
      humanEditDistancePct: { value: avgEditDist, trendPct: computeTrend(avgEditDist, prevAvgEditDist), sparkline: [] },
      ciFirstAttemptPassRate: { value: ciPassRate, trendPct: computeTrend(ciPassRate, prevCiPassRate), sparkline: [] },
      revertRate: { value: revertRate, trendPct: computeTrend(revertRate, prevRevertRate), sparkline: [] },
    },
    editDistanceTrend,
    outcomeByTaskType,
    reviewCommentsTrend,
    prOutcomes: repoTaskTypes,
  }
}

export async function getCostMetrics(period: Period): Promise<CostMetrics> {
  await delay()
  const tasks = filterTasks(period)
  const prevTasks = filterPrev(period)
  const days = periodDays(period)
  const now = new Date('2026-06-27T00:00:00Z').getTime()

  const totalSpend = tasks.reduce((s, t) => s + t.costUsd, 0)
  const prevSpend = prevTasks.reduce((s, t) => s + t.costUsd, 0)
  const mergedPrs = tasks.filter(t => PR_MAP.get(t.id)?.status === 'merged')
  const prevMergedPrs = prevTasks.filter(t => PR_MAP.get(t.id)?.status === 'merged')
  const costPerTask = tasks.length > 0 ? totalSpend / tasks.length : 0
  const prevCostPerTask = prevTasks.length > 0 ? prevSpend / prevTasks.length : 0
  const costPerMergedPr = mergedPrs.length > 0 ? totalSpend / mergedPrs.length : 0
  const prevCostPerMergedPr = prevMergedPrs.length > 0 ? prevSpend / prevMergedPrs.length : 0

  const wastedTasks = tasks.filter(t => {
    const pr = PR_MAP.get(t.id)
    return t.status === 'failed' || t.status === 'cancelled' || pr?.status === 'reverted' || (!pr && t.status !== 'completed')
  })
  const totalTokens = tasks.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const wastedTokens = wastedTasks.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const tokenWastePct = totalTokens > 0 ? wastedTokens / totalTokens : 0
  const prevWastedTasks = prevTasks.filter(t => {
    const pr = PR_MAP.get(t.id)
    return t.status === 'failed' || t.status === 'cancelled' || pr?.status === 'reverted'
  })
  const prevTotalTokens = prevTasks.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const prevWastedTokens = prevWastedTasks.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const prevTokenWastePct = prevTotalTokens > 0 ? prevWastedTokens / prevTotalTokens : 0

  const spendTrend = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    return {
      date: isoDate(new Date(dayStart)),
      value: tasks.filter(t => {
        const ts = new Date(t.startedAt).getTime()
        return ts >= dayStart && ts < dayEnd
      }).reduce((s, t) => s + t.costUsd, 0),
    }
  })

  const taskTypes = ['bug_fix', 'feature', 'tests', 'docs', 'refactor', 'dependency_update'] as const
  const costPerMergedPrByTaskType = taskTypes.map(taskType => {
    const typeMergedTasks = mergedPrs.filter(t => t.taskType === taskType)
    const typeSpend = typeMergedTasks.reduce((s, t) => s + t.costUsd, 0)
    return { taskType, costUsd: typeMergedTasks.length > 0 ? typeSpend / typeMergedTasks.length : 0 }
  })

  const teamBreakdown = TEAMS.map(team => computeTeamMetrics(team, tasks, PR_MAP))

  return {
    kpis: {
      totalSpend: { value: totalSpend, trendPct: computeTrend(totalSpend, prevSpend), sparkline: spendTrend.slice(-14) },
      costPerTask: { value: costPerTask, trendPct: computeTrend(costPerTask, prevCostPerTask), sparkline: [] },
      costPerMergedPr: { value: costPerMergedPr, trendPct: computeTrend(costPerMergedPr, prevCostPerMergedPr), sparkline: [] },
      tokenWastePct: { value: tokenWastePct, trendPct: computeTrend(tokenWastePct, prevTokenWastePct), sparkline: [] },
    },
    spendTrend,
    budgetBurnPct: totalSpend / MONTHLY_BUDGET_USD,
    costPerMergedPrByTaskType,
    teamBreakdown,
  }
}

export async function getReliabilityMetrics(period: Period): Promise<ReliabilityMetrics> {
  await delay()
  const tasks = filterTasks(period)
  const prevTasks = filterPrev(period)
  const days = periodDays(period)
  const now = new Date('2026-06-27T00:00:00Z').getTime()

  const taskSpans = tasks.map(t => SPAN_MAP.get(t.id) ?? []).flat()
  const prevTaskSpans = prevTasks.map(t => SPAN_MAP.get(t.id) ?? []).flat()

  const durations = tasks
    .filter(t => t.completedAt)
    .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
    .sort((a, b) => a - b)
  const prevDurations = prevTasks
    .filter(t => t.completedAt)
    .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
    .sort((a, b) => a - b)

  const p95Duration = percentile(durations, 95)
  const prevP95Duration = percentile(prevDurations, 95)

  const errorSpans = taskSpans.filter(s => s.status === 'error' || s.status === 'timeout')
  const prevErrorSpans = prevTaskSpans.filter(s => s.status === 'error' || s.status === 'timeout')
  const toolFailureRate = taskSpans.length > 0 ? errorSpans.length / taskSpans.length : 0
  const prevToolFailureRate = prevTaskSpans.length > 0 ? prevErrorSpans.length / prevTaskSpans.length : 0

  const timeoutSpans = taskSpans.filter(s => s.status === 'timeout')
  const prevTimeoutSpans = prevTaskSpans.filter(s => s.status === 'timeout')
  const timeoutRate = taskSpans.length > 0 ? timeoutSpans.length / taskSpans.length : 0
  const prevTimeoutRate = prevTaskSpans.length > 0 ? prevTimeoutSpans.length / prevTaskSpans.length : 0

  const envSpans = taskSpans.filter(s => s.type === 'env_setup').map(s => s.durationMs).sort((a, b) => a - b)
  const prevEnvSpans = prevTaskSpans.filter(s => s.type === 'env_setup').map(s => s.durationMs).sort((a, b) => a - b)
  const envSetupP95 = percentile(envSpans, 95)
  const prevEnvSetupP95 = percentile(prevEnvSpans, 95)

  const durationTrend = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayDurations = tasks
      .filter(t => t.completedAt && new Date(t.startedAt).getTime() >= dayStart && new Date(t.startedAt).getTime() < dayEnd)
      .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
      .sort((a, b) => a - b)
    return {
      date: isoDate(new Date(dayStart)),
      p50: percentile(dayDurations, 50),
      p95: percentile(dayDurations, 95),
    }
  })

  const errorCategories: ErrorCategory[] = ['tool_error', 'timeout', 'env_setup', 'policy_block', 'model_error', 'test_failure']
  const errorRateByCategory = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const daySpans = taskSpans.filter(s => {
      const ts = new Date(s.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    const total = daySpans.length || 1
    const entry: Record<string, unknown> = { date: isoDate(new Date(dayStart)) }
    for (const cat of errorCategories) {
      entry[cat] = daySpans.filter(s => s.errorCategory === cat).length / total
    }
    return entry as { date: string } & Record<ErrorCategory, number>
  })

  const spanTypes = ['model_call', 'shell_command', 'git_operation', 'test_run', 'policy_check', 'env_setup'] as const
  const toolPerformance = spanTypes.map(tool => {
    const toolSpans = taskSpans.filter(s => s.type === tool)
    const latencies = toolSpans.map(s => s.durationMs).sort((a, b) => a - b)
    const errors = toolSpans.filter(s => s.status === 'error' || s.status === 'timeout')
    return {
      tool,
      callCount: toolSpans.length,
      errorRate: toolSpans.length > 0 ? errors.length / toolSpans.length : 0,
      p50LatencyMs: percentile(latencies, 50),
      p95LatencyMs: percentile(latencies, 95),
    }
  })

  return {
    kpis: {
      p95TaskDurationMs: { value: p95Duration, trendPct: computeTrend(p95Duration, prevP95Duration), sparkline: [] },
      toolFailureRate: { value: toolFailureRate, trendPct: computeTrend(toolFailureRate, prevToolFailureRate), sparkline: [] },
      timeoutRate: { value: timeoutRate, trendPct: computeTrend(timeoutRate, prevTimeoutRate), sparkline: [] },
      envSetupP95Ms: { value: envSetupP95, trendPct: computeTrend(envSetupP95, prevEnvSetupP95), sparkline: [] },
    },
    durationTrend,
    errorRateByCategory,
    toolPerformance,
  }
}

export async function getGovernanceMetrics(period: Period): Promise<GovernanceMetrics> {
  await delay()
  const cut = cutoffMs(period)
  const prevCut = prevCutoffMs(period)
  const days = periodDays(period)
  const now = new Date('2026-06-27T00:00:00Z').getTime()

  const events = SECURITY_EVENTS.filter(e => new Date(e.createdAt).getTime() >= cut)
  const prevEvents = SECURITY_EVENTS.filter(e => {
    const ts = new Date(e.createdAt).getTime()
    return ts >= prevCut && ts < cut
  })

  const policyBlocks = events.filter(e => e.type === 'policy_block').length
  const prevPolicyBlocks = prevEvents.filter(e => e.type === 'policy_block').length
  const secretsDetected = events.filter(e => e.type === 'secret_detected').length
  const prevSecretsDetected = prevEvents.filter(e => e.type === 'secret_detected').length
  const humanApprovalsRequired = events.filter(e => e.type === 'human_approval_required').length
  const prevHumanApprovalsRequired = prevEvents.filter(e => e.type === 'human_approval_required').length

  const eventsOverTime = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayEvents = events.filter(e => {
      const ts = new Date(e.createdAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    return {
      date: isoDate(new Date(dayStart)),
      policy_block: dayEvents.filter(e => e.type === 'policy_block').length,
      secret_detected: dayEvents.filter(e => e.type === 'secret_detected').length,
      human_approval_required: dayEvents.filter(e => e.type === 'human_approval_required').length,
    }
  })

  return {
    kpis: {
      policyBlocks: { value: policyBlocks, trendPct: computeTrend(policyBlocks, prevPolicyBlocks), sparkline: [] },
      secretsDetected: { value: secretsDetected, trendPct: computeTrend(secretsDetected, prevSecretsDetected), sparkline: [] },
      humanApprovalsRequired: { value: humanApprovalsRequired, trendPct: computeTrend(humanApprovalsRequired, prevHumanApprovalsRequired), sparkline: [] },
    },
    eventsOverTime,
    events,
  }
}

export async function getTeamDetail(teamId: string, period: Period): Promise<TeamDetail> {
  await delay()
  const team = TEAMS.find(t => t.id === teamId)
  if (!team) throw new Error(`Team not found: ${teamId}`)
  const tasks = filterTasks(period, teamId)
  const members = USERS.filter(u => u.teamId === teamId)
  const mergedPrs = tasks.filter(t => PR_MAP.get(t.id)?.status === 'merged')
  const totalSpend = tasks.reduce((s, t) => s + t.costUsd, 0)
  const prs = tasks.map(t => PR_MAP.get(t.id)).filter((p): p is PullRequestOutcome => !!p)

  const secEvents = SECURITY_EVENTS.filter(e => {
    return e.teamId === teamId && new Date(e.createdAt).getTime() >= cutoffMs(period)
  })

  return {
    team,
    autonomyRate: autonomyRate(tasks),
    taskCount: tasks.length,
    spendUsd: totalSpend,
    sections: {
      outcomes: [
        { value: prs.length > 0 ? mergedPrs.length / prs.length : 0, trendPct: null, sparkline: [] },
        { value: prs.filter(p => p.ciFirstAttemptPassed).length / (prs.length || 1), trendPct: null, sparkline: [] },
      ],
      cost: [
        { value: totalSpend, trendPct: null, sparkline: [] },
        { value: tasks.length > 0 ? totalSpend / tasks.length : 0, trendPct: null, sparkline: [] },
      ],
      reliability: [
        {
          value: percentile(
            tasks
              .filter(t => t.completedAt)
              .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
              .sort((a, b) => a - b),
            95,
          ),
          trendPct: null,
          sparkline: [],
        },
        { value: tasks.reduce((s, t) => s + t.failedToolCallCount, 0) / (tasks.reduce((s, t) => s + t.toolCallCount, 0) || 1), trendPct: null, sparkline: [] },
      ],
      governance: [
        { value: secEvents.filter(e => e.type === 'policy_block').length, trendPct: null, sparkline: [] },
        { value: secEvents.filter(e => e.type === 'secret_detected').length, trendPct: null, sparkline: [] },
      ],
    },
    members,
  }
}

export async function getRepoDetail(repoId: string, period: Period): Promise<RepoDetail> {
  await delay()
  const repo = REPOS.find(r => r.id === repoId)
  if (!repo) throw new Error(`Repo not found: ${repoId}`)
  const tasks = TASKS.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    return t.repoId === repoId && ts >= cutoffMs(period)
  })
  const mergedPrs = tasks.filter(t => PR_MAP.get(t.id)?.status === 'merged')
  const prs = tasks.map(t => PR_MAP.get(t.id)).filter((p): p is PullRequestOutcome => !!p)
  const totalSpend = tasks.reduce((s, t) => s + t.costUsd, 0)
  const secEvents = SECURITY_EVENTS.filter(e => {
    return e.repoId === repoId && new Date(e.createdAt).getTime() >= cutoffMs(period)
  })

  return {
    repo,
    autonomyRate: autonomyRate(tasks),
    taskCount: tasks.length,
    spendUsd: totalSpend,
    sections: {
      outcomes: [
        { value: prs.length > 0 ? mergedPrs.length / prs.length : 0, trendPct: null, sparkline: [] },
        { value: prs.filter(p => p.ciFirstAttemptPassed).length / (prs.length || 1), trendPct: null, sparkline: [] },
      ],
      cost: [
        { value: totalSpend, trendPct: null, sparkline: [] },
        { value: tasks.length > 0 ? totalSpend / tasks.length : 0, trendPct: null, sparkline: [] },
      ],
      reliability: [
        {
          value: percentile(
            tasks
              .filter(t => t.completedAt)
              .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
              .sort((a, b) => a - b),
            95,
          ),
          trendPct: null,
          sparkline: [],
        },
        { value: tasks.reduce((s, t) => s + t.failedToolCallCount, 0) / (tasks.reduce((s, t) => s + t.toolCallCount, 0) || 1), trendPct: null, sparkline: [] },
      ],
      governance: [
        { value: secEvents.filter(e => e.type === 'policy_block').length, trendPct: null, sparkline: [] },
        { value: secEvents.filter(e => e.type === 'secret_detected').length, trendPct: null, sparkline: [] },
      ],
    },
  }
}

export async function getTaskList(filters: TaskFilters): Promise<AgentTask[]> {
  await delay()
  const cut = cutoffMs(filters.period)
  return TASKS.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    if (ts < cut) return false
    if (filters.teamId && t.teamId !== filters.teamId) return false
    if (filters.model && t.model !== filters.model) return false
    if (filters.status && t.status !== filters.status) return false
    return true
  })
}

export async function getTaskSpans(taskId: string): Promise<TraceSpan[]> {
  await delay()
  return SPAN_MAP.get(taskId) ?? []
}

export async function getSecurityEvents(period: Period): Promise<SecurityEvent[]> {
  await delay()
  const cut = cutoffMs(period)
  return SECURITY_EVENTS.filter(e => new Date(e.createdAt).getTime() >= cut)
}
```

- [ ] **Step 4: Run the API tests**

```bash
pnpm test:run src/mock/__tests__/api.test.ts
```

Expected: PASS — all API tests green. If any test times out, increase the timeout in the test or reduce delay range.

- [ ] **Step 5: Run all mock tests to confirm nothing broke**

```bash
pnpm test:run src/mock/
```

Expected: all PASS

- [ ] **Step 6: Check coverage on mock/**

```bash
pnpm test:coverage -- src/mock/
```

Expected: ≥90% line coverage on `src/mock/api.ts`; 100% on generators

- [ ] **Step 7: Commit**

```bash
git add src/mock/api.ts src/mock/__tests__/api.test.ts
git commit -m "feat: add mock API with pre-generated seeded data, all 10 endpoints"
```

---

## Stage 2 Complete

At this point you have:
- 7 deterministic data generators for all entity types
- A fully functional mock API with 10 endpoints returning realistic aggregated data
- All data generated from seed=42 — same output on every run and in CI
- 100% test coverage on all generators

**Next:** Stage 3 — Auth, FilterContext, and the AppShell layout
