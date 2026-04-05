import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { QLT } from './AuctionPage'

export default function AlertsPage({ onGoToItem }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setAlerts(await api.getAlerts()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function remove(id) {
    setDeleting(id)
    try {
      await api.deleteAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
    finally { setDeleting(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>Мои алерты</div>
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>
          {alerts.length}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: 'var(--text-3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span style={{ fontSize: '13px' }}>Нет активных алертов</span>
            <span style={{ fontSize: '11px' }}>Создай алерт на вкладке аукциона</span>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map(alert => {
              const qltInfo = alert.qlt != null ? QLT[alert.qlt] : null
              return (
                <div key={alert.id} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={alert.icon_url} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
                    onError={e => e.target.style.display = 'none'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.name_ru || alert.name_en}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{alert.item_id}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {/* Price limit */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)', borderRadius: '4px', padding: '3px 8px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.05em' }}>ЛИМИТ</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{alert.price_limit?.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      {/* Quality */}
                      {qltInfo && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', border: `1px solid ${qltInfo.color}50`, borderRadius: '4px', padding: '3px 8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: qltInfo.color }}>{qltInfo.label}</span>
                        </div>
                      )}
                      {/* Ptn */}
                      {alert.ptn_min != null && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', border: '1px solid var(--border-bright)', borderRadius: '4px', padding: '3px 8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)' }}>+{alert.ptn_min}+</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onGoToItem({
                      id: alert.item_id,
                      name_ru: alert.name_ru,
                      name_en: alert.name_en,
                      icon_url: alert.icon_url,
                      category: alert.category,
                    })} style={{
                    width: 32, height: 32, flexShrink: 0,
                    background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)',
                    borderRadius: '7px', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                  <button onClick={() => remove(alert.id)} disabled={deleting === alert.id} style={{
                    width: 32, height: 32, flexShrink: 0,
                    background: 'var(--danger-dim)', border: '1px solid var(--danger)',
                    borderRadius: '7px', color: 'var(--danger)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: deleting === alert.id ? 0.5 : 1, transition: 'opacity 0.15s',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
