import type { Meta, StoryObj } from '@storybook/react'
import { ScatterChart } from './ScatterChart'
import type { TeamMetrics } from '../../types'

const meta: Meta<typeof ScatterChart> = {
  title: 'Charts/ScatterChart',
  component: ScatterChart,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ScatterChart>

const TEAMS: TeamMetrics[] = [
  { teamId: 'team-1', teamName: 'Platform',     taskCount: 300, autonomyRate: 0.42, spendUsd: 15000, costPerTask: 50, costPerMergedPr: 120, tokenWastePct: 0.08 },
  { teamId: 'team-2', teamName: 'Product',      taskCount: 200, autonomyRate: 0.38, spendUsd: 9000,  costPerTask: 45, costPerMergedPr: 100, tokenWastePct: 0.10 },
  { teamId: 'team-3', teamName: 'Data Science', taskCount: 150, autonomyRate: 0.55, spendUsd: 7500,  costPerTask: 50, costPerMergedPr: 85,  tokenWastePct: 0.06 },
  { teamId: 'team-4', teamName: 'Mobile',       taskCount: 100, autonomyRate: 0.50, spendUsd: 5000,  costPerTask: 50, costPerMergedPr: 90,  tokenWastePct: 0.05 },
]

export const MultiplePoints: Story = { args: { data: TEAMS } }
export const SinglePoint:    Story = { args: { data: [TEAMS[0]] } }
export const Empty:          Story = { args: { data: [] } }
