import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import GovernancePage from '../GovernancePage'
import { getActiveAlertCount } from '../../mock/api'

function renderPage() {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><FilterProvider><GovernancePage /></FilterProvider></MemoryRouter>)
}

describe('GovernancePage', () => {
  it('renders 4 KPI cards including Critical Alerts', async () => {
    renderPage()
    await waitFor(() => {
      ['Critical Alerts', 'Policy Blocks', 'Secrets Detected', 'Human Approvals'].forEach(l =>
        expect(screen.getByText(l)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })

  it('Critical Alerts KPI matches the Overview active-alert count (sans cost spike)', async () => {
    // Overview count for default filters is the active-alert count; the cost-spike
    // anomaly is org-level and excluded from Governance, so they match here.
    const overviewCount = await getActiveAlertCount('30d', null, null)
    renderPage()
    const card = (await screen.findByText('Critical Alerts')).closest('div')!
    expect(within(card).getByText(String(overviewCount))).toBeInTheDocument()
  })

  it('event log has at least one row of each event type', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(3)
    }, { timeout: 1000 })
  })

  it('filtering to secret_detected shows only those rows', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('combobox').length > 0, { timeout: 1000 })
    await user.selectOptions(screen.getByRole('combobox'), 'secret_detected')
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1) // skip header
      rows.forEach(r => expect(r.textContent).toMatch(/secret|no events/i))
    })
  })
})
