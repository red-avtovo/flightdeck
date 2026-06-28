import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { restoreDeepLink } from './lib/restoreDeepLink'

// Restore a GitHub Pages deep link (encoded by 404.html into ?p=) before the
// router reads the URL, so refreshing a deep route doesn't fall back to /overview.
restoreDeepLink(window.location, window.history)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
