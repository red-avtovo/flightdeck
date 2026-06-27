import type { Meta, StoryObj } from '@storybook/react'
import { TeamTable } from './TeamTable'
import type { TeamMetrics } from '../../types'

const meta: Meta<typeof TeamTable> = {
  title: 'Tables/TeamTable',
  component: TeamTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof TeamTable>

const ROWS: TeamMetrics[] = [
  { teamId: 'team-platform', teamName: 'Platform', taskCount: 300, autonomyRate: 0.42, spendUsd: 15000, costPerTask: 50, costPerMergedPr: 120, tokenWastePct: 0.08 },
  { teamId: 'team-product',  teamName: 'Product',  taskCount: 200, autonomyRate: 0.38, spendUsd: 9000,  costPerTask: 45, costPerMergedPr: 100, tokenWastePct: 0.10 },
  { teamId: 'team-mobile',   teamName: 'Mobile',   taskCount: 100, autonomyRate: 0.50, spendUsd: 5000,  costPerTask: 50, costPerMergedPr: 90,  tokenWastePct: 0.05 },
]

export const Populated: Story = { args: { rows: ROWS } }
export const Empty:     Story = { args: { rows: [] } }
export const Loading:   Story = { args: { rows: [], loading: true } }
