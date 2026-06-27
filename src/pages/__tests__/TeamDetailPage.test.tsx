import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import TeamDetailPage from '../TeamDetailPage'

function renderPage(teamId = 'team-platform') {
  return render(
    <MemoryRouter initialEntries={[`/teams/${teamId}`]}>
      <FilterProvider>
        <Routes>
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        </Routes>
      </FilterProvider>
    </MemoryRouter>,
  )
}

describe('TeamDetailPage', () => {
  it('shows team name in header', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('renders 4 mini-sections', async () => {
    renderPage()
    await waitFor(() => {
      ['Outcomes', 'Cost', 'Reliability', 'Governance'].forEach(s =>
        expect(screen.getByText(s)).toBeInTheDocument()
      )
    }, { timeout: 1000 })
  })

  it('each section has a View full link', async () => {
    renderPage()
    await waitFor(() => {
      const links = screen.getAllByText(/view full/i)
      expect(links.length).toBeGreaterThanOrEqual(4)
    }, { timeout: 1000 })
  })

  it('renders member list with at least 2 rows', async () => {
    renderPage()
    await waitFor(() => {
      const memberTable = screen.getByRole('table', { name: /members/i })
      expect(memberTable.querySelectorAll('tr').length).toBeGreaterThanOrEqual(3)
    }, { timeout: 1000 })
  })
})
