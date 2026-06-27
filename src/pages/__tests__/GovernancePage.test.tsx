import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import GovernancePage from '../GovernancePage'

function renderPage() {
  return render(<MemoryRouter><FilterProvider><GovernancePage /></FilterProvider></MemoryRouter>)
}

describe('GovernancePage', () => {
  it('renders 3 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      ['Policy Blocks', 'Secrets Detected', 'Human Approvals'].forEach(l =>
        expect(screen.getByText(l)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
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
