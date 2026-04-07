const TABS = [
  {
    key: 'auction',
    label: 'Аукцион',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
  },
  {
    key: 'clans',
    label: 'Кланы',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'alerts',
    label: 'Алерты',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
]

export default function NavBar({ active, onChange }) {
  return (
    <div style={{
      height: 'var(--nav-h)',
      display: 'flex',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-2)',
      flexShrink: 0,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            background: 'transparent',
            borderTop: `2px solid ${active === tab.key ? 'var(--accent)' : 'transparent'}`,
            transition: 'all 0.15s',
          }}
        >
          {tab.icon(active === tab.key)}
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: active === tab.key ? 'var(--accent)' : 'var(--text-3)',
            transition: 'color 0.15s',
          }}>
            {tab.label.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  )
}
