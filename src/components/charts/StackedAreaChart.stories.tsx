import type { Meta, StoryObj } from '@storybook/react'
import { StackedAreaChart } from './StackedAreaChart'

const meta: Meta<typeof StackedAreaChart> = {
  title: 'Charts/StackedAreaChart',
  component: StackedAreaChart,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof StackedAreaChart>

const AUTONOMY_DATA = [
  { date: 'Jun 1',  autonomous: 0.38, human_assisted: 0.30, human_rescued: 0.20, failed: 0.12 },
  { date: 'Jun 8',  autonomous: 0.40, human_assisted: 0.29, human_rescued: 0.19, failed: 0.12 },
  { date: 'Jun 15', autonomous: 0.42, human_assisted: 0.28, human_rescued: 0.18, failed: 0.12 },
  { date: 'Jun 22', autonomous: 0.45, human_assisted: 0.27, human_rescued: 0.17, failed: 0.11 },
  { date: 'Jun 29', autonomous: 0.48, human_assisted: 0.26, human_rescued: 0.16, failed: 0.10 },
]

const AUTONOMY_SERIES = [
  { key: 'autonomous',     label: 'Autonomous',     color: '#10b981' },
  { key: 'human_assisted', label: 'Human Assisted', color: '#0ea5e9' },
  { key: 'human_rescued',  label: 'Human Rescued',  color: '#f59e0b' },
  { key: 'failed',         label: 'Failed',          color: '#f43f5e' },
]

// Absolute task counts per band per day — matches the Overview "Tasks over time" chart.
const COUNT_DATA = [
  { date: 'Jun 1',  autonomous: 18, human_assisted: 12, human_rescued: 6, failed: 4 },
  { date: 'Jun 8',  autonomous: 22, human_assisted: 14, human_rescued: 5, failed: 3 },
  { date: 'Jun 15', autonomous: 25, human_assisted: 13, human_rescued: 7, failed: 5 },
  { date: 'Jun 22', autonomous: 30, human_assisted: 15, human_rescued: 6, failed: 4 },
  { date: 'Jun 29', autonomous: 34, human_assisted: 16, human_rescued: 5, failed: 2 },
]

// Default: absolute counts on the Y axis (Overview / Governance usage).
export const TaskCounts: Story = {
  args: {
    data: COUNT_DATA,
    series: AUTONOMY_SERIES,
    height: 260,
  },
}

// Percent share view — pass valueFormat="percent" for fractional (0–1) data.
export const AutonomyBands: Story = {
  args: {
    data: AUTONOMY_DATA,
    series: AUTONOMY_SERIES,
    height: 260,
    valueFormat: 'percent',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    series: AUTONOMY_SERIES,
  },
}
