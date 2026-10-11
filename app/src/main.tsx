import { render } from 'preact'
import './styles/tokens.css'
import './styles/components.css'
import './styles/ui.css'
import { App } from './app.tsx'
import { StyleguideScreen } from './screens/Styleguide.tsx'

// Dev-only route (DASHBOARD-POLISH-HANDOFF.md section 3, work order step
// 1): a plain pathname/hash check, no router dependency. Reachable at
// /styleguide in `npm run dev`; the #styleguide hash works anywhere a
// path can't be set directly (a static preview build, a file:// open).
// Not linked from the app itself.
const root = location.pathname === '/styleguide' || location.hash === '#styleguide' ? <StyleguideScreen /> : <App />

render(root, document.getElementById('app')!)
