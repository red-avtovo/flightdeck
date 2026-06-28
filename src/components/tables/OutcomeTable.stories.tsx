import type { Meta, StoryObj } from '@storybook/react'
import { OutcomeTable } from './OutcomeTable'

const meta: Meta<typeof OutcomeTable> = {
  title: 'Tables/OutcomeTable',
  component: OutcomeTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof OutcomeTable>

// Covers all 6 task-type badges and the full traffic-light range for the rate columns
// (green ≥70% / amber 40–70% / red <40% for higher-is-better; flipped for edit distance).
const ROWS = [
  { repoId: 'repo-platform-core', taskType: 'bug_fix' as const,            mergeRate: 0.90, avgEditDistancePct: 12, ciFirstAttemptPassRate: 0.88 },
  { repoId: 'repo-product-web',   taskType: 'feature' as const,            mergeRate: 0.55, avgEditDistancePct: 35, ciFirstAttemptPassRate: 0.62 },
  { repoId: 'repo-ds-pipelines',  taskType: 'refactor' as const,           mergeRate: 0.31, avgEditDistancePct: 58, ciFirstAttemptPassRate: 0.28 },
  { repoId: 'repo-mobile-app',    taskType: 'tests' as const,              mergeRate: 0.78, avgEditDistancePct: 18, ciFirstAttemptPassRate: 0.81 },
  { repoId: 'repo-docs-site',     taskType: 'docs' as const,               mergeRate: 0.64, avgEditDistancePct: 41, ciFirstAttemptPassRate: 0.49 },
  { repoId: 'repo-platform-core', taskType: 'dependency_update' as const,  mergeRate: 0.42, avgEditDistancePct: 27, ciFirstAttemptPassRate: 0.71 },
]

export const Populated: Story = { args: { rows: ROWS } }
export const Empty:     Story = { args: { rows: [] } }
