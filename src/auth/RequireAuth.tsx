import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from './session'

export function RequireAuth() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}
