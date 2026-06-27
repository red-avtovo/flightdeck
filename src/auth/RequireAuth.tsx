import { Navigate, Outlet } from 'react-router-dom'

export function RequireAuth() {
  const isAuthenticated = sessionStorage.getItem('authenticated') === 'true'
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
