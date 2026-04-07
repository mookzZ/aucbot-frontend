import { useState, useEffect } from 'react'
import { api } from './api/client'
import RegionSelect from './pages/RegionSelect'
import AuctionPage from './pages/AuctionPage'
import AlertsPage from './pages/AlertsPage'
import ClansPage from './pages/ClansPage'
import NavBar from './components/NavBar'

export default function App() {
  const [state, setState] = useState('loading')
  const [tab, setTab] = useState('auction')

  const [auctionState, setAuctionState] = useState({
    query: '',
    selectedItem: null,
    lots: null,
    history: null,
    tab: 'lots',
    qlt: 0,
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

  function goToItem(item, qlt, filterPtn) {
    setAuctionState(prev => ({
      ...prev,
      query: item.name_ru || item.name_en,
      selectedItem: item,
      lots: null,
      history: null,
      tab: 'lots',
      qlt: qlt ?? null,
      _filterPtn: filterPtn ?? '',
    }))
    setTab('auction')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: tab === 'auction' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <AuctionPage state={auctionState} setState={setAuctionState} />
        </div>
        <div style={{ display: tab === 'clans' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <ClansPage key={tab === 'clans' ? 'visible' : 'hidden'} />
        </div>
        <div style={{ display: tab === 'alerts' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <AlertsPage key={tab === 'alerts' ? 'visible' : 'hidden'} onGoToItem={goToItem} />
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
