import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'
import { FilterProvider } from '../../../context/FilterContext'
import { getActiveAlertCount } from '../../../mock/api'

describe('Sidebar', () => {
  // Sidebar reads filters (for the live Governance badge), so it needs FilterProvider.
  function setup(initialPath = '/overview') {
    return render(
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <FilterProvider>
          <Sidebar />
        </FilterProvider>
      </MemoryRouter>,
    )
  }

  it('renders the sidebar with proper accessibility attributes', () => {
    setup()
    const sidebar = screen.getByLabelText('Main navigation')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar.tagName).toBe('ASIDE')
  })

  it('centers nav icons in the collapsed rail (justify-center until xl)', () => {
    setup()
    const link = screen.getByRole('link', { name: /overview/i })
    expect(link.className).toContain('justify-center')
    expect(link.className).toContain('xl:justify-start')
  })

  it('displays the Flightdeck logo and wordmark', () => {
    setup()
    expect(screen.getByText('⬡')).toBeInTheDocument()
    expect(screen.getByText('Flightdeck')).toBeInTheDocument()
  })

  it('renders all navigation links (5 main + 4 team)', () => {
    setup()
    // Scope to <nav>: the footer utility links (GitHub/Storybook) live outside it.
    const links = within(screen.getByRole('navigation')).getAllByRole('link')
    expect(links).toHaveLength(9)
  })

  it('renders Overview link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /overview/i })
    expect(link).toHaveAttribute('href', '/overview')
  })

  it('renders Outcomes link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /outcomes/i })
    expect(link).toHaveAttribute('href', '/outcomes')
  })

  it('renders Cost link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /cost/i })
    expect(link).toHaveAttribute('href', '/cost')
  })

  it('renders Reliability link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /reliability/i })
    expect(link).toHaveAttribute('href', '/reliability')
  })

  it('renders Governance link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /governance/i })
    expect(link).toHaveAttribute('href', '/governance')
  })

  it('highlights the active link with orange background', () => {
    setup()
    const overviewLink = screen.getByRole('link', { name: /overview/i })
    expect(overviewLink).toHaveClass('bg-orange-600')
  })

  it('renders navigation links in the correct order', () => {
    setup()
    const nav = screen.getByRole('navigation')
    const links = nav.querySelectorAll('a')
    expect(links[0]).toHaveAttribute('href', '/overview')
    expect(links[1]).toHaveAttribute('href', '/outcomes')
    expect(links[2]).toHaveAttribute('href', '/cost')
    expect(links[3]).toHaveAttribute('href', '/reliability')
    expect(links[4]).toHaveAttribute('href', '/governance')
    expect(links[5]).toHaveAttribute('href', '/teams/team-platform')
    expect(links[6]).toHaveAttribute('href', '/teams/team-product')
    expect(links[7]).toHaveAttribute('href', '/teams/team-datascience')
    expect(links[8]).toHaveAttribute('href', '/teams/team-mobile')
  })

  // Teams nav group
  it('renders the Teams section label', () => {
    setup()
    expect(screen.getByText('Teams')).toBeInTheDocument()
  })

  it('renders Platform team link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /platform/i })
    expect(link).toHaveAttribute('href', '/teams/team-platform')
  })

  it('renders Product team link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /product/i })
    expect(link).toHaveAttribute('href', '/teams/team-product')
  })

  it('renders Data Science team link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /data science/i })
    expect(link).toHaveAttribute('href', '/teams/team-datascience')
  })

  it('renders Mobile team link with correct href', () => {
    setup()
    const link = screen.getByRole('link', { name: /mobile/i })
    expect(link).toHaveAttribute('href', '/teams/team-mobile')
  })

  it('activates team link when on that team route', () => {
    setup('/teams/team-platform')
    const platformLink = screen.getByRole('link', { name: /platform/i })
    expect(platformLink).toHaveClass('bg-orange-600')
  })

  // Governance badge — the live active-alert count (default filters: 30d / all / all),
  // the same number the Overview "Alerts (N)" strip shows. Not a hardcoded value.
  it('shows the live active-alert count on the Governance link', async () => {
    const expected = await getActiveAlertCount('30d', null, null)
    expect(expected).toBeGreaterThan(0) // sanity: mock data has critical alerts in 30d
    setup()
    const link = await screen.findByRole('link', {
      name: new RegExp(`governance, ${expected} active alerts`, 'i'),
    })
    expect(link).toBeInTheDocument()
    expect(within(link).getByText(String(expected))).toBeInTheDocument()
  })

  // Utility links above the footer
  it('links to the GitHub repo', () => {
    setup()
    const link = screen.getByRole('link', { name: /github repository/i })
    expect(link).toHaveAttribute('href', 'https://github.com/red-avtovo/flightdeck')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('links to Storybook (under the app base path)', () => {
    setup()
    const link = screen.getByRole('link', { name: /storybook/i })
    expect(link.getAttribute('href')).toMatch(/storybook\/$/)
  })

  // User footer
  it('renders the user initials avatar', () => {
    setup()
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders the user name in the footer', () => {
    setup()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('renders the user role in the footer', () => {
    setup()
    expect(screen.getByText('VP Eng')).toBeInTheDocument()
  })

  it('user avatar has accessible label', () => {
    setup()
    expect(screen.getByLabelText('Jane Doe, VP Eng')).toBeInTheDocument()
  })

  it('renders the user email in the footer', () => {
    setup()
    expect(screen.getByText('jane.doe@acme.example')).toBeInTheDocument()
  })

  // Logout
  it('renders a Log out button', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  it('clicking Log out drops the auth state', async () => {
    const user = userEvent.setup()
    sessionStorage.setItem('authenticated', 'true')
    setup()
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(sessionStorage.getItem('authenticated')).toBeNull()
  })
})
