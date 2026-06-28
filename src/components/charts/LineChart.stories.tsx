import type { Meta, StoryObj } from '@storybook/react'
import { LineChart } from './LineChart'

const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof LineChart>

const DATES = ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29']

const SINGLE_DATA = DATES.map((date, i) => ({ date, value: 30 + i * 4 + Math.round(Math.sin(i) * 5) }))

const MULTI_DATA = DATES.map((date, i) => ({
  date,
  p50: 120 + i * 8,
  p95: 340 + i * 20,
  p99: 600 + i * 35,
}))

export const SingleLine: Story = {
  args: {
    data: SINGLE_DATA,
    series: [{ key: 'value', label: 'Autonomy Rate', color: '#6366f1' }],
    height: 240,
  },
}

export const MultiLine: Story = {
  args: {
    data: MULTI_DATA,
    series: [
      { key: 'p50', label: 'p50 latency', color: '#10b981' },
      { key: 'p95', label: 'p95 latency', color: '#f59e0b' },
      { key: 'p99', label: 'p99 latency', color: '#f43f5e' },
    ],
    height: 260,
    formatY: (v: number) => `${v}ms`,
  },
}

export const Counts: Story = {
  args: {
    data: DATES.map((date, i) => ({
      date,
      tool_error: 3 + i * 2,
      timeout: 1 + i,
      env_setup: 2 + Math.round(Math.sin(i) * 2),
    })),
    series: [
      { key: 'tool_error', label: 'Tool Error', color: '#6366f1' },
      { key: 'timeout', label: 'Timeout', color: '#f43f5e' },
      { key: 'env_setup', label: 'Env Setup', color: '#f59e0b' },
    ],
    height: 260,
    formatY: (v: number) => String(Math.round(v)),
  },
}

// Many-series chart with the interactive legend — click a chip to show/hide a line.
export const ToggleableByCategory: Story = {
  args: {
    data: DATES.map((date, i) => ({
      date,
      tool_error: 3 + i * 2,
      timeout: 1 + i,
      env_setup: 2 + Math.round(Math.sin(i) * 2),
      policy_block: 1 + Math.round(Math.cos(i) * 2),
      model_error: 2 + i,
      test_failure: 4 + Math.round(Math.sin(i + 1) * 3),
    })),
    series: [
      { key: 'tool_error', label: 'tool error', color: '#6366f1' },
      { key: 'timeout', label: 'timeout', color: '#f43f5e' },
      { key: 'env_setup', label: 'env setup', color: '#f59e0b' },
      { key: 'policy_block', label: 'policy block', color: '#e879f9' },
      { key: 'model_error', label: 'model error', color: '#0ea5e9' },
      { key: 'test_failure', label: 'test failure', color: '#10b981' },
    ],
    height: 260,
    toggleable: true,
    formatY: (v: number) => String(Math.round(v)),
  },
}

export const Empty: Story = {
  args: {
    data: [],
    series: [{ key: 'value', label: 'Value', color: '#6366f1' }],
  },
}
