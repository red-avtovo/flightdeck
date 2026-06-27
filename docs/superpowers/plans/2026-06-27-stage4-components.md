# Stage 4: UI Components — Cards, Charts, Tables, Overlays

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build every reusable UI component that the dashboard pages consume — KpiCard, AlertBadge, BudgetGauge, chart wrappers, all table components, and the SpanDrawer overlay. Each component has unit tests; accessibility requirements are enforced in Stage 6 via Storybook.

**Architecture:** All charts use Recharts inside `<ResponsiveContainer>`. Charts use the fixed autonomy-band palette for band series and the 8-color rotation for other multi-series. Tables are sortable by clicking column headers. SpanDrawer is a slide-over panel using a portal + Tailwind transitions + Escape-to-close.

**Tech Stack:** React 18, Tailwind CSS, Recharts, Lucide React, `src/types/index.ts`, `src/lib/utils.ts`

## Prerequisites

Stages 1–3 complete. `src/types/index.ts`, `src/lib/utils.ts`, and `src/hooks/useMockData.ts` exist.

---

## File Map

| File | Purpose |
|------|---------|
| `src/components/charts/SparklineChart.tsx` | Inline SVG sparkline — no axes, no tooltip |
| `src/components/cards/KpiCard.tsx` | Metric card — value, trend badge, sparkline, tooltip |
| `src/components/cards/AlertBadge.tsx` | Severity badge — critical / warning / info |
| `src/components/charts/BudgetGauge.tsx` | SVG radial arc — turns red > 90% |
| `src/components/charts/AutonomyBar.tsx` | Full-width segmented bar — 4 autonomy bands |
| `src/components/charts/LineChart.tsx` | Reusable Recharts line chart wrapper |
| `src/components/charts/AreaChart.tsx` | Reusable Recharts area chart wrapper |
| `src/components/charts/StackedAreaChart.tsx` | Stacked area — 4 series |
| `src/components/charts/BarChart.tsx` | Vertical + horizontal bar chart wrapper |
| `src/components/charts/ScatterChart.tsx` | Team scatter with org median reference lines |
| `src/components/tables/TeamTable.tsx` | Sortable team cost breakdown table |
| `src/components/tables/OutcomeTable.tsx` | Sortable PR outcomes by repo + task type |
| `src/components/tables/ToolTable.tsx` | Tool performance table |
| `src/components/tables/TaskList.tsx` | Recent tasks list, filterable by status |
| `src/components/tables/EventLog.tsx` | Security event log, filterable by type |
| `src/components/overlays/SpanDrawer.tsx` | Slide-over span list — Escape + backdrop closes |
| `src/components/ui/EmptyState.tsx` | Shared empty-state placeholder |
| `src/components/ui/Skeleton.tsx` | Shared loading skeleton block |

---

### Task 1: SparklineChart + KpiCard

**Files:**
- Create: `src/components/charts/SparklineChart.tsx`
- Create: `src/components/cards/KpiCard.tsx`
- Create: `src/components/cards/__tests__/KpiCard.test.tsx`

**Interfaces:**
- `SparklineChart`: `{ data: TrendPoint[]; className?: string }`
- `KpiCard`: `{ title: string; value: number; format: 'number'|'percent'|'currency'|'duration'; trend: number|null; sparkline?: TrendPoint[]; tooltip?: string; loading?: boolean }`

- [ ] **Step 1: Write the failing test at `src/components/cards/__tests__/KpiCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '../KpiCard'

describe('KpiCard', () => {
  it('renders formatted percent value', () => {
    render(<KpiCard title="Autonomy Rate" value={0.421} format="percent" trend={3.2} />)
    expect(screen.getByText('42.1%')).toBeInTheDocument()
  })

  it('renders formatted currency value', () => {
    render(<KpiCard title="Total Spend" value={1234.5} format="currency" trend={null} />)
    expect(screen.getByText(/\$1,234\.50/)).toBeInTheDocument()
  })

  it('shows positive trend in emerald', () => {
    render(<KpiCard title="Test" value={100} format="number" trend={5.5} />)
    const badge = screen.getByText(/\+5\.5%/)
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/emerald|green/)
  })

  it('shows negative trend in rose', () => {
    render(<KpiCard title="Test" value={100} format="number" trend={-3.2} />)
    const badge = screen.getByText(/-3\.2%/)
    expect(badge.className).toMatch(/rose|red/)
  })

  it('renders without error when sparkline is empty', () => {
    expect(() =>
      render(<KpiCard title="Test" value={42} format="number" trend={null} sparkline={[]} />),
    ).not.toThrow()
  })

  it('shows loading skeleton when loading=true', () => {
    render(<KpiCard title="Test" value={0} format="number" trend={null} loading />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/components/cards/__tests__/KpiCard.test.tsx
```

Expected: FAIL — "Cannot find module '../KpiCard'"

- [ ] **Step 3: Create `src/components/charts/SparklineChart.tsx`**

