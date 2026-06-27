import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import RepoDetailPage from '../RepoDetailPage'

function renderPage(repoId = 'repo-platform-core') {
  return render(
    <MemoryRouter initialEntries={[`/repos/${repoId}`]}>
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
})
