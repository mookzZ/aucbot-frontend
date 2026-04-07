import { useState, useRef, useCallback } from 'react'
import { api } from '../api/client'

function Spinner() {
  return (
    <div style={{ width: 22, height: 22, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Clan list / search ────────────────────────────────────────────────────────

function ClanSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const search = useCallback((q) => {
    setQuery(q)
    clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try { setResults(await api.searchClans(q)) } catch {}
      finally { setLoading(false) }
    }, 350)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Поиск клана..."
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 0', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}
          />
          {loading && <Spinner />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              style={{ background: 'none', color: 'var(--text-3)', fontSize: '18px', lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
        {query.length < 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style={{ fontSize: '13px' }}>Введи название клана</span>
          </div>
        )}

        {results.length === 0 && query.length >= 2 && !loading && (
          <div style={{ textAlign: 'center', paddingTop: '40px', color: 'var(--text-3)', fontSize: '13px' }}>
            Кланы не найдены
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: results.length ? '8px' : 0 }}>
          {results.map(clan => (
            <div key={clan.id} onClick={() => onSelect(clan)}
              style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace' }}>#{clan.id}</span>
                  {clan.tag && (
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)', borderRadius: '4px', padding: '2px 7px' }}>
                      {clan.tag}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                {clan.alliance && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Альянс: <span style={{ color: 'var(--text-2)' }}>{clan.alliance}</span></span>}
                {clan.member_count != null && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Участников: <span style={{ color: 'var(--text-2)' }}>{clan.member_count}</span></span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Clan profile ──────────────────────────────────────────────────────────────

function ClanProfile({ clan, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [opponentQ, setOpponentQ] = useState('')

  useState(() => {
    api.getClanHistory(clan.id).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [clan.id])

  const matches = data?.matches ?? []
  const filtered = opponentQ.length >= 2
    ? matches.filter(m => m.opponent_name.toLowerCase().includes(opponentQ.toLowerCase()))
    : matches

  const wins = matches.filter(m => m.result === 'win').length
  const losses = matches.filter(m => m.result === 'loss').length
  const draws = matches.filter(m => m.result === 'draw').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', color: 'var(--text-3)', padding: '4px', display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clan.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace' }}>#{clan.id}</span>
          {clan.tag && (
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)', borderRadius: '4px', padding: '2px 7px' }}>
              {clan.tag}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <Spinner />
          </div>
        )}

        {!loading && (
          <>
            {/* Info card */}
            <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: clan.leader ? '12px' : 0 }}>
                {[
                  ['Альянс', clan.alliance || '—'],
                  ['Участников', clan.member_count ?? '—'],
                  clan.leader ? ['Лидер', clan.leader] : null,
                  ['Регион', clan.region?.toUpperCase() || 'RU'],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: '3px' }}>{label.toUpperCase()}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              {matches.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    ['ПОБЕДЫ', wins, 'var(--success)'],
                    ['НИЧЬИ', draws, 'var(--text-2)'],
                    ['ПОРАЖЕНИЯ', losses, 'var(--danger)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Match search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px', marginBottom: '10px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={opponentQ}
                onChange={e => setOpponentQ(e.target.value)}
                placeholder="Поиск по противнику..."
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 0', color: 'var(--text)', fontSize: '13px' }}
              />
              {opponentQ && (
                <button onClick={() => setOpponentQ('')} style={{ background: 'none', color: 'var(--text-3)', fontSize: '16px', lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Matches */}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: '24px', color: 'var(--text-3)', fontSize: '13px' }}>
                {matches.length === 0 ? 'Матчи не найдены' : 'Нет совпадений'}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(m => {
                const [myScore, oppScore] = m.score.split(':').map(Number)
                const resultColor = m.result === 'win' ? 'var(--success)' : m.result === 'loss' ? 'var(--danger)' : 'var(--text-2)'
                const resultLabel = m.result === 'win' ? 'П' : m.result === 'loss' ? 'П' : 'Н'
                const resultBg = m.result === 'win' ? 'var(--success-dim)' : m.result === 'loss' ? 'var(--danger-dim)' : 'rgba(144,144,168,0.1)'

                return (
                  <div key={m.match_id} style={{ background: 'var(--bg-3)', border: `1px solid ${m.result === 'win' ? 'rgba(80,200,120,0.2)' : m.result === 'loss' ? 'rgba(224,80,80,0.2)' : 'var(--border)'}`, borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Result badge */}
                      <div style={{ width: 28, height: 28, borderRadius: '6px', background: resultBg, border: `1px solid ${resultColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: resultColor }}>
                          {m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}
                        </span>
                      </div>

                      {/* Score */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: resultColor }}>{myScore}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>:</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: m.result === 'loss' ? 'var(--success)' : m.result === 'win' ? 'var(--danger)' : 'var(--text-2)' }}>{oppScore}</span>
                      </div>

                      {/* VS */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '1px' }}>vs</div>
                        <div style={{ fontWeight: 700, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.opponent_name}
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>
                          {new Date(m.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                          Гр. {m.group_number}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function ClansPage() {
  const [selectedClan, setSelectedClan] = useState(null)

  if (selectedClan) {
    return <ClanProfile clan={selectedClan} onBack={() => setSelectedClan(null)} />
  }

  return <ClanSearch onSelect={setSelectedClan} />
}
