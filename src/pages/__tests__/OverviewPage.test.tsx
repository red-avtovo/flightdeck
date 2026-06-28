import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import OverviewPage from '../OverviewPage'

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FilterProvider>
        <OverviewPage />
      </FilterProvider>
    </MemoryRouter>,
  )
}

describe('OverviewPage', () => {
  it('renders AutonomyBar with 4 labelled segments after data loads', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /autonomy breakdown/i })).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders 5 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      const texts = ['Tasks Started', 'Autonomy Rate', 'Cost/Merged PR', 'Median Time to PR', 'Active Users']
      texts.forEach(t => expect(screen.getByText(t)).toBeInTheDocument())
    }, { timeout: 1000 })
  })

  it('shows loading skeleton before data resolves', () => {
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders alerts strip', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/alert/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('alerts strip has a governance link', async () => {
    renderPage()
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /governance/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/governance')
    }, { timeout: 1000 })
  })

  it('each security alert deep-links to its Governance event row', async () => {
    renderPage()
    await waitFor(() => {
      const deepLinks = screen.getAllByRole('link').filter(l =>
        (l.getAttribute('href') || '').startsWith('/governance?event='))
      expect(deepLinks.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('can dismiss individual alerts', async () => {
    const user = userEvent.setup()
    renderPage()

    // Wait for alerts to appear
    const dismissButtons = await waitFor(
      () => {
        const buttons = screen.getAllByRole('button', { name: /dismiss alert/i })
        expect(buttons.length).toBeGreaterThan(0)
        return buttons
      },
      { timeout: 1000 },
    )

    // Dismiss the first alert
    const initialCount = dismissButtons.length
    await user.click(dismissButtons[0])

    // After dismissal, there should be one fewer dismiss button (or strip gone if only one alert)
    await waitFor(() => {
      const remaining = screen.queryAllByRole('button', { name: /dismiss alert/i })
      expect(remaining.length).toBe(initialCount - 1)
    }, { timeout: 1000 })
  })

  it('hides the alerts strip when all alerts are dismissed', async () => {
    const user = userEvent.setup()
    renderPage()

    // Wait for dismiss buttons to appear
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /dismiss alert/i }).length).toBeGreaterThan(0)
    }, { timeout: 1000 })

    // Dismiss all alerts one by one
    let buttons = screen.getAllByRole('button', { name: /dismiss alert/i })
    for (const btn of buttons) {
      await user.click(btn)
    }

    // Strip (including governance link) should be gone
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /governance/i })).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
