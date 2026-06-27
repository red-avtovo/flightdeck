import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import ReliabilityPage from '../ReliabilityPage'

function renderPage() {
  return render(<MemoryRouter><FilterProvider><ReliabilityPage /></FilterProvider></MemoryRouter>)
}

describe('ReliabilityPage', () => {
  it('renders P95 task duration KPI card', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/P95 Task Duration/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders tool performance table with at least 4 rows', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(4)
    }, { timeout: 1000 })
  })

  it('opens SpanDrawer when a task row is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(2)
    }, { timeout: 1000 })
    // click first task row (after header)
    const rows = screen.getAllByRole('row')
    const taskRow = rows.find(r => r.getAttribute('aria-label')?.startsWith('Task'))
    if (taskRow) await user.click(taskRow)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
