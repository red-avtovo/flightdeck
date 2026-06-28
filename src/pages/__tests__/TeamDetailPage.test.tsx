import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import TeamDetailPage from '../TeamDetailPage'

function renderPage(teamId = 'team-platform') {
  return render(
    <MemoryRouter initialEntries={[`/teams/${teamId}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

  it('member table has Tasks, Autonomy %, Spend columns', async () => {
    renderPage()
    await waitFor(() => {
      const memberTable = screen.getByRole('table', { name: /members/i })
      // Query column headers within the table to avoid false positives with the header stats
      const headers = Array.from(memberTable.querySelectorAll('th')).map(th => th.textContent)
      expect(headers).toContain('Tasks')
      expect(headers).toContain('Autonomy %')
      expect(headers).toContain('Spend')
    }, { timeout: 1000 })
  })

  it('shows "Self-service stats — not a ranking" caption', async () => {
    renderPage()
    await waitFor(() => {
      // The caption text appears in both the <caption> and a visible <p>; either presence suffices
      const elements = screen.getAllByText(/self-service stats/i)
      expect(elements.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 1000 })
  })

  it('shows correct Outcomes section labels', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Merge Rate')).toBeInTheDocument()
      expect(screen.getByText('Avg Edit Distance')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('shows correct Cost section labels', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Cost/Merged PR')).toBeInTheDocument()
      expect(screen.getByText('Token Waste %')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('shows correct Reliability section labels', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('P95 Task Duration')).toBeInTheDocument()
      expect(screen.getByText('Tool Failure Rate')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('shows correct Governance section labels', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Policy Blocks')).toBeInTheDocument()
      expect(screen.getByText('Secrets Detected')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
