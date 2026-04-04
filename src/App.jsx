import { useState, useEffect } from 'react'
import { api } from './api/client'
import RegionSelect from './pages/RegionSelect'
import AuctionPage from './pages/AuctionPage'
import AlertsPage from './pages/AlertsPage'
import NavBar from './components/NavBar'

export default function App() {
  const [state, setState] = useState('loading')
  const [tab, setTab] = useState('auction')

  // Auction state lifted here to persist across tab switches
  const [auctionState, setAuctionState] = useState({
    query: '',
    selectedItem: null,
    lots: null,
    history: null,
    tab: 'lots',
    qlt: 0, // 0 = all
  })

  useEffect(() => {
    api.getMe()
      .then(() => setState('ready'))
      .catch(() => setState('region'))
  }, [])

  if (state === 'loading') return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  if (state === 'region') return <RegionSelect onDone={() => setState('ready')} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: tab === 'auction' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <AuctionPage state={auctionState} setState={setAuctionState} />
        </div>
        <div style={{ display: tab === 'alerts' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <AlertsPage />
        </div>
      </div>
      <NavBar active={tab} onChange={setTab} />
    </div>
  )
}

function Spinner() {
  return (
    <>
      <div style={{
        width: 28, height: 28, border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
