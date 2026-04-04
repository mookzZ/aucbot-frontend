import { useState } from 'react'
import { api } from '../api/client'

const REGIONS = ['EU', 'RU', 'NA', 'SEA']

export default function RegionSelect({ onDone }) {
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  async function choose(region) {
    setSelected(region)
    setLoading(true)
    try {
      await api.setRegion(region.toLowerCase())
      onDone(region.toLowerCase())
    } catch (e) {
      console.error(e)
      setLoading(false)
      setSelected(null)
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: 'var(--accent)',
          fontWeight: 700,
          marginBottom: '12px',
          textTransform: 'uppercase',
        }}>
          AUC BOT
        </div>
        <div style={{
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Выбери регион
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
          Данные аукциона привязаны к серверу
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        width: '100%',
        maxWidth: '280px',
      }}>
        {REGIONS.map(r => (
          <button
            key={r}
            onClick={() => choose(r)}
            disabled={loading}
            style={{
              background: selected === r ? 'var(--accent-dim)' : 'var(--bg-3)',
              border: `1px solid ${selected === r ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '8px',
              padding: '20px 12px',
              color: selected === r ? 'var(--accent)' : 'var(--text)',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
              opacity: loading && selected !== r ? 0.4 : 1,
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
