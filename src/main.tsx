import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { restoreDeepLink } from './lib/restoreDeepLink'
import { setScenario } from './mock/api'
import { getActiveScenario } from './auth/session'

// Restore a GitHub Pages deep link (encoded by 404.html into ?p=) before the
// router reads the URL, so refreshing a deep route doesn't fall back to /overview.
restoreDeepLink(window.location, window.history)

// Load the dataset for the workspace selected at login (persisted in sessionStorage)
// before the app renders, so a refresh shows the same scenario's data.
setScenario(getActiveScenario())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
