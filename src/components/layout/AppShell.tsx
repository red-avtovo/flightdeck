import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar />
      <TopBar />
      <main
        className="pt-16 pl-16 xl:pl-60 min-h-screen"
        id="main-content"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
