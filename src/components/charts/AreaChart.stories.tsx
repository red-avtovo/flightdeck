import type { Meta, StoryObj } from '@storybook/react'
import { AreaChart } from './AreaChart'

const meta: Meta<typeof AreaChart> = {
  title: 'Charts/AreaChart',
  component: AreaChart,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AreaChart>

const DATA = [
  { date: 'Jun 1',  value: 4200 },
  { date: 'Jun 8',  value: 5800 },
  { date: 'Jun 15', value: 5100 },
  { date: 'Jun 22', value: 6700 },
  { date: 'Jun 29', value: 7300 },
]

export const Default: Story = {
  args: {
    data: DATA,
    dataKey: 'value',
    color: '#6366f1',
    height: 240,
    formatY: (v: number) => `$${(v / 1000).toFixed(1)}k`,
  },
}

export const CustomColor: Story = {
  args: {
    data: DATA,
    dataKey: 'value',
    color: '#10b981',
    height: 240,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    dataKey: 'value',
  },
}
