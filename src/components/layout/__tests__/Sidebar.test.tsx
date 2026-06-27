import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  function setup() {
    return render(
      <MemoryRouter initialEntries={['/overview']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

  it('renders all navigation links', () => {
    setup()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
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
  })
})