```tsx
import type { TrendPoint } from '../../types'

interface SparklineChartProps {
  data: TrendPoint[]
  className?: string
}

export function SparklineChart({ data, className = '' }: SparklineChartProps) {
  if (data.length < 2) return <div className={`h-8 ${className}`} />

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 80
  const height = 32

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
```

- [ ] **Step 4: Create `src/components/cards/KpiCard.tsx`**

```tsx
import { SparklineChart } from '../charts/SparklineChart'
import { formatCurrency, formatDuration, formatNumber, formatPercent } from '../../lib/utils'
import type { TrendPoint } from '../../types'

interface KpiCardProps {
  title: string
  value: number
  format: 'number' | 'percent' | 'currency' | 'duration'
  trend: number | null
  sparkline?: TrendPoint[]
  tooltip?: string
  loading?: boolean
}

function formatValue(value: number, format: KpiCardProps['format']): string {
  switch (format) {
    case 'percent':  return formatPercent(value)
    case 'currency': return formatCurrency(value)
    case 'duration': return formatDuration(value)
    default:         return formatNumber(value)
  }
}

export function KpiCard({ title, value, format, trend, sparkline = [], tooltip, loading = false }: KpiCardProps) {
  if (loading) {
    return (
      <div
        className="rounded-lg bg-slate-800 border border-slate-700 p-4 space-y-3"
        role="status"
        aria-label={`Loading ${title}`}
      >
        <div className="h-3 w-24 rounded bg-slate-700 animate-pulse" />
        <div className="h-8 w-20 rounded bg-slate-700 animate-pulse" />
        <div className="h-2 w-16 rounded bg-slate-700 animate-pulse" />
      </div>
    )
  }

  const trendPositive = trend !== null && trend >= 0
  const trendColor = trendPositive ? 'text-emerald-400' : 'text-rose-400'

  return (
    <div
      className="rounded-lg bg-slate-800 border border-slate-700 p-4 flex flex-col gap-2"
      title={tooltip}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>

      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums text-slate-50 leading-none">
          {formatValue(value, format)}
        </p>
        {sparkline.length > 1 && (
          <SparklineChart data={sparkline} className="text-slate-500" />
        )}
      </div>

      {trend !== null && (
        <p className={`text-xs font-medium ${trendColor}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs prior period
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test:run src/components/cards/__tests__/KpiCard.test.tsx
```

Expected: PASS — 6 tests

- [ ] **Step 6: Commit**

```bash
git add src/components/charts/SparklineChart.tsx src/components/cards/KpiCard.tsx src/components/cards/__tests__/KpiCard.test.tsx
git commit -m "feat: add SparklineChart and KpiCard components"
```

---

### Task 2: AlertBadge + BudgetGauge

**Files:**
- Create: `src/components/cards/AlertBadge.tsx`
- Create: `src/components/charts/BudgetGauge.tsx`
- Create: `src/components/charts/__tests__/BudgetGauge.test.tsx`

**Interfaces:**
- `AlertBadge`: `{ severity: Severity; label: string }`
- `BudgetGauge`: `{ spentUsd: number; budgetUsd: number }`

- [ ] **Step 1: Write the failing test at `src/components/charts/__tests__/BudgetGauge.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetGauge } from '../BudgetGauge'

