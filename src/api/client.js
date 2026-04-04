const BASE_URL = import.meta.env.VITE_API_URL || ''
const tg = window.Telegram?.WebApp

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Init-Data': tg?.initData || 'test',
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  getRegions: () => request('GET', '/regions'),
  getMe: () => request('GET', '/users/me'),
  setRegion: (region) => request('POST', '/users/me', { region }),
  searchItems: (q) => request('GET', `/items/search?q=${encodeURIComponent(q)}`),
  getLots: (itemId) => request('GET', `/auction/${itemId}/lots`),
  getHistory: (itemId) => request('GET', `/auction/${itemId}/history?limit=200`),
  getAlerts: () => request('GET', '/alerts'),
  createAlert: (item_id, price_limit, qlt) => request('POST', '/alerts', { item_id, price_limit, qlt }),
  deleteAlert: (id) => request('DELETE', `/alerts/${id}`),
}
