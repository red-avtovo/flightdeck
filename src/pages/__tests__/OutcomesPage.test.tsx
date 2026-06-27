import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import OutcomesPage from '../OutcomesPage'

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><FilterProvider><OutcomesPage /></FilterProvider></MemoryRouter>,
  )
}

describe('OutcomesPage', () => {
  it('renders 4 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      const labels = ['Merge Rate', 'Human Edit Distance', 'CI Pass Rate', 'Revert Rate']
      labels.forEach(l => expect(screen.getByText(l)).toBeInTheDocument())
    }, { timeout: 1000 })
  })

  it('renders edit distance trend chart', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/edit distance/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders PR outcomes table with at least 3 rows', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3)
    }, { timeout: 1000 })
  })
})
