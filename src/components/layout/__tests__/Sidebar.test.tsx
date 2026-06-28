import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  function setup(initialPath = '/overview') {
    return render(
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Sidebar />
      </MemoryRouter>,
    )
  }

  it('renders the sidebar with proper accessibility attributes', () => {
    setup()
    const sidebar = screen.getByLabelText('Main navigation')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar.tagName).toBe('ASIDE')
  })

  it('displays the Flightdeck logo and wordmark', () => {
    setup()
    expect(screen.getByText('⬡')).toBeInTheDocument()
    expect(screen.getByText('Flightdeck')).toBeInTheDocument()
  })

  it('renders all navigation links (5 main + 4 team)', () => {
    setup()
    const links = screen.getAllByRole('link')
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

  it('highlights the active link with indigo background', () => {
    setup()
    const overviewLink = screen.getByRole('link', { name: /overview/i })
    expect(overviewLink).toHaveClass('bg-indigo-600')
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
    expect(platformLink).toHaveClass('bg-indigo-600')
  })

  // Governance badge
  it('renders a badge count on the Governance link', () => {
    setup()
    // The aria-label on the link encodes the count
    const link = screen.getByRole('link', { name: /governance.*3/i })
    expect(link).toBeInTheDocument()
  })

  it('renders the governance badge pill with count 3', () => {
    setup()
    expect(screen.getByText('3')).toBeInTheDocument()
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
