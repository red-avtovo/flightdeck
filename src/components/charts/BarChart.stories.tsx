import type { Meta, StoryObj } from '@storybook/react'
import { BarChart } from './BarChart'

const meta: Meta<typeof BarChart> = {
  title: 'Charts/BarChart',
  component: BarChart,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof BarChart>

const VERTICAL_DATA = [
  { name: 'Platform',     tasks: 310 },
  { name: 'Product',      tasks: 215 },
  { name: 'Data Science', tasks: 160 },
  { name: 'Mobile',       tasks: 98  },
]

const HORIZONTAL_DATA = [
  { name: 'Platform',     cost: 15200 },
  { name: 'Product',      cost: 9400  },
  { name: 'Data Science', cost: 7600  },
  { name: 'Mobile',       cost: 5100  },
]

const STACKED_DATA = [
  { name: 'Jun 1',  autonomous: 120, human_assisted: 80, failed: 20 },
  { name: 'Jun 8',  autonomous: 145, human_assisted: 75, failed: 18 },
  { name: 'Jun 15', autonomous: 160, human_assisted: 70, failed: 15 },
  { name: 'Jun 22', autonomous: 175, human_assisted: 65, failed: 12 },
]

export const Vertical: Story = {
  args: {
    data: VERTICAL_DATA,
    series: [{ key: 'tasks', label: 'Tasks', color: '#6366f1' }],
    height: 240,
    xKey: 'name',
  },
}

export const HorizontalSingle: Story = {
  args: {
    data: HORIZONTAL_DATA,
    series: [{ key: 'cost', label: 'Spend (USD)', color: '#10b981' }],
    layout: 'horizontal',
    height: 220,
    xKey: 'name',
    formatY: (v: number) => `$${(v / 1000).toFixed(1)}k`,
  },
}

export const Stacked: Story = {
  args: {
    data: STACKED_DATA,
    series: [
      { key: 'autonomous',     label: 'Autonomous',     color: '#10b981' },
      { key: 'human_assisted', label: 'Human Assisted', color: '#0ea5e9' },
      { key: 'failed',         label: 'Failed',          color: '#f43f5e' },
    ],
    stacked: true,
    height: 260,
    xKey: 'name',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    series: [{ key: 'tasks', label: 'Tasks', color: '#6366f1' }],
  },
}
