import type { Meta, StoryObj } from '@storybook/react'
import { SparklineChart } from './SparklineChart'

const meta: Meta<typeof SparklineChart> = {
  title: 'Charts/SparklineChart',
  component: SparklineChart,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof SparklineChart>

export const WithData: Story = {
  args: {
    data: [
      { date: '2026-06-01', value: 0.35 },
      { date: '2026-06-08', value: 0.40 },
      { date: '2026-06-15', value: 0.38 },
      { date: '2026-06-22', value: 0.43 },
    ],
    className: 'text-indigo-400',
  },
}

export const FlatLine: Story = {
  args: {
    data: [
      { date: '2026-06-01', value: 0.4 },
      { date: '2026-06-22', value: 0.4 },
    ],
  },
}

export const Empty: Story = { args: { data: [] } }
