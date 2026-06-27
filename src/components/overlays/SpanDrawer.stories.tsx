import type { Meta, StoryObj } from '@storybook/react'
import { SpanDrawer } from './SpanDrawer'
import type { TraceSpan } from '../../types'

const meta: Meta<typeof SpanDrawer> = {
  title: 'Overlays/SpanDrawer',
  component: SpanDrawer,
  parameters: { layout: 'fullscreen' },
  args: { open: true, taskId: 'task-demo-001', onClose: () => undefined },
}
export default meta
type Story = StoryObj<typeof SpanDrawer>

const SPANS: TraceSpan[] = [
  { id: 'span-1', taskId: 'task-demo-001', type: 'env_setup',     name: 'provision-env',    startedAt: '2026-06-01T10:00:00Z', durationMs: 8200,  status: 'ok',    source: 'operator' },
  { id: 'span-2', taskId: 'task-demo-001', type: 'model_call',    name: 'model-call-1',     startedAt: '2026-06-01T10:00:08Z', durationMs: 3100,  status: 'ok',    source: 'agent', inputTokens: 2000, outputTokens: 800 },
  { id: 'span-3', taskId: 'task-demo-001', type: 'shell_command', name: 'shell-1',          startedAt: '2026-06-01T10:00:11Z', durationMs: 450,   status: 'error', source: 'agent', errorCategory: 'tool_error' },
  { id: 'span-4', taskId: 'task-demo-001', type: 'git_operation', name: 'git-commit',       startedAt: '2026-06-01T10:00:12Z', durationMs: 120,   status: 'ok',    source: 'agent' },
  { id: 'span-5', taskId: 'task-demo-001', type: 'test_run',      name: 'test-run-1',       startedAt: '2026-06-01T10:00:13Z', durationMs: 12000, status: 'ok',    source: 'agent' },
]

export const OpenWithSpans:   Story = { args: { spans: SPANS, loading: false } }
export const OpenWithErrorSpan: Story = { args: { spans: SPANS, loading: false } }
export const Loading:         Story = { args: { spans: [], loading: true } }
