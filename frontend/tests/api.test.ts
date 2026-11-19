import { expect, it, vi } from 'vitest'

it('uses the configured API URL and includes the session cookie', async () => {
  vi.stubEnv('VITE_API_URL', 'https://portal.example/api/')
  vi.resetModules()
  const fetchMock = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchMock)
  const { apiFetch } = await import('../src/api')
  await apiFetch('/api/projekti')
  expect(fetchMock).toHaveBeenCalledWith('https://portal.example/api/projekti', { credentials: 'include' })
})

it('rejects a path outside the API', async () => {
  const { apiFetch } = await import('../src/api')
  expect(() => apiFetch('https://other.example')).toThrow('API pot')
})
