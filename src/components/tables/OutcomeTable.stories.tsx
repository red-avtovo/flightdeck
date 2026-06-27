import type { Meta, StoryObj } from '@storybook/react'
import { OutcomeTable } from './OutcomeTable'

const meta: Meta<typeof OutcomeTable> = {
  title: 'Tables/OutcomeTable',
  component: OutcomeTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof OutcomeTable>

const ROWS = [
  { repoId: 'repo-platform-core', taskType: 'bug_fix' as const,  mergeRate: 0.82, avgEditDistancePct: 22, ciFirstAttemptPassRate: 0.78 },
  { repoId: 'repo-product-web',   taskType: 'feature' as const,   mergeRate: 0.71, avgEditDistancePct: 45, ciFirstAttemptPassRate: 0.65 },
  { repoId: 'repo-ds-pipelines',  taskType: 'refactor' as const,  mergeRate: 0.90, avgEditDistancePct: 12, ciFirstAttemptPassRate: 0.88 },
]

export const Populated: Story = { args: { rows: ROWS } }
export const Empty:     Story = { args: { rows: [] } }
