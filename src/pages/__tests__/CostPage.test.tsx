import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import CostPage from '../CostPage'

function renderPage() {
  return render(<MemoryRouter><FilterProvider><CostPage /></FilterProvider></MemoryRouter>)
}

describe('CostPage', () => {
  it('renders 4 KPI cards', async () => {
    renderPage()
    await waitFor(() => {
      ['Total Spend', 'Cost/Task', 'Cost/Merged PR', 'Token Waste'].forEach(l =>
        expect(screen.getByText(l)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })

  it('renders cost/PR by task type horizontal bar chart', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/cost.*task type/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders team cost breakdown table with Platform row', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
