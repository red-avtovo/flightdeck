import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  function handleLogin() {
    sessionStorage.setItem('authenticated', 'true')
    navigate('/overview')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Org logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold" aria-hidden>⬡</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h1 className="text-xl font-bold text-slate-50 text-center mb-1">Sign in to Flightdeck</h1>
          <p className="text-sm text-slate-400 text-center mb-8">Acme Corp · Okta SSO</p>

          <div className="mb-6">
            <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
              Work email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@acme.example"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Continue with Okta
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected by Okta Identity Cloud
          </p>
        </div>
      </div>
    </div>
  )
}
