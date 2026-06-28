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

export const Empty: Story = {
  args: {
    data: [],
    series: [{ key: 'value', label: 'Value', color: '#6366f1' }],
  },
}
