import type { Meta, StoryObj } from '@storybook/react'
import { TaskList } from './TaskList'
import type { AgentTask } from '../../types'

const meta: Meta<typeof TaskList> = {
  title: 'Tables/TaskList',
  component: TaskList,
  parameters: { layout: 'padded' },
  args: { onTaskClick: () => undefined },
}
export default meta
type Story = StoryObj<typeof TaskList>

const makeTask = (overrides: Partial<AgentTask>): AgentTask => ({
  id: 'task-1', orgId: 'org-1', teamId: 'team-1', repoId: 'repo-1', userId: 'user-1',
  taskType: 'bug_fix', status: 'completed', startedAt: '2026-06-01T10:00:00Z',
  completedAt: '2026-06-01T10:30:00Z', model: 'claude-sonnet-4-6',
  inputTokens: 5000, outputTokens: 2000, costUsd: 0.04,
  toolCallCount: 12, failedToolCallCount: 0, policyBlockCount: 0,
  humanInterventionRequired: false, prId: 'pr-1', autonomyBand: 'autonomous',
  ...overrides,
})

export const MixedStatuses: Story = {
  args: {
    tasks: [
      makeTask({ id: 'task-1', status: 'completed', autonomyBand: 'autonomous' }),
      makeTask({ id: 'task-2', status: 'failed',    autonomyBand: 'failed',         taskType: 'feature' }),
      makeTask({ id: 'task-3', status: 'completed', autonomyBand: 'human_assisted', taskType: 'refactor' }),
      makeTask({ id: 'task-4', status: 'running',   autonomyBand: null,             completedAt: null }),
      makeTask({ id: 'task-5', status: 'completed', autonomyBand: 'human_rescued',  taskType: 'docs' }),
    ],
  },
}

export const AllFailed: Story = {
  args: {
    tasks: Array.from({ length: 3 }, (_, i) =>
      makeTask({ id: `task-${i}`, status: 'failed', autonomyBand: 'failed', taskType: 'feature' })
    ),
  },
}

export const Empty: Story = { args: { tasks: [] } }
