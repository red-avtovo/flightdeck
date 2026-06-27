import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '../LoginPage'

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

  it('renders Okta-branded login form', () => {
    setup()
    expect(screen.getByRole('button', { name: /continue with okta/i })).toBeInTheDocument()
  })

  it('sets sessionStorage authenticated after clicking button', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue with okta/i }))
    expect(sessionStorage.getItem('authenticated')).toBe('true')
  })

  it('navigates to /overview after login', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue with okta/i }))
    expect(screen.getByText('Overview Page')).toBeInTheDocument()
  })
})
