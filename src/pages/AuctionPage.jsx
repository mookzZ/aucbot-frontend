import { useState, useCallback, useRef } from 'react'
import { api } from '../api/client'

function formatPrice(n) {
  return n?.toLocaleString('ru-RU') ?? '—'
}

function timeLeft(isoStr) {
  if (!isoStr) return '—'
  const diff = new Date(isoStr) - Date.now()
  if (diff <= 0) return 'истёк'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

export default function AuctionPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [lots, setLots] = useState(null)
  const [history, setHistory] = useState(null)
  const [tab, setTab] = useState('lots')
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)
  const [alertDone, setAlertDone] = useState(false)
  const searchTimeout = useRef(null)

  const search = useCallback((q) => {
    clearTimeout(searchTimeout.current)
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await api.searchItems(q)
        setResults(data)
      } catch {}
    }, 350)
  }, [])

  async function selectItem(item) {
    setSelectedItem(item)
    setResults([])
    setQuery(item.name_ru || item.name_en)
    setLots(null)
    setHistory(null)
    setLoading(true)
    setAlertDone(false)
    try {
      const [l, h] = await Promise.all([
        api.getLots(item.id),
        api.getHistory(item.id),
      ])
      setLots(l)
      setHistory(h)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function saveAlert() {
    const price = parseInt(alertPrice.replace(/\D/g, ''))
    if (!price || !selectedItem) return
    setAlertSaving(true)
    try {
      await api.createAlert(selectedItem.id, price)
      setAlertDone(true)
      setAlertModal(false)
      setAlertPrice('')
    } catch (e) {
      console.error(e)
    } finally {
      setAlertSaving(false)
    }
  }

  const lotsData = lots?.lots ?? []
  const historyData = history?.prices ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0 14px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Поиск предмета..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '12px 0',
              color: 'var(--text)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSelectedItem(null); setLots(null) }}
              style={{ background: 'none', color: 'var(--text-3)', fontSize: '18px', lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        {/* Dropdown */}
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: '16px', right: '16px',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: '8px', zIndex: 100, maxHeight: '220px', overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {results.map(item => (
              <div key={item.id} onClick={() => selectItem(item)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <img src={item.icon_url} style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.9 }}
                  onError={e => e.target.style.display = 'none'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.name_ru}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.name_en} · {item.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {!selectedItem && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-3)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span style={{ fontSize: '13px' }}>Введи название предмета</span>
          </div>
        )}

        {selectedItem && loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <div style={{
              width: 24, height: 24, border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {selectedItem && !loading && lots && (
          <>
            {/* Item header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '14px', marginBottom: '16px',
            }}>
              <img src={selectedItem.icon_url} style={{ width: 44, height: 44, objectFit: 'contain' }}
                onError={e => e.target.style.display = 'none'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedItem.name_ru}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                  {selectedItem.name_en} · {selectedItem.id}
                </div>
              </div>
              <button
                onClick={() => { setAlertModal(true); setAlertDone(false) }}
                style={{
                  background: alertDone ? 'var(--success-dim)' : 'var(--accent-dim)',
                  border: `1px solid ${alertDone ? 'var(--success)' : 'var(--accent)'}`,
                  borderRadius: '7px', padding: '8px 12px',
                  color: alertDone ? 'var(--success)' : 'var(--accent)',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
                }}
              >
                {alertDone ? '✓ АЛЕРТ' : '+ АЛЕРТ'}
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '4px',
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '4px', marginBottom: '12px',
            }}>
              {[['lots', 'Лоты'], ['history', 'История']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex: 1, padding: '8px',
                  background: tab === key ? 'var(--bg-4)' : 'transparent',
                  border: tab === key ? '1px solid var(--border-bright)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: tab === key ? 'var(--text)' : 'var(--text-3)',
                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em',
                  transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Lots */}
            {tab === 'lots' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lotsData.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: '24px', fontSize: '13px' }}>
                    Нет активных лотов
                  </div>
                )}
                {lotsData.map((lot, i) => (
                  <div key={lot.id ?? i} style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '12px 14px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>ТЕКУЩАЯ</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>
                        {formatPrice(lot.currentPrice)} ₽
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>ВЫКУП</div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {formatPrice(lot.buyoutPrice)} ₽
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>ОСТАЛОСЬ</div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-2)' }}>
                        {timeLeft(lot.endTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            {tab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {historyData.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: '24px', fontSize: '13px' }}>
                    Нет истории
                  </div>
                )}
                {historyData.map((p, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>
                      {formatPrice(p.price)} ₽
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      {p.time ? new Date(p.time).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Alert modal */}
      {alertModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200,
        }} onClick={() => setAlertModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', background: 'var(--bg-2)',
            borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0',
            padding: '24px 20px 32px',
          }}>
            <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>
              Новый алерт
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '20px' }}>
              {selectedItem?.name_ru} · уведомление когда цена ≤ лимита
            </div>
            <div style={{
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0 14px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <input
                value={alertPrice}
                onChange={e => setAlertPrice(e.target.value)}
                placeholder="Лимит цены..."
                type="number"
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  padding: '14px 0', color: 'var(--text)', fontSize: '16px', fontWeight: 600,
                }}
                autoFocus
              />
              <span style={{ color: 'var(--text-3)', fontSize: '14px' }}>₽</span>
            </div>
            <button onClick={saveAlert} disabled={alertSaving || !alertPrice} style={{
              width: '100%', padding: '14px',
              background: alertPrice ? 'var(--accent)' : 'var(--bg-4)',
              border: 'none', borderRadius: '8px',
              color: alertPrice ? '#0a0a0b' : 'var(--text-3)',
              fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em',
              transition: 'all 0.15s',
            }}>
              {alertSaving ? 'СОХРАНЕНИЕ...' : 'СОЗДАТЬ АЛЕРТ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
