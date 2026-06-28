import type { Meta, StoryObj } from '@storybook/react'
import { AlertsPanel } from './AlertsPanel'
import type { Alert } from '../../types'

// Router + FilterProvider come from the global decorator in .storybook/preview.ts —
// do NOT wrap another <MemoryRouter> here (nested routers crash the test-runner).
const meta: Meta<typeof AlertsPanel> = {
  title: 'Cards/AlertsPanel',
  component: AlertsPanel,
  parameters: { layout: 'padded' },
  args: { onDismiss: () => {} },
}
export default meta
type Story = StoryObj<typeof AlertsPanel>

const a = (over: Partial<Alert>): Alert => ({
  id: 'a', severity: 'critical', source: 'security_event', type: 'policy_block',
  message: 'task-544 · repo-product-web', refId: 'sec-event-1',
  createdAt: '2026-06-01T10:00:00Z', ...over,
})

export const MixedSeverities: Story = {
  args: {
    alerts: [
      a({ id: '1', severity: 'critical', type: 'policy_block', message: 'task-544 · repo-product-web' }),
      a({ id: '2', severity: 'critical', type: 'human_approval_required', message: 'task-550 · repo-platform-core' }),
      a({ id: '3', severity: 'warning', type: 'secret_detected', message: 'task-573 · repo-mobile-app' }),
      a({ id: '4', severity: 'info', type: 'human_approval_required', message: 'task-589 · repo-mobile-app' }),
      a({ id: '5', severity: 'warning', source: 'cost_anomaly', type: 'cost_spike', refId: 'org-acme', message: '$9,820/day · 150% over budget' }),
    ],
  },
}

export const SingleAlert: Story = {
  args: { alerts: [a({ id: '1' })] },
}
