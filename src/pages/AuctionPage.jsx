import { useCallback, useRef, useState } from 'react'
import { api } from '../api/client'

export const QLT = {
  0: { label: 'Все', color: 'var(--text-2)' },
  1: { label: 'Обычный', color: '#9e9e9e' },
  2: { label: 'Необычный', color: '#4caf50' },
  3: { label: 'Особый', color: '#2196f3' },
  4: { label: 'Редкий', color: '#9c27b0' },
  5: { label: 'Исключительный', color: '#ff5722' },
  6: { label: 'Легендарный', color: '#ffc107' },
}

function formatPrice(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'М'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'К'
  return n.toLocaleString('ru-RU')
}

function timeLeft(isoStr) {
  if (!isoStr) return '—'
  const diff = new Date(isoStr) - Date.now()
  if (diff <= 0) return 'истёк'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

function isArtifact(item) {
  return item?.category?.startsWith('artefact') || item?.category?.startsWith('artifact')
}

function PriceChart({ prices }) {
  if (!prices || prices.length < 2) return (
    <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px', fontSize: '13px' }}>
      Недостаточно данных
    </div>
  )
  const values = prices.map(p => p.price).filter(Boolean)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const range = max - min || 1
  const W = 320, H = 110, PAD = 8
  const pts = prices.map((p, i) => {
    const x = PAD + (i / (prices.length - 1)) * (W - PAD * 2)
    const y = PAD + (1 - (p.price - min) / range) * (H - PAD * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {[['МИН', formatPrice(min), 'var(--success)'], ['СРЕДНЕЕ', formatPrice(avg), 'var(--accent)'], ['МАКС', formatPrice(max), 'var(--danger)']].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: '7px', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(t => (
            <line key={t} x1={PAD} y1={PAD + t * (H - PAD * 2)} x2={W - PAD} y2={PAD + t * (H - PAD * 2)} stroke="var(--border)" strokeWidth="1"/>
          ))}
          <polygon points={`${PAD},${H - PAD} ${pts} ${W - PAD},${H - PAD}`} fill="url(#cg)"/>
          <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', marginTop: '6px' }}>
          <span>{prices[0]?.time ? new Date(prices[0].time).toLocaleDateString('ru-RU') : ''}</span>
          <span>{prices.length} сделок</span>
          <span>{prices[prices.length - 1]?.time ? new Date(prices[prices.length - 1].time).toLocaleDateString('ru-RU') : ''}</span>
        </div>
      </div>
    </div>
  )
}

function QltFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
      {Object.entries(QLT).map(([k, { label, color }]) => {
        const active = value === Number(k)
        return (
          <button key={k} onClick={() => onChange(Number(k))} style={{
            flexShrink: 0, padding: '5px 10px',
            background: 'transparent',
            border: `1px solid ${active ? color : 'var(--border)'}`,
            borderRadius: '20px',
            color: active ? color : 'var(--text-3)',
            fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
            boxShadow: active ? `0 0 8px ${color}40` : 'none',
          }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function AuctionPage({ state, setState }) {
  const { query, selectedItem, lots, history, tab, qlt } = state
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertQlt, setAlertQlt] = useState(0)
  const [alertSaving, setAlertSaving] = useState(false)
  const [alertDone, setAlertDone] = useState(false)
  const searchTimeout = useRef(null)

  function update(patch) { setState(prev => ({ ...prev, ...patch })) }

  const search = useCallback((q) => {
    clearTimeout(searchTimeout.current)
    update({ query: q })
    if (q.length < 2) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try { setResults(await api.searchItems(q)) } catch {}
    }, 350)
  }, [])

  async function selectItem(item) {
    setResults([])
    update({ query: item.name_ru || item.name_en, selectedItem: item, lots: null, history: null })
    setAlertDone(false)
    setLoading(true)
    try {
      const [l, h] = await Promise.all([api.getLots(item.id), api.getHistory(item.id)])
      update({ lots: l, history: h })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function saveAlert() {
    const price = parseInt(alertPrice.replace(/\D/g, ''))
    if (!price || !selectedItem) return
    setAlertSaving(true)
    try {
      await api.createAlert(selectedItem.id, price, alertQlt || null)
      setAlertDone(true)
      setAlertModal(false)
      setAlertPrice('')
    } catch (e) { console.error(e) }
    finally { setAlertSaving(false) }
  }

  const artifact = isArtifact(selectedItem)
  const allLots = lots?.lots ?? []
  const filteredLots = qlt > 0 ? allLots.filter(l => l.additional?.qlt === qlt) : allLots
  const allHistory = history?.prices ?? []
  const filteredHistory = qlt > 0 ? allHistory.filter(p => p.additional?.qlt === qlt) : allHistory

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Search */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e => search(e.target.value)} placeholder="Поиск предмета..."
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 0', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }} />
          {query && <button onClick={() => { update({ query: '', selectedItem: null, lots: null, history: null }); setResults([]) }}
            style={{ background: 'none', color: 'var(--text-3)', fontSize: '18px', lineHeight: 1 }}>×</button>}
        </div>
        {results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: '16px', right: '16px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 100, maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            {results.map(item => (
              <div key={item.id} onClick={() => selectItem(item)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <img src={item.icon_url} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.name_ru}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.name_en} · {item.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        {!selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{ fontSize: '13px' }}>Введи название предмета</span>
          </div>
        )}

        {selectedItem && loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {selectedItem && !loading && lots && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
              <img src={selectedItem.icon_url} style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedItem.name_ru}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{selectedItem.name_en} · {selectedItem.id}</div>
              </div>
              <button onClick={() => { setAlertModal(true); setAlertQlt(qlt); setAlertDone(false) }} style={{
                flexShrink: 0,
                background: alertDone ? 'var(--success-dim)' : 'var(--accent-dim)',
                border: `1px solid ${alertDone ? 'var(--success)' : 'var(--accent)'}`,
                borderRadius: '7px', padding: '8px 12px',
                color: alertDone ? 'var(--success)' : 'var(--accent)',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
              }}>
                {alertDone ? '✓ АЛЕРТ' : '+ АЛЕРТ'}
              </button>
            </div>

            {/* Quality filter */}
            {artifact && (
              <div style={{ marginBottom: '12px' }}>
                <QltFilter value={qlt} onChange={v => update({ qlt: v })} />
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', marginBottom: '12px' }}>
              {[['lots', 'Активные лоты'], ['history', 'История цен']].map(([key, label]) => (
                <button key={key} onClick={() => update({ tab: key })} style={{
                  flex: 1, padding: '8px',
                  background: tab === key ? 'var(--bg-4)' : 'transparent',
                  border: tab === key ? '1px solid var(--border-bright)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: tab === key ? 'var(--text)' : 'var(--text-3)',
                  fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* Lots */}
            {tab === 'lots' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredLots.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: '24px', fontSize: '13px' }}>
                    Нет лотов{qlt > 0 ? ` (${QLT[qlt].label})` : ''}
                  </div>
                )}
                {filteredLots.map((lot, i) => {
                  const lotQlt = lot.additional?.qlt
                  const qi = QLT[lotQlt]
                  return (
                    <div key={i} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                      {artifact && qi && (
                        <div style={{ fontSize: '10px', fontWeight: 700, color: qi.color, marginBottom: '8px', letterSpacing: '0.08em' }}>
                          {qi.label.toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px', letterSpacing: '0.08em' }}>ТЕКУЩАЯ</div>
                          <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>{formatPrice(lot.currentPrice)} ₽</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px', letterSpacing: '0.08em' }}>ВЫКУП</div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{formatPrice(lot.buyoutPrice)} ₽</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px', letterSpacing: '0.08em' }}>ОСТАЛОСЬ</div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-2)' }}>{timeLeft(lot.endTime)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* History chart */}
            {tab === 'history' && <PriceChart prices={filteredHistory} />}
          </>
        )}
      </div>

      {/* Alert modal */}
      {alertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
          onClick={() => setAlertModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '24px 20px 36px' }}>
            <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Новый алерт</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '20px' }}>
              {selectedItem?.name_ru} — уведомление когда цена ≤ лимита
            </div>
            {artifact && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', letterSpacing: '0.08em' }}>РЕДКОСТЬ</div>
                <QltFilter value={alertQlt} onChange={setAlertQlt} />
              </div>
            )}
            <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
                placeholder="Лимит цены..." type="number" autoFocus
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 0', color: 'var(--text)', fontSize: '16px', fontWeight: 600 }} />
              <span style={{ color: 'var(--text-3)', fontSize: '14px' }}>₽</span>
            </div>
            <button onClick={saveAlert} disabled={alertSaving || !alertPrice} style={{
              width: '100%', padding: '14px',
              background: alertPrice ? 'var(--accent)' : 'var(--bg-4)',
              border: 'none', borderRadius: '8px',
              color: alertPrice ? '#0a0a0b' : 'var(--text-3)',
              fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', transition: 'all 0.15s',
            }}>
              {alertSaving ? 'СОХРАНЕНИЕ...' : 'СОЗДАТЬ АЛЕРТ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
