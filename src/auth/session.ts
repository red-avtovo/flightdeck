// Mock SSO session. The "logged-in person" is a fixed demo identity — the Login
// screen authenticates against this without a real IdP. Auth state lives in
// sessionStorage so a refresh in the same tab stays signed in, but a new tab
// requires re-login (see requirements FR-01).

import { COMPANIES, DEFAULT_COMPANY, type Company, type Scenario } from '../mock/scenario'

export interface SessionUser {
  name: string
  role: string
  email: string
  initials: string
}

const AUTH_KEY = 'authenticated'
const COMPANY_KEY = 'company'

export const CURRENT_USER: SessionUser = {
  name: 'Jane Doe',
  role: 'VP Eng',
  email: 'jane.doe@acme.example',
  initials: 'JD',
}

/** Sign in to a specific demo workspace; the company picks the data scenario. */
export function login(companyId: string = DEFAULT_COMPANY.id): void {
  sessionStorage.setItem(AUTH_KEY, 'true')
  sessionStorage.setItem(COMPANY_KEY, companyId)
}

/** The workspace selected at login (defaults to the first company). */
export function getActiveCompany(): Company {
  const id = sessionStorage.getItem(COMPANY_KEY)
  return COMPANIES.find(c => c.id === id) ?? DEFAULT_COMPANY
}

/** The data scenario for the active workspace — read at boot to load the right dataset. */
export function getActiveScenario(): Scenario {
  return getActiveCompany().scenario
}

/** Drops the auth state — the portal reverts to the signed-out experience. */
export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(COMPANY_KEY)
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function getCurrentUser(): SessionUser {
  return CURRENT_USER
}
