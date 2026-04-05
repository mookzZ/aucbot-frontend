import { useCallback, useRef, useState } from 'react'
import { api } from '../api/client'

export const QLT = {
  0: { label: 'Обычный', color: '#9e9e9e' },
  1: { label: 'Необычный', color: '#4caf50' },
  2: { label: 'Особый', color: '#2196f3' },
  3: { label: 'Редкий', color: '#9c27b0' },
  4: { label: 'Исключительный', color: '#ff5722' },
  5: { label: 'Легендарный', color: '#ffc107' },
}

function formatPrice(n) {
  if (n == null || n === 0) return '—'
  return n.toLocaleString('ru-RU') + ' ₽'
}

function getLotPrice(lot) {
  return lot.currentPrice || lot.buyoutPrice || lot.startPrice || null
}

function getLotBuyout(lot) {
  return lot.buyoutPrice || null
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

function getPtn(lot) {
  return lot?.additional?.ptn ?? 0
}

// ── Chart ────────────────────────────────────────────────────────────────────

function PriceChart({ prices }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

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
  const W = 400, H = 130, PAD = 12

  const pts = prices.map((p, i) => ({
    x: PAD + (i / (prices.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (p.price - min) / range) * (H - PAD * 2),
    price: p.price, time: p.time,
    qlt: p.additional?.qlt, ptn: p.additional?.ptn,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const polygon = `${PAD},${H - PAD} ${polyline} ${W - PAD},${H - PAD}`

  function handleMouseMove(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (W / rect.width)
    let closest = pts[0], minDist = Infinity
    for (const p of pts) {
      const d = Math.abs(p.x - mx)
      if (d < minDist) { minDist = d; closest = p }
    }
    setTooltip(closest)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {[['МИН', min, 'var(--success)'], ['СРЕДНЕЕ', avg, 'var(--accent)'], ['МАКС', max, 'var(--danger)']].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: '7px', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color }}>{formatPrice(value)}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', position: 'relative' }}>
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(t => (
            <line key={t} x1={PAD} y1={PAD + t * (H - PAD * 2)} x2={W - PAD} y2={PAD + t * (H - PAD * 2)} stroke="var(--border)" strokeWidth="1"/>
          ))}
          <polygon points={polygon} fill="url(#cg)"/>
          <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={PAD} x2={tooltip.x} y2={H - PAD}
                stroke="var(--text-3)" strokeWidth="1" strokeDasharray="3,3" opacity="0.6"/>
              <circle cx={tooltip.x} cy={tooltip.y} r={4}
                fill="var(--accent)" stroke="var(--bg-4)" strokeWidth="2"/>
            </>
          )}
        </svg>
        {tooltip && (
          <div style={{
            position: 'absolute', top: '12px',
            left: tooltip.x / W * 100 > 60 ? 'auto' : '60px',
            right: tooltip.x / W * 100 > 60 ? '12px' : 'auto',
            background: 'var(--bg-2)', border: '1px solid var(--border-bright)',
            borderRadius: '6px', padding: '8px 10px',
            fontSize: '11px', lineHeight: '1.6', pointerEvents: 'none', minWidth: '150px',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '2px' }}>{formatPrice(tooltip.price)}</div>
            {tooltip.qlt != null && QLT[tooltip.qlt] && (
              <div style={{ color: QLT[tooltip.qlt].color }}>
                {QLT[tooltip.qlt].label}{tooltip.ptn ? ` +${tooltip.ptn}` : ''}
              </div>
            )}
            {tooltip.time && (
              <div style={{ color: 'var(--text-3)' }}>
                {new Date(tooltip.time).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', marginTop: '6px' }}>
          <span>{prices[0]?.time ? new Date(prices[0].time).toLocaleDateString('ru-RU') : ''}</span>
          <span>{prices.length} сделок</span>
          <span>{prices[prices.length - 1]?.time ? new Date(prices[prices.length - 1].time).toLocaleDateString('ru-RU') : ''}</span>
        </div>
      </div>
    </div>
  )
}

// ── Quality Filter ────────────────────────────────────────────────────────────

function QltFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
      <button onClick={() => onChange(null)} style={{
        flexShrink: 0, padding: '4px 10px', background: 'transparent',
        border: `1px solid ${value === null ? 'var(--text-2)' : 'var(--border)'}`,
        borderRadius: '20px', color: value === null ? 'var(--text-2)' : 'var(--text-3)',
        fontSize: '11px', fontWeight: 600,
      }}>Все</button>
      {Object.entries(QLT).map(([k, { label, color }]) => {
        const active = value === Number(k)
        return (
          <button key={k} onClick={() => onChange(Number(k))} style={{
            flexShrink: 0, padding: '4px 10px', background: 'transparent',
            border: `1px solid ${active ? color : 'var(--border)'}`,
            borderRadius: '20px', color: active ? color : 'var(--text-3)',
            fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
            boxShadow: active ? `0 0 8px ${color}40` : 'none',
          }}>{label}</button>
        )
      })}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AuctionPage({ state, setState }) {
  const { query, selectedItem, lots, history, tab, qlt } = state
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertQlt, setAlertQlt] = useState(null)
  const [alertPtn, setAlertPtn] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)
  const [alertDone, setAlertDone] = useState(false)
  const [sortOrder, setSortOrder] = useState('asc')
  const [filterPtn, setFilterPtn] = useState('')  // строгий матч, '' = любая
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
    update({ query: item.name_ru || item.name_en, selectedItem: item, lots: null, history: null, qlt: null })
    setAlertDone(false)
    setFilterPtn('')
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
      const ptn_min = alertPtn ? parseInt(alertPtn) : null
      await api.createAlert(selectedItem.id, price, alertQlt, ptn_min)
      setAlertDone(true)
      setAlertModal(false)
      setAlertPrice('')
      setAlertPtn('')
    } catch (e) { console.error(e) }
    finally { setAlertSaving(false) }
  }

  const artifact = isArtifact(selectedItem)
  const allLots = lots?.lots ?? []

  // Filter lots
  let filteredLots = artifact && qlt !== null
    ? allLots.filter(l => l.additional?.qlt === qlt)
    : allLots

  // Strict ptn match for lots display
  if (artifact && filterPtn !== '') {
    const ptnNum = parseInt(filterPtn)
    if (!isNaN(ptnNum)) filteredLots = filteredLots.filter(l => getPtn(l) === ptnNum)
  }

  // Sort
  filteredLots = [...filteredLots].sort((a, b) => {
    const pa = a.buyoutPrice || a.currentPrice || 0
    const pb = b.buyoutPrice || b.currentPrice || 0
    return sortOrder === 'asc' ? pa - pb : pb - pa
  })

  const allHistory = history?.prices ?? []
  const filteredHistory = artifact && qlt !== null
    ? allHistory.filter(p => p.additional?.qlt === qlt)
    : allHistory

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Search */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '40px', gap: '12px', color: 'var(--text-3)' }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: '12px' }}>Загрузка всех лотов...</span>
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
                fontSize: '11px', fontWeight: 700,
              }}>
                {alertDone ? '✓ АЛЕРТ' : '+ АЛЕРТ'}
              </button>
            </div>

            {/* Artifact filters */}
            {artifact && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
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
                  borderRadius: '6px', color: tab === key ? 'var(--text)' : 'var(--text-3)',
                  fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* Lots */}
            {tab === 'lots' && (
              <>
                {/* Controls row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>
                    {filteredLots.length} лотов
                  </span>

                  {/* Ptn input — only for artifacts */}
                  {artifact && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', height: '30px', width: '90px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>+</span>
                      <input
                        value={filterPtn}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '')
                          setFilterPtn(v === '' ? '' : String(Math.min(15, parseInt(v))))
                        }}
                        placeholder="Любая"
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '12px', fontWeight: 600 }}
                      />
                      {filterPtn && (
                        <button onClick={() => setFilterPtn('')} style={{ background: 'none', color: 'var(--text-3)', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  )}

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {[['asc', '↑'], ['desc', '↓']].map(([val, label]) => (
                      <button key={val} onClick={() => setSortOrder(val)} style={{
                        width: 30, height: 30, background: 'transparent',
                        border: `1px solid ${sortOrder === val ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '6px', color: sortOrder === val ? 'var(--accent)' : 'var(--text-3)',
                        fontSize: '14px', fontWeight: 700,
                      }}>{label}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredLots.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: '24px', fontSize: '13px' }}>Нет лотов</div>
                  )}
                  {filteredLots.map((lot, i) => {
                    const lotQlt = lot.additional?.qlt
                    const lotPtn = getPtn(lot)
                    const qi = QLT[lotQlt]
                    return (
                      <div key={i} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                        {artifact && (qi || lotPtn > 0) && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            {qi && <span style={{ fontSize: '10px', fontWeight: 700, color: qi.color, letterSpacing: '0.08em' }}>{qi.label.toUpperCase()}</span>}
                            {lotPtn > 0 && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)', borderRadius: '4px', padding: '1px 6px' }}>+{lotPtn}</span>}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px', letterSpacing: '0.08em' }}>СТАВКА</div>
                            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '13px' }}>{formatPrice(getLotPrice(lot))}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px', letterSpacing: '0.08em' }}>ВЫКУП</div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{getLotBuyout(lot) ? formatPrice(getLotBuyout(lot)) : '—'}</div>
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
              </>
            )}

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
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', letterSpacing: '0.08em' }}>РЕДКОСТЬ</div>
                <div style={{ marginBottom: '16px' }}>
                  <QltFilter value={alertQlt} onChange={setAlertQlt} />
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', letterSpacing: '0.08em' }}>МИН. ЗАТОЧКА (не менее чем)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px', marginBottom: '16px', height: '48px' }}>
                  <span style={{ color: 'var(--text-3)', fontSize: '16px', fontWeight: 700 }}>+</span>
                  <input
                    value={alertPtn}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '')
                      setAlertPtn(v === '' ? '' : String(Math.min(15, parseInt(v))))
                    }}
                    placeholder="Любая заточка"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '15px', fontWeight: 600 }}
                  />
                </div>
              </>
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
