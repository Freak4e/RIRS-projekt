const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

/** Keep cookies on every API call; VITE_API_URL is set at build time. */
export function apiFetch(path: string, options?: RequestInit) {
  if (!path.startsWith('/api/')) throw new Error('API pot se mora začeti z /api/.')
  return fetch(`${apiBase}${path.slice(4)}`, { ...options, credentials: 'include' })
}