describe('BudgetGauge', () => {
  it('renders 75% when spent=7500 budget=10000', () => {
    render(<BudgetGauge spentUsd={7500} budgetUsd={10000} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('does not show danger class at 75%', () => {
    const { container } = render(<BudgetGauge spentUsd={7500} budgetUsd={10000} />)
    const arc = container.querySelector('[data-danger]')
    expect(arc).toBeNull()
  })

  it('renders 110% when over budget', () => {
    render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(screen.getByText('110%')).toBeInTheDocument()
  })

  it('shows danger class and "Over budget" text at 110%', () => {
    render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(screen.getByText('Over budget')).toBeInTheDocument()
    const { container } = render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(container.querySelector('[data-danger="true"]')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/components/charts/__tests__/BudgetGauge.test.tsx
```

Expected: FAIL — "Cannot find module '../BudgetGauge'"

- [ ] **Step 3: Create `src/components/cards/AlertBadge.tsx`**

```tsx
import type { Severity } from '../../types'

interface AlertBadgeProps {
  severity: Severity
  label: string
}

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  warning:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info:     'bg-sky-500/20 text-sky-400 border-sky-500/30',
}

export function AlertBadge({ severity, label }: AlertBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_STYLES[severity]}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Create `src/components/charts/BudgetGauge.tsx`**

```tsx
interface BudgetGaugeProps {
  spentUsd: number
  budgetUsd: number
}

export function BudgetGauge({ spentUsd, budgetUsd }: BudgetGaugeProps) {
  const pct = budgetUsd > 0 ? spentUsd / budgetUsd : 0
  const isDanger = pct > 0.9
  const displayPct = Math.round(pct * 100)

  const cx = 80
  const cy = 80
  const r = 64
  const strokeWidth = 12
  const circumference = Math.PI * r
  // Half-circle arc (top half)
  const filled = Math.min(pct, 1) * circumference

  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`Budget gauge: ${displayPct}% of budget used`}
    >
      <svg width={160} height={100} viewBox="0 0 160 100">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={isDanger ? '#f43f5e' : '#6366f1'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          data-danger={isDanger ? 'true' : undefined}
        />
      </svg>
      <div className="-mt-6 text-center">
        <p className={`text-3xl font-bold tabular-nums ${isDanger ? 'text-rose-400' : 'text-slate-50'}`}>
          {displayPct}%
        </p>
        {isDanger && (
          <p className="text-xs text-rose-400 font-medium mt-0.5">Over budget</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test:run src/components/charts/__tests__/BudgetGauge.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/AlertBadge.tsx src/components/charts/BudgetGauge.tsx src/components/charts/__tests__/BudgetGauge.test.tsx
git commit -m "feat: add AlertBadge and BudgetGauge components"
```

---

### Task 3: AutonomyBar + Chart Wrappers

**Files:**
- Create: `src/components/charts/AutonomyBar.tsx`
- Create: `src/components/charts/LineChart.tsx`
- Create: `src/components/charts/AreaChart.tsx`
- Create: `src/components/charts/StackedAreaChart.tsx`
- Create: `src/components/charts/BarChart.tsx`
- Create: `src/components/charts/ScatterChart.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/Skeleton.tsx`

**Interfaces:**
- `AutonomyBar`: `{ breakdown: Record<AutonomyBand, number>; onBandClick?: (band: AutonomyBand | null) => void; activeBand?: AutonomyBand | null }`
- Chart wrappers: each wraps Recharts in a `<ResponsiveContainer>`, accepts `data`, `series`, `height`, `className`

- [ ] **Step 1: Create `src/components/ui/EmptyState.tsx`**

```tsx
interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = 'No data available' }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px] text-slate-500 text-sm">
      {message}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/ui/Skeleton.tsx`**

```tsx
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800 ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
```

- [ ] **Step 3: Create `src/components/charts/AutonomyBar.tsx`**

```tsx
import type { AutonomyBand } from '../../types'

interface AutonomyBarProps {
  breakdown: Record<AutonomyBand, number>
  onBandClick?: (band: AutonomyBand | null) => void
  activeBand?: AutonomyBand | null
}

const BANDS: { key: AutonomyBand; label: string; color: string }[] = [
  { key: 'autonomous',    label: 'Autonomous',     color: 'bg-emerald-500' },
  { key: 'human_assisted',label: 'Human-assisted', color: 'bg-sky-500' },
  { key: 'human_rescued', label: 'Human-rescued',  color: 'bg-amber-500' },
  { key: 'failed',        label: 'Failed',         color: 'bg-rose-500' },
]

export function AutonomyBar({ breakdown, onBandClick, activeBand }: AutonomyBarProps) {
  return (
    <div
      role="img"
      aria-label={`Agent autonomy breakdown: ${Math.round(breakdown.autonomous * 100)}% autonomous`}
    >
      {/* Segmented bar */}
      <div className="flex w-full h-8 rounded-full overflow-hidden gap-0.5" role="group" aria-label="Autonomy segments">
        {BANDS.map(({ key, label, color }) => {
          const pct = (breakdown[key] * 100).toFixed(1)
          if (breakdown[key] === 0) return null
          return (
            <button
              key={key}
              className={`${color} transition-opacity ${activeBand && activeBand !== key ? 'opacity-40' : 'opacity-100'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              style={{ width: `${breakdown[key] * 100}%` }}
              onClick={() => onBandClick?.(activeBand === key ? null : key)}
              aria-label={`${label}: ${pct}%`}
              aria-pressed={activeBand === key}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {BANDS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5 text-sm text-slate-300">
            <span className={`w-3 h-3 rounded-sm ${color} inline-block`} aria-hidden />
            <span>{label}</span>
            <span className="font-semibold tabular-nums text-slate-50">
              {(breakdown[key] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/charts/LineChart.tsx`**

```tsx
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

interface Series {
  key: string
  label: string
  color: string
}

interface LineChartProps {
  data: Record<string, string | number>[]
  series: Series[]
  height?: number
  xKey?: string
  className?: string
  formatY?: (v: number) => string
}

const DEFAULT_TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f1f5f9',
}

export function LineChart({ data, series, height = 240, xKey = 'date', className = '', formatY }: LineChartProps) {
  if (data.length === 0) return <EmptyState />

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
          <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} formatter={formatY ? (v: number) => [formatY(v)] : undefined} />
          {series.length > 1 && <Legend />}
          {series.map(s => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/charts/AreaChart.tsx`**

```tsx
import {
  AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

interface AreaChartProps {
  data: Record<string, string | number>[]
  dataKey: string
  color?: string
  height?: number
  formatY?: (v: number) => string
}

export function AreaChart({ data, dataKey, color = '#6366f1', height = 240, formatY }: AreaChartProps) {
  if (data.length === 0) return <EmptyState />

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/components/charts/StackedAreaChart.tsx`**

```tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

interface Series {
  key: string
  label: string
  color: string
}

interface StackedAreaChartProps {
  data: Record<string, string | number>[]
  series: Series[]
  height?: number
}

export function StackedAreaChart({ data, series, height = 240 }: StackedAreaChartProps) {
  if (data.length === 0) return <EmptyState />

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
          <Legend />
          {series.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stackId="1" stroke={s.color} fill={s.color} fillOpacity={0.6} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 7: Create `src/components/charts/BarChart.tsx`**

```tsx
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

interface Series {
  key: string
  label: string
  color: string
}

interface BarChartProps {
  data: Record<string, string | number>[]
  series: Series[]
  height?: number
  layout?: 'vertical' | 'horizontal'
  xKey?: string
  formatY?: (v: number) => string
  stacked?: boolean
}

export function BarChart({ data, series, height = 240, layout = 'vertical', xKey = 'name', formatY, stacked = false }: BarChartProps) {
  if (data.length === 0) return <EmptyState />

  const isHorizontal = layout === 'horizontal'

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 4, bottom: 4, left: isHorizontal ? 80 : 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={!isHorizontal} vertical={isHorizontal} />
          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} tickFormatter={formatY} />
              <YAxis type="category" dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={76} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
            </>
          )}
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} formatter={formatY ? (v: number) => [formatY(v)] : undefined} />
          {series.length > 1 && <Legend />}
          {series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? 'stack' : undefined} radius={series.length === 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 8: Create `src/components/charts/ScatterChart.tsx`**

```tsx
import {
  ScatterChart as ReScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'
import type { TeamMetrics } from '../../types'
import { formatPercent } from '../../lib/utils'

interface ScatterChartProps {
  data: TeamMetrics[]
  height?: number
}

export function ScatterChart({ data, height = 300 }: ScatterChartProps) {
  if (data.length === 0) return <EmptyState />

  const orgMedianTasks = data.reduce((s, d) => s + d.taskCount, 0) / data.length
  const orgMedianAutonomy = data.reduce((s, d) => s + d.autonomyRate, 0) / data.length

  const plotData = data.map(d => ({
    x: d.taskCount,
    y: d.autonomyRate,
    name: d.teamName,
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            dataKey="x"
            name="Task Volume"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            label={{ value: 'Task Volume', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Autonomy Rate"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => formatPercent(v)}
            label={{ value: 'Autonomy Rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => name === 'y' ? [formatPercent(value as number), 'Autonomy Rate'] : [value, 'Task Volume']}
          />
          <ReferenceLine x={orgMedianTasks} stroke="#334155" strokeDasharray="4 4" />
          <ReferenceLine y={orgMedianAutonomy} stroke="#334155" strokeDasharray="4 4" />
          <Scatter data={plotData} fill="#6366f1" />
        </ReScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0

- [ ] **Step 10: Commit**

```bash
git add src/components/charts/AutonomyBar.tsx src/components/charts/LineChart.tsx src/components/charts/AreaChart.tsx src/components/charts/StackedAreaChart.tsx src/components/charts/BarChart.tsx src/components/charts/ScatterChart.tsx src/components/ui/EmptyState.tsx src/components/ui/Skeleton.tsx
git commit -m "feat: add AutonomyBar, chart wrappers (Line/Area/StackedArea/Bar/Scatter), EmptyState, Skeleton"
```

---

### Task 4: Table Components — TeamTable + OutcomeTable

**Files:**
- Create: `src/components/tables/TeamTable.tsx`
- Create: `src/components/tables/OutcomeTable.tsx`
- Create: `src/components/tables/__tests__/TeamTable.test.tsx`

**Interfaces:**
- `TeamTable`: `{ rows: TeamMetrics[]; loading?: boolean }`
- `OutcomeTable`: `{ rows: OutcomesMetrics['prOutcomes']; loading?: boolean }`

- [ ] **Step 1: Write the failing test at `src/components/tables/__tests__/TeamTable.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TeamTable } from '../TeamTable'
import type { TeamMetrics } from '../../../types'

const MOCK_ROWS: TeamMetrics[] = [
  { teamId: 'team-platform', teamName: 'Platform', taskCount: 300, autonomyRate: 0.42, spendUsd: 15000, costPerTask: 50, costPerMergedPr: 120, tokenWastePct: 0.08 },
  { teamId: 'team-product',  teamName: 'Product',  taskCount: 200, autonomyRate: 0.38, spendUsd: 9000,  costPerTask: 45, costPerMergedPr: 100, tokenWastePct: 0.10 },
  { teamId: 'team-mobile',   teamName: 'Mobile',   taskCount: 100, autonomyRate: 0.50, spendUsd: 5000,  costPerTask: 50, costPerMergedPr: 90,  tokenWastePct: 0.05 },
]

describe('TeamTable', () => {
  it('renders 3 data rows plus header row', () => {
    render(<MemoryRouter><TeamTable rows={MOCK_ROWS} /></MemoryRouter>)
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  it('each team name is a link with href containing teamId', () => {
    render(<MemoryRouter><TeamTable rows={MOCK_ROWS} /></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Platform' })
    expect(link).toHaveAttribute('href', expect.stringContaining('team-platform'))
  })

  it('clicking Spend header sorts ascending then descending', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><TeamTable rows={MOCK_ROWS} /></MemoryRouter>)
    const spendHeader = screen.getByRole('button', { name: /spend/i })
    await user.click(spendHeader)
    const rows = screen.getAllByRole('row').slice(1)
    const firstSpend = rows[0].textContent
    await user.click(spendHeader)
    const rowsAfter = screen.getAllByRole('row').slice(1)
    expect(rowsAfter[0].textContent).not.toBe(firstSpend)
  })

  it('renders empty state when rows is empty', () => {
    render(<MemoryRouter><TeamTable rows={[]} /></MemoryRouter>)
    expect(screen.getByText(/no teams found/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/components/tables/__tests__/TeamTable.test.tsx
```

Expected: FAIL — "Cannot find module '../TeamTable'"

- [ ] **Step 3: Create `src/components/tables/TeamTable.tsx`**

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TeamMetrics } from '../../types'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type SortKey = keyof Omit<TeamMetrics, 'teamId' | 'teamName'>

interface TeamTableProps {
  rows: TeamMetrics[]
  loading?: boolean
}

const COLS: { key: SortKey; label: string; format: (v: number) => string }[] = [
  { key: 'taskCount',       label: 'Tasks',          format: String },
  { key: 'autonomyRate',    label: 'Autonomy',        format: formatPercent },
  { key: 'spendUsd',        label: 'Spend',           format: formatCurrency },
  { key: 'costPerTask',     label: 'Cost/Task',       format: formatCurrency },
  { key: 'costPerMergedPr', label: 'Cost/Merged PR',  format: formatCurrency },
  { key: 'tokenWastePct',   label: 'Token Waste',     format: formatPercent },
]

export function TeamTable({ rows, loading = false }: TeamTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('spendUsd')
  const [asc, setAsc] = useState(false)

  if (loading) return <Skeleton className="h-48 w-full" />

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return asc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) setAsc(prev => !prev)
    else { setSortKey(key); setAsc(false) }
  }

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300 whitespace-nowrap'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Team</th>
            {COLS.map(col => (
              <th key={col.key} className={thClass}>
                <button
                  onClick={() => handleSort(col.key)}
                  className="hover:text-slate-200 transition-colors"
                  aria-label={`Sort by ${col.label}`}
                >
                  {col.label} {sortKey === col.key ? (asc ? '↑' : '↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <tr><td colSpan={COLS.length + 1}><EmptyState message="No teams found" /></td></tr>
          ) : (
            sorted.map(row => (
              <tr key={row.teamId} className="hover:bg-slate-800/50 transition-colors">
                <td className={`${tdClass} font-medium`}>
                  <Link to={`/teams/${row.teamId}`} className="text-indigo-400 hover:text-indigo-300">
                    {row.teamName}
                  </Link>
                </td>
                {COLS.map(col => (
                  <td key={col.key} className={tdClass}>{col.format(row[col.key])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/tables/OutcomeTable.tsx`**

No separate test — covered by page integration tests in Stage 5.

```tsx
import { useState } from 'react'
import type { OutcomesMetrics } from '../../types'
import { formatPercent } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type Row = OutcomesMetrics['prOutcomes'][number]
type SortKey = keyof Omit<Row, 'repoId' | 'taskType'>

interface OutcomeTableProps {
  rows: Row[]
  loading?: boolean
}

const COLS: { key: SortKey; label: string }[] = [
  { key: 'mergeRate',             label: 'Merge Rate' },
  { key: 'avgEditDistancePct',    label: 'Avg Edit Dist' },
  { key: 'ciFirstAttemptPassRate', label: 'CI Pass (1st)' },
]

export function OutcomeTable({ rows, loading = false }: OutcomeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('mergeRate')
  const [asc, setAsc] = useState(false)

  if (loading) return <Skeleton className="h-48 w-full" />

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return asc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) setAsc(p => !p)
    else { setSortKey(key); setAsc(false) }
  }

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Repo</th>
            <th className={thClass}>Task Type</th>
            {COLS.map(col => (
              <th key={col.key} className={thClass}>
                <button onClick={() => handleSort(col.key)} className="hover:text-slate-200 transition-colors" aria-label={`Sort by ${col.label}`}>
                  {col.label} {sortKey === col.key ? (asc ? '↑' : '↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <tr><td colSpan={5}><EmptyState message="No PR outcomes found" /></td></tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                <td className={tdClass}>{row.repoId}</td>
                <td className={tdClass}>{row.taskType.replace(/_/g, ' ')}</td>
                <td className={tdClass}>{formatPercent(row.mergeRate)}</td>
                <td className={tdClass}>{row.avgEditDistancePct.toFixed(1)}%</td>
                <td className={tdClass}>{formatPercent(row.ciFirstAttemptPassRate)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Run TeamTable tests**

```bash
pnpm test:run src/components/tables/__tests__/TeamTable.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
git add src/components/tables/TeamTable.tsx src/components/tables/OutcomeTable.tsx src/components/tables/__tests__/TeamTable.test.tsx
git commit -m "feat: add sortable TeamTable and OutcomeTable components"
```

---

### Task 5: ToolTable + TaskList

**Files:**
- Create: `src/components/tables/ToolTable.tsx`
- Create: `src/components/tables/TaskList.tsx`
- Create: `src/components/tables/__tests__/TaskList.test.tsx`

**Interfaces:**
- `ToolTable`: `{ rows: ToolStat[]; loading?: boolean }`
- `TaskList`: `{ tasks: AgentTask[]; onTaskClick: (task: AgentTask) => void; loading?: boolean }`

- [ ] **Step 1: Write the failing test at `src/components/tables/__tests__/TaskList.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../TaskList'
import type { AgentTask } from '../../../types'

const makeTask = (overrides: Partial<AgentTask> = {}): AgentTask => ({
  id: 'task-1', orgId: 'org-1', teamId: 'team-1', repoId: 'repo-1', userId: 'user-1',
  taskType: 'bug_fix', status: 'completed', startedAt: '2026-06-01T10:00:00Z',
  completedAt: '2026-06-01T10:30:00Z', model: 'claude-sonnet-4-6',
  inputTokens: 1000, outputTokens: 500, costUsd: 0.05,
  toolCallCount: 10, failedToolCallCount: 0, policyBlockCount: 0,
  humanInterventionRequired: false, prId: 'pr-1', autonomyBand: 'autonomous',
  ...overrides,
})

describe('TaskList', () => {
  it('renders at least 5 rows when given 5 tasks', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask({ id: `task-${i}` }))
    render(<TaskList tasks={tasks} onTaskClick={vi.fn()} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(5)
  })

  it('calls onTaskClick when a row is clicked', async () => {
    const user = userEvent.setup()
    const onTaskClick = vi.fn()
    const task = makeTask()
    render(<TaskList tasks={[task]} onTaskClick={onTaskClick} />)
    await user.click(screen.getAllByRole('row')[1])
    expect(onTaskClick).toHaveBeenCalledWith(task)
  })

  it('renders empty state when tasks is empty', () => {
    render(<TaskList tasks={[]} onTaskClick={vi.fn()} />)
    expect(screen.getByText(/no tasks/i)).toBeInTheDocument()
  })

  it('shows failed status badge for failed tasks', () => {
    render(<TaskList tasks={[makeTask({ status: 'failed', autonomyBand: 'failed' })]} onTaskClick={vi.fn()} />)
    expect(screen.getByText(/failed/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test:run src/components/tables/__tests__/TaskList.test.tsx
```

Expected: FAIL — "Cannot find module '../TaskList'"

- [ ] **Step 3: Create `src/components/tables/ToolTable.tsx`**

```tsx
import type { ToolStat } from '../../types'
import { formatDuration, formatPercent } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

interface ToolTableProps {
  rows: ToolStat[]
  loading?: boolean
}

export function ToolTable({ rows, loading = false }: ToolTableProps) {
  if (loading) return <Skeleton className="h-48 w-full" />

  const sorted = [...rows].sort((a, b) => b.errorRate - a.errorRate)

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300 tabular-nums'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Tool</th>
            <th className={thClass}>Calls</th>
            <th className={thClass}>Error Rate</th>
            <th className={thClass}>P50 Latency</th>
            <th className={thClass}>P95 Latency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <tr><td colSpan={5}><EmptyState /></td></tr>
          ) : (
            sorted.map(row => (
              <tr key={row.tool} className="hover:bg-slate-800/50 transition-colors">
                <td className={`${tdClass} font-mono`}>{row.tool.replace(/_/g, ' ')}</td>
                <td className={tdClass}>{row.callCount.toLocaleString()}</td>
                <td className={`${tdClass} ${row.errorRate > 0.1 ? 'text-rose-400' : ''}`}>{formatPercent(row.errorRate)}</td>
                <td className={tdClass}>{formatDuration(row.p50LatencyMs)}</td>
                <td className={tdClass}>{formatDuration(row.p95LatencyMs)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/tables/TaskList.tsx`**

```tsx
import type { AgentTask, AutonomyBand, TaskStatus } from '../../types'
import { formatDuration } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

interface TaskListProps {
  tasks: AgentTask[]
  onTaskClick: (task: AgentTask) => void
  loading?: boolean
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  completed: 'text-emerald-400',
  failed:    'text-rose-400',
  cancelled: 'text-slate-400',
  running:   'text-sky-400',
  queued:    'text-slate-400',
  blocked:   'text-amber-400',
}

const BAND_COLORS: Partial<Record<AutonomyBand, string>> = {
  autonomous:    'text-emerald-400',
  human_assisted:'text-sky-400',
  human_rescued: 'text-amber-400',
  failed:        'text-rose-400',
}

export function TaskList({ tasks, onTaskClick, loading = false }: TaskListProps) {
  if (loading) return <Skeleton className="h-64 w-full" />

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Task ID</th>
            <th className={thClass}>Type</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Autonomy</th>
            <th className={thClass}>Duration</th>
            <th className={thClass}>Model</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tasks.length === 0 ? (
            <tr><td colSpan={6}><EmptyState message="No tasks found" /></td></tr>
          ) : (
            tasks.map(task => {
              const duration = task.completedAt
                ? new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()
                : null
              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => onTaskClick(task)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onTaskClick(task)}
                  aria-label={`Task ${task.id}, status: ${task.status}`}
                >
                  <td className={`${tdClass} font-mono text-xs`}>{task.id}</td>
                  <td className={tdClass}>{task.taskType.replace(/_/g, ' ')}</td>
                  <td className={`${tdClass} ${STATUS_COLORS[task.status]}`}>{task.status}</td>
                  <td className={`${tdClass} ${task.autonomyBand ? BAND_COLORS[task.autonomyBand] : 'text-slate-500'}`}>
                    {task.autonomyBand?.replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td className={tdClass}>{duration !== null ? formatDuration(duration) : '—'}</td>
                  <td className={`${tdClass} text-xs`}>{task.model.replace('claude-', '')}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test:run src/components/tables/__tests__/TaskList.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
git add src/components/tables/ToolTable.tsx src/components/tables/TaskList.tsx src/components/tables/__tests__/TaskList.test.tsx
git commit -m "feat: add ToolTable and TaskList components"
```

---

### Task 6: EventLog + SpanDrawer

**Files:**
- Create: `src/components/tables/EventLog.tsx`
- Create: `src/components/overlays/SpanDrawer.tsx`
- Create: `src/components/tables/__tests__/EventLog.test.tsx`
- Create: `src/components/overlays/__tests__/SpanDrawer.test.tsx`

**Interfaces:**
- `EventLog`: `{ events: SecurityEvent[]; loading?: boolean }`
- `SpanDrawer`: `{ open: boolean; spans: TraceSpan[]; taskId: string; onClose: () => void; loading?: boolean }`

- [ ] **Step 1: Write the failing tests**

`src/components/tables/__tests__/EventLog.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventLog } from '../EventLog'
import type { SecurityEvent } from '../../../types'

const EVENTS: SecurityEvent[] = [
  { id: 'e1', taskId: 't1', repoId: 'r1', teamId: 'team-1', severity: 'critical', type: 'policy_block', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'e2', taskId: 't2', repoId: 'r1', teamId: 'team-1', severity: 'warning',  type: 'secret_detected', createdAt: '2026-06-02T11:00:00Z' },
  { id: 'e3', taskId: 't3', repoId: 'r2', teamId: 'team-2', severity: 'info',     type: 'human_approval_required', createdAt: '2026-06-03T12:00:00Z' },
]

describe('EventLog', () => {
  it('renders all 3 events by default', () => {
    render(<EventLog events={EVENTS} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3)
  })

  it('filters to only policy_block when filter selected', async () => {
    const user = userEvent.setup()
    render(<EventLog events={EVENTS} />)
    await user.selectOptions(screen.getByRole('combobox'), 'policy_block')
    expect(screen.getAllByRole('row').length).toBe(2) // 1 header + 1 data
  })

  it('renders empty state after filter with no matches', async () => {
    const user = userEvent.setup()
    render(<EventLog events={[]} />)
    expect(screen.getByText(/no events/i)).toBeInTheDocument()
  })

  it('renders severity badge on each row', () => {
    render(<EventLog events={EVENTS} />)
    expect(screen.getAllByText(/critical|warning|info/).length).toBeGreaterThanOrEqual(1)
  })
})
```

`src/components/overlays/__tests__/SpanDrawer.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpanDrawer } from '../SpanDrawer'
import type { TraceSpan } from '../../../types'

const makeSpan = (overrides: Partial<TraceSpan> = {}): TraceSpan => ({
  id: 'span-1', taskId: 'task-1', type: 'model_call', name: 'model-call-1',
  startedAt: '2026-06-01T10:00:00Z', durationMs: 1500, status: 'ok', source: 'agent',
  ...overrides,
})

const SPANS: TraceSpan[] = [
  makeSpan({ id: 'span-1' }),
  makeSpan({ id: 'span-2', type: 'shell_command', name: 'shell-1', status: 'error', errorCategory: 'tool_error' }),
  makeSpan({ id: 'span-3', type: 'git_operation', name: 'git-1' }),
]

describe('SpanDrawer', () => {
  it('renders span rows when open=true', () => {
    render(<SpanDrawer open taskId="task-1" spans={SPANS} onClose={vi.fn()} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3)
  })

  it('error span row has rose highlight', () => {
    const { container } = render(<SpanDrawer open taskId="task-1" spans={SPANS} onClose={vi.fn()} />)
    const errorRow = Array.from(container.querySelectorAll('tr')).find(r => r.textContent?.includes('shell-1'))
    expect(errorRow?.className).toMatch(/rose/)
  })

  it('pressing Escape calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SpanDrawer open taskId="task-1" spans={SPANS} onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open=false', () => {
    render(<SpanDrawer open={false} taskId="task-1" spans={SPANS} onClose={vi.fn()} />)
    expect(screen.queryByText('span-1')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
pnpm test:run src/components/tables/__tests__/EventLog.test.tsx src/components/overlays/__tests__/SpanDrawer.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/components/tables/EventLog.tsx`**

```tsx
import { useState } from 'react'
import type { SecurityEvent, SecurityEventType } from '../../types'
import { AlertBadge } from '../cards/AlertBadge'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const EVENT_TYPE_LABELS: Record<SecurityEventType, string> = {
  policy_block:             'Policy Block',
  secret_detected:          'Secret Detected',
  human_approval_required:  'Human Approval',
}

interface EventLogProps {
  events: SecurityEvent[]
  loading?: boolean
}

type Filter = 'all' | SecurityEventType

export function EventLog({ events, loading = false }: EventLogProps) {
  const [filter, setFilter] = useState<Filter>('all')

  if (loading) return <Skeleton className="h-64 w-full" />

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="event-filter" className="text-xs text-slate-400">Filter:</label>
        <select
          id="event-filter"
          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filter}
          onChange={e => setFilter(e.target.value as Filter)}
        >
          <option value="all">All types</option>
          <option value="policy_block">Policy Block</option>
          <option value="secret_detected">Secret Detected</option>
          <option value="human_approval_required">Human Approval</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className={thClass}>Severity</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Task ID</th>
              <th className={thClass}>Repo</th>
              <th className={thClass}>Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><EmptyState message="No events found" /></td></tr>
            ) : (
              filtered.map(event => (
                <tr key={event.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className={tdClass}><AlertBadge severity={event.severity} label={event.severity} /></td>
                  <td className={tdClass}>{EVENT_TYPE_LABELS[event.type]}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{event.taskId}</td>
                  <td className={tdClass}>{event.repoId}</td>
                  <td className={tdClass}>{new Date(event.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/overlays/SpanDrawer.tsx`**

```tsx
import { useEffect } from 'react'
import type { TraceSpan } from '../../types'
import { formatDuration } from '../../lib/utils'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

interface SpanDrawerProps {
  open: boolean
  taskId: string
  spans: TraceSpan[]
  onClose: () => void
  loading?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  ok:      'text-emerald-400',
  error:   'text-rose-400',
  timeout: 'text-amber-400',
  blocked: 'text-slate-400',
}

export function SpanDrawer({ open, taskId, spans, onClose, loading = false }: SpanDrawerProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const sorted = [...spans].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-slate-900 border-l border-slate-700 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Spans for task ${taskId}`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">Task spans</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{taskId}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close span drawer"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState message="No spans found for this task" />
          ) : (
            <table className="w-full" role="table">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Duration</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sorted.map(span => (
                  <tr
                    key={span.id}
                    className={`${span.status === 'error' || span.status === 'timeout' ? 'bg-rose-950/30' : ''} hover:bg-slate-800/50`}
                  >
                    <td className="px-4 py-2 text-xs font-mono text-slate-400">{span.type}</td>
                    <td className="px-4 py-2 text-sm text-slate-200">{span.name}</td>
                    <td className="px-4 py-2 text-sm tabular-nums text-slate-300">{formatDuration(span.durationMs)}</td>
                    <td className={`px-4 py-2 text-sm ${STATUS_STYLES[span.status] ?? 'text-slate-300'}`}>{span.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 5: Run all component tests**

```bash
pnpm test:run src/components/
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/tables/EventLog.tsx src/components/overlays/SpanDrawer.tsx src/components/tables/__tests__/EventLog.test.tsx src/components/overlays/__tests__/SpanDrawer.test.tsx
git commit -m "feat: add EventLog and SpanDrawer components with Escape-to-close"
```

---

## Stage 4 Complete

At this point you have:
- Every reusable component the dashboard pages need
- Unit tests covering KpiCard, BudgetGauge, TeamTable, TaskList, EventLog, SpanDrawer
- TypeScript compiling cleanly

**Next:** Stage 5 — Pages (LoginPage, OverviewPage, OutcomesPage, CostPage, ReliabilityPage, GovernancePage, TeamDetailPage, RepoDetailPage)
