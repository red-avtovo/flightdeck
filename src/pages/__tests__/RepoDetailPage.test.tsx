import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import RepoDetailPage from '../RepoDetailPage'

function renderPage(repoId = 'repo-platform-core') {
  return render(
    <MemoryRouter initialEntries={[`/repos/${repoId}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FilterProvider>
        <Routes>
          <Route path="/repos/:repoId" element={<RepoDetailPage />} />
        </Routes>
      </FilterProvider>
    </MemoryRouter>,
  )
}

describe('RepoDetailPage', () => {
  it('renders repo readiness strip with 3 boolean badges', async () => {
    renderPage()
    await waitFor(() => {
      const badges = ['Test command', 'CI configured', 'Agent instructions']
      badges.forEach(b => expect(screen.getByText(new RegExp(b, 'i'))).toBeInTheDocument())
    }, { timeout: 1000 })
  })

  it('renders repo name in header', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/platform-core/i)).toBeInTheDocument()
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

  it('shows human team name in subtitle instead of raw teamId', async () => {
    renderPage()
    await waitFor(() => {
      // platform-core belongs to team-platform whose name is "Platform"
      expect(screen.getByText(/Platform team/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('does not show raw teamId in subtitle', async () => {
    renderPage()
    await waitFor(() => {
      // the human name should appear; the raw id should not be the subtitle
      expect(screen.queryByText('team-platform')).not.toBeInTheDocument()
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
