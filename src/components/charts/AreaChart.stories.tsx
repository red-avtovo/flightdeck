import type { Meta, StoryObj } from '@storybook/react'
import { AreaChart } from './AreaChart'
import { formatCurrency } from '../../lib/utils'

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

export const Currency: Story = {
  args: {
    data: [
      { date: 'Jun 1', value: 12.42 },
      { date: 'Jun 8', value: 14.0856 },
      { date: 'Jun 15', value: 11.33 },
      { date: 'Jun 22', value: 15.67 },
      { date: 'Jun 29', value: 18.91 },
    ],
    dataKey: 'value',
    color: '#f97316',
    height: 240,
    formatY: formatCurrency,
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
