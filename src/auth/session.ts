// Mock SSO session. The "logged-in person" is a fixed demo identity — the Login
// screen authenticates against this without a real IdP. Auth state lives in
// sessionStorage so a refresh in the same tab stays signed in, but a new tab
// requires re-login (see requirements FR-01).

export interface SessionUser {
  name: string
  role: string
  email: string
  initials: string
}

const AUTH_KEY = 'authenticated'

export const CURRENT_USER: SessionUser = {
  name: 'Jane Doe',
  role: 'VP Eng',
  email: 'jane.doe@acme.example',
  initials: 'JD',
}

export function login(): void {
  sessionStorage.setItem(AUTH_KEY, 'true')
}

/** Drops the auth state — the portal reverts to the signed-out experience. */
export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function getCurrentUser(): SessionUser {
  return CURRENT_USER
}
