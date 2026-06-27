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
