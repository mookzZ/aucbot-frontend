import { useState, useEffect } from 'react'
import { api } from './api/client'
import RegionSelect from './pages/RegionSelect'
import AuctionPage from './pages/AuctionPage'
import AlertsPage from './pages/AlertsPage'
import NavBar from './components/NavBar'

export default function App() {
  const [state, setState] = useState('loading') // loading | region | ready
  const [tab, setTab] = useState('auction')

  useEffect(() => {
    api.getMe()
      .then(() => setState('ready'))
      .catch(e => {
        if (e.message.startsWith('404')) setState('region')
        else setState('region') // fallback
      })
  }, [])

  if (state === 'loading') {
    return (
      <div style={{
        height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (state === 'region') {
    return <RegionSelect onDone={() => setState('ready')} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'auction' && <AuctionPage />}
        {tab === 'alerts' && <AlertsPage />}
      </div>
      <NavBar active={tab} onChange={setTab} />
    </div>
  )
}
