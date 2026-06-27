import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FilterProvider } from './context/FilterContext'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/layout/AppShell'

const LoginPage       = lazy(() => import('./pages/LoginPage'))
const OverviewPage    = lazy(() => import('./pages/OverviewPage'))
const OutcomesPage    = lazy(() => import('./pages/OutcomesPage'))
const CostPage        = lazy(() => import('./pages/CostPage'))
const ReliabilityPage = lazy(() => import('./pages/ReliabilityPage'))
const GovernancePage  = lazy(() => import('./pages/GovernancePage'))
const TeamDetailPage  = lazy(() => import('./pages/TeamDetailPage'))
const RepoDetailPage  = lazy(() => import('./pages/RepoDetailPage'))

function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="h-8 w-48 rounded bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-800 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-slate-800 animate-pulse" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/flightdeck">
      <FilterProvider>
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={null}>
              <LoginPage />
            </Suspense>
          } />
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/overview" element={
                <Suspense fallback={<PageSkeleton />}><OverviewPage /></Suspense>
              } />
              <Route path="/outcomes" element={
                <Suspense fallback={<PageSkeleton />}><OutcomesPage /></Suspense>
              } />
              <Route path="/cost" element={
                <Suspense fallback={<PageSkeleton />}><CostPage /></Suspense>
              } />
              <Route path="/reliability" element={
                <Suspense fallback={<PageSkeleton />}><ReliabilityPage /></Suspense>
              } />
              <Route path="/governance" element={
                <Suspense fallback={<PageSkeleton />}><GovernancePage /></Suspense>
              } />
              <Route path="/teams/:teamId" element={
                <Suspense fallback={<PageSkeleton />}><TeamDetailPage /></Suspense>
              } />
              <Route path="/repos/:repoId" element={
                <Suspense fallback={<PageSkeleton />}><RepoDetailPage /></Suspense>
              } />
            </Route>
          </Route>
        </Routes>
      </FilterProvider>
    </BrowserRouter>
  )
}
