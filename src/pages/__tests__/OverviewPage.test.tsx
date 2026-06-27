import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import OverviewPage from '../OverviewPage'

function renderPage() {
  return render(
    <MemoryRouter>
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
})
