import type { Meta, StoryObj } from '@storybook/react'
import { EventLog } from './EventLog'
import type { SecurityEvent } from '../../types'

const meta: Meta<typeof EventLog> = {
  title: 'Tables/EventLog',
  component: EventLog,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof EventLog>

const EVENTS: SecurityEvent[] = [
  { id: 'e1', taskId: 't1', repoId: 'repo-1', teamId: 'team-1', severity: 'critical', type: 'policy_block',            createdAt: '2026-06-01T10:00:00Z' },
  { id: 'e2', taskId: 't2', repoId: 'repo-1', teamId: 'team-1', severity: 'warning',  type: 'secret_detected',          createdAt: '2026-06-02T11:00:00Z' },
  { id: 'e3', taskId: 't3', repoId: 'repo-2', teamId: 'team-2', severity: 'info',     type: 'human_approval_required', createdAt: '2026-06-03T12:00:00Z' },
  { id: 'e4', taskId: 't4', repoId: 'repo-2', teamId: 'team-2', severity: 'warning',  type: 'policy_block',            createdAt: '2026-06-04T09:00:00Z' },
]

export const Populated: Story = { args: { events: EVENTS } }
// Deep-linked from an Overview alert: the matching row is highlighted + scrolled into view.
export const HighlightedRow: Story = { args: { events: EVENTS, highlightEventId: 'e2' } }
export const Empty:     Story = { args: { events: [] } }
