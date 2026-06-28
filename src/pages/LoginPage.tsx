import { useNavigate } from 'react-router-dom'
import { login } from '../auth/session'
import { setScenario } from '../mock/api'
import { COMPANIES, type Company } from '../mock/scenario'

export default function LoginPage() {
  const navigate = useNavigate()

  // Picking a workspace authenticates AND selects the data scenario for the session,
  // so different companies present a healthy vs. a struggling fleet.
  function selectCompany(company: Company) {
    login(company.id)
    setScenario(company.scenario)
    navigate('/overview')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Org logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-orange-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold" aria-hidden>⬡</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h1 className="text-xl font-bold text-slate-50 text-center mb-1">Sign in to Flightdeck</h1>
          <p className="text-sm text-slate-400 text-center mb-8">Choose a demo workspace · Okta SSO</p>

          <ul className="space-y-3">
            {COMPANIES.map(company => (
              <li key={company.id}>
                <button
                  type="button"
                  onClick={() => selectCompany(company)}
                  className="group w-full rounded-lg border border-slate-700 bg-slate-800 p-4 text-left transition-colors hover:border-orange-500 hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-50">{company.name}</span>
                    <span className="text-orange-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                      →
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{company.blurb}</p>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected by Okta Identity Cloud
          </p>
        </div>
      </div>
    </div>
  )
}
