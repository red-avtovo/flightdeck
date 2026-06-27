import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  function handleLogin() {
    sessionStorage.setItem('authenticated', 'true')
    navigate('/overview')
  }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-96 bg-slate-900 rounded-xl p-8 border border-slate-700">
        <h1 className="text-xl font-bold text-slate-50 mb-6">Sign in to Flightdeck</h1>
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          Continue with Okta
        </button>
      </div>
    </div>
  )
}
