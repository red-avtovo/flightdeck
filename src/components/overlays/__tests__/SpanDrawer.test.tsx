import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpanDrawer } from '../SpanDrawer'
import type { TraceSpan } from '../../../types'

const makeSpan = (overrides: Partial<TraceSpan> = {}): TraceSpan => ({
  id: 'span-1', taskId: 'task-1', type: 'model_call', name: 'model-call-1',
  startedAt: '2026-06-01T10:00:00Z', durationMs: 1500, status: 'ok', source: 'agent',
  ...overrides,
})

const SPANS: TraceSpan[] = [
  makeSpan({ id: 'span-1' }),
  makeSpan({ id: 'span-2', type: 'shell_command', name: 'shell-1', status: 'error', errorCategory: 'tool_error' }),
  makeSpan({ id: 'span-3', type: 'git_operation', name: 'git-1' }),
]

describe('SpanDrawer', () => {
  it('renders span rows when open=true', () => {
    render(<SpanDrawer open taskId="task-1" spans={SPANS} onClose={vi.fn()} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3)
  })

  it('error span row has rose highlight', () => {
    const { container } = render(<SpanDrawer open taskId="task-1" spans={SPANS} onClose={vi.fn()} />)
    const errorRow = Array.from(container.querySelectorAll('tr')).find(r => r.textContent?.includes('shell-1'))
    expect(errorRow?.className).toMatch(/rose/)
  })

  it('pressing Escape calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SpanDrawer open taskId="task-1" spans={SPANS} onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open=false', () => {
    render(<SpanDrawer open={false} taskId="task-1" spans={SPANS} onClose={vi.fn()} />)
    expect(screen.queryByText('span-1')).not.toBeInTheDocument()
  })
})
