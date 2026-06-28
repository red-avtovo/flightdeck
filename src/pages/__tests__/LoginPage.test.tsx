import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '../LoginPage'
import { getActiveCompany, getActiveScenario } from '../../auth/session'

function setup() {
  sessionStorage.clear()
  return render(
    <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/overview" element={<div>Overview Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => sessionStorage.clear())

  it('offers a demo workspace per company', () => {
    setup()
    expect(screen.getByRole('button', { name: /acme corp/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /globex/i })).toBeInTheDocument()
  })

  it('authenticates and selects the healthy scenario when Acme is chosen', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /acme corp/i }))
    expect(sessionStorage.getItem('authenticated')).toBe('true')
    expect(getActiveCompany().name).toBe('Acme Corp')
    expect(getActiveScenario()).toBe('healthy')
  })

  it('selects the problematic scenario when Globex is chosen', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /globex/i }))
    expect(getActiveScenario()).toBe('problematic')
  })

  it('navigates to /overview after picking a workspace', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /acme corp/i }))
    expect(screen.getByText('Overview Page')).toBeInTheDocument()
  })
})
