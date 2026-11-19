import { render, screen, waitFor, renderHook, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProjectCompletion from '../src/components/ProjectCompletion/ProjectCompletion'
import RequireAuth from '../src/components/RequireAuth'
import Prijava from '../src/pages/Prijava/Prijava'
import { usePermissions } from '../src/hooks/usePermissions'

describe('project completion badge', () => {
  it.each([[45, '45%'], [-10, '0%'], [150, '100%']])('renders and bounds %s', (value, text) => {
    render(<ProjectCompletion value={value as number} position="card" />)
    expect(screen.getByLabelText(`Izpolnjenost ${text}`)).toHaveTextContent(text)
  })
})

describe('permissions', () => {
  it.each(['ADMIN', 'GLAVNI_UREDNIK'])('allows management for %s', async (role) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ vloge: [role] }) }))
    const { result } = renderHook(usePermissions)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.canManage).toBe(true)
  })
  it('does not allow editors to manage accounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ vloge: ['UREDNIK'] }) }))
    const { result } = renderHook(usePermissions)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.canManage).toBe(false)
  })
  it('fails closed on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { result } = renderHook(usePermissions)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.canManage).toBe(false)
  })
})

function protectedPage() {
  return render(<MemoryRouter initialEntries={['/projekti']}><Routes>
    <Route path="/prijava" element={<p>Prijavni obrazec</p>} />
    <Route element={<RequireAuth />}><Route path="/projekti" element={<p>Vsebina projektov</p>} /></Route>
  </Routes></MemoryRouter>)
}

describe('protected routes', () => {
  it('shows loading while checking the session', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    protectedPage()
    expect(screen.getByRole('status')).toHaveTextContent('Preverjam prijavo')
  })
  it('redirects anonymous visitors to login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    protectedPage()
    expect(await screen.findByText('Prijavni obrazec')).toBeVisible()
  })
  it('displays protected content for an authenticated visitor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    protectedPage()
    expect(await screen.findByText('Vsebina projektov')).toBeVisible()
  })
})

describe('login form', () => {
  it('displays the backend error for incorrect credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Napačen email ali geslo.' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><Prijava /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'editor@example.com' } })
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'wrong-password' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Prijava' }).closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Napačen email ali geslo.')
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify({ email: 'editor@example.com', geslo: 'wrong-password' }) }))
  })
  it('displays a useful message when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<MemoryRouter><Prijava /></MemoryRouter>)
    fireEvent.submit(screen.getByRole('button', { name: 'Prijava' }).closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Povezava s strežnikom ni uspela.')
  })
})
