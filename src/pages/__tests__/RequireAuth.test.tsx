import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../../auth/RequireAuth'

function setup(authenticated: boolean) {
  sessionStorage.clear()
  if (authenticated) sessionStorage.setItem('authenticated', 'true')
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => sessionStorage.clear())

  it('renders protected content when authenticated', () => {
    setup(true)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    setup(false)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
