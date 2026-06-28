import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AlertsPanel } from '../AlertsPanel'
import type { Alert } from '../../../types'

const alert = (over: Partial<Alert>): Alert => ({
  id: 'alert-1',
  severity: 'critical',
  source: 'security_event',
  type: 'policy_block',
  message: 'task-544 · repo-product-web', // detail only — type is shown separately
  refId: 'sec-event-1',
  createdAt: '2026-06-01T10:00:00Z',
  ...over,
})

const renderPanel = (alerts: Alert[], onDismiss = vi.fn()) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AlertsPanel alerts={alerts} onDismiss={onDismiss} />
    </MemoryRouter>,
  )

describe('AlertsPanel', () => {
  it('renders nothing when there are no alerts', () => {
    const { container } = renderPanel([])
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the count and one row per alert', () => {
    renderPanel([alert({ id: 'a1' }), alert({ id: 'a2', message: 'task-2 · repo-x' })])
    const panel = screen.getByRole('region', { name: /active alerts/i })
    expect(within(panel).getByText('2')).toBeInTheDocument()
    expect(within(panel).getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows the type label and the detail without repeating the type', () => {
    renderPanel([alert({ type: 'policy_block', message: 'task-544 · repo-product-web' })])
    expect(screen.getByText('policy block')).toBeInTheDocument()       // type label (sentence-cased via CSS)
    expect(screen.getByText('task-544 · repo-product-web')).toBeInTheDocument() // detail, no type repeated
  })

  it('links a security-event alert to its Governance event row', () => {
    renderPanel([alert({ source: 'security_event', refId: 'sec-event-9' })])
    const link = screen.getByRole('link', { name: /task-544/i })
    expect(link).toHaveAttribute('href', '/governance?event=sec-event-9')
  })

  it('links a cost-spike alert to the Cost page (it has no event)', () => {
    renderPanel([alert({ source: 'cost_anomaly', type: 'cost_spike', message: '$9,820/day · 150% over budget', refId: 'org-acme' })])
    const link = screen.getByRole('link', { name: /150% over budget/i })
    expect(link).toHaveAttribute('href', '/cost')
  })

  it('calls onDismiss without navigating when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    renderPanel([alert({ id: 'a1' })], onDismiss)
    await user.click(screen.getByRole('button', { name: /dismiss alert/i }))
    expect(onDismiss).toHaveBeenCalledWith('a1')
  })
})
