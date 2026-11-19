import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../src/prisma', () => ({ prisma: {
  uporabnik: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  avtor: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  knjiga: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  $queryRaw: vi.fn(),
} }))

import { app } from '../src/app'
import { prisma } from '../src/prisma'
import { createAuthToken } from '../src/auth/jwt'
import { calculateProjectCompletion, getProjects, getProjectById } from '../src/services/projectService'

const cookie = (id = 1) => `auth_token=${createAuthToken(id)}`
const user = { id: 1, email: 'admin@example.com', ime: null, priimek: null, vloge: ['ADMIN'], gesloHash: null }

beforeEach(() => {
  vi.resetAllMocks()
  process.env.JWT_SECRET = 'only-for-tests-a-long-fixed-secret'
  vi.mocked(prisma.uporabnik.findUnique).mockResolvedValue(user as never)
})

describe('API authentication and validation', () => {
  it.each(['/api/projekti', '/api/avtorji', '/api/users', '/api/uredniki', '/api/auth/me'])(
    'rejects anonymous reads of %s', async (path) => {
      expect((await request(app).get(path)).status).toBe(401)
      expect(prisma.uporabnik.findUnique).not.toHaveBeenCalled()
    },
  )
  it('rejects anonymous registration', async () => {
    expect((await request(app).post('/api/auth/register').send({ email: 'a@b.si', geslo: 'password1' })).status).toBe(401)
    expect(prisma.uporabnik.create).not.toHaveBeenCalled()
  })
  it('rejects a forged cookie', async () => {
    expect((await request(app).get('/api/auth/me').set('Cookie', 'auth_token=invalid')).status).toBe(401)
  })
  it('rejects an expired JWT', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET!, { issuer: 'uredniski-portal', subject: '1', expiresIn: -1 })
    expect((await request(app).get('/api/auth/me').set('Cookie', `auth_token=${token}`)).status).toBe(401)
  })
  it('rejects a JWT from a different issuer', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET!, { issuer: 'other', subject: '1' })
    expect((await request(app).get('/api/auth/me').set('Cookie', `auth_token=${token}`)).status).toBe(401)
  })
  it('rejects a nonnumeric JWT subject', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET!, { issuer: 'uredniski-portal', subject: 'abc' })
    expect((await request(app).get('/api/auth/me').set('Cookie', `auth_token=${token}`)).status).toBe(401)
  })
  it('rejects missing login data without reading the database', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400)
    expect(prisma.uporabnik.findUnique).not.toHaveBeenCalled()
  })
  it('rejects an unknown login', async () => {
    vi.mocked(prisma.uporabnik.findUnique).mockResolvedValue(null)
    expect((await request(app).post('/api/auth/login').send({ email: 'none@example.com', geslo: 'password1' })).status).toBe(401)
  })
  it('rejects short passwords for administrator-created accounts', async () => {
    expect((await request(app).post('/api/auth/register').set('Cookie', cookie()).send({ email: 'a@b.si', geslo: 'short' })).status).toBe(400)
    expect(prisma.uporabnik.create).not.toHaveBeenCalled()
  })
  it('blocks editors from registering accounts', async () => {
    vi.mocked(prisma.uporabnik.findUnique).mockResolvedValue({ ...user, vloge: ['UREDNIK'] } as never)
    expect((await request(app).post('/api/auth/register').set('Cookie', cookie()).send({ email: 'a@b.si', geslo: 'password1' })).status).toBe(403)
  })
  it('does not replace the administrator session when creating an account', async () => {
    vi.mocked(prisma.uporabnik.create).mockResolvedValue({ ...user, id: 2 } as never)
    const result = await request(app).post('/api/auth/register').set('Cookie', cookie()).send({ email: 'new@example.com', geslo: 'password1' })
    expect(result.status).toBe(201)
    expect(result.headers['set-cookie']).toBeUndefined()
  })
  it('blocks editors from creating projects', async () => {
    vi.mocked(prisma.uporabnik.findUnique).mockResolvedValue({ ...user, vloge: ['UREDNIK'] } as never)
    expect((await request(app).post('/api/projekti').set('Cookie', cookie()).send({ naslov: 'Knjiga' })).status).toBe(403)
    expect(prisma.knjiga.create).not.toHaveBeenCalled()
  })
  it('validates project numeric fields', async () => {
    expect((await request(app).post('/api/projekti').set('Cookie', cookie()).send({ leto_izdaje: 'wrong' })).status).toBe(400)
  })
  it('validates author enum values', async () => {
    expect((await request(app).patch('/api/avtorji/1').set('Cookie', cookie()).send({ spol: 'wrong' })).status).toBe(400)
    expect(prisma.avtor.update).not.toHaveBeenCalled()
  })
  it('rejects invalid project IDs', async () => {
    expect((await request(app).get('/api/projekti/-1').set('Cookie', cookie())).status).toBe(400)
  })
  it('clears the session on logout', async () => {
    const result = await request(app).post('/api/auth/logout')
    expect(result.status).toBe(204)
    expect(result.headers['set-cookie']?.[0]).toContain('auth_token=;')
  })
  it('reports database availability', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ value: 1 }])
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' })
  })
  it('fails readiness when the database fails', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('offline'))
    expect((await request(app).get('/api/health')).status).toBe(503)
  })
})

describe('project business logic', () => {
  it('reports zero for an empty project', () => {
    expect(calculateProjectCompletion({})).toBe(0)
  })
  it('ignores blank text, null and empty relations', () => {
    expect(calculateProjectCompletion({ naslov: '  ', leto_izdaje: null, avtorji: [] })).toBe(0)
  })
  it('counts false and zero as completed answers', () => {
    expect(calculateProjectCompletion({ prva_izdaja: false, naklada: 0 })).toBe(5)
  })
  it('counts populated relations', () => {
    expect(calculateProjectCompletion({ avtorji: [{ id: 1 }] })).toBe(2)
  })
  it('filters editor project lists by assignment', async () => {
    vi.mocked(prisma.uporabnik.findUnique).mockResolvedValue({ ...user, vloge: ['UREDNIK'] } as never)
    vi.mocked(prisma.knjiga.findMany).mockResolvedValue([])
    await getProjects(7)
    expect(prisma.knjiga.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { uredniki_na_projektu: { some: { id: 7 } } } }))
  })
  it('allows administrators to list every project', async () => {
    vi.mocked(prisma.knjiga.findMany).mockResolvedValue([])
    await getProjects(1)
    expect(vi.mocked(prisma.knjiga.findMany).mock.calls[0]?.[0]).not.toHaveProperty('where')
  })
  it('filters direct project detail access by assignment', async () => {
    vi.mocked(prisma.uporabnik.findUnique).mockResolvedValue({ ...user, vloge: ['UREDNIK'] } as never)
    vi.mocked(prisma.knjiga.findFirst).mockResolvedValue(null)
    expect(await getProjectById(7, 99)).toBeNull()
    expect(prisma.knjiga.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 99, uredniki_na_projektu: { some: { id: 7 } } } }))
  })
})
