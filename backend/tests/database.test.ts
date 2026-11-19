import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../src/app'
import { prisma } from '../src/prisma'
import { createAuthToken } from '../src/auth/jwt'

// Opt in explicitly; use a separate test database, never a production URL.
describe.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL integration', () => {
  const suffix = `${Date.now()}-${process.pid}`
  const password = 'integration-password-123'
  let adminId: number
  let editorId: number
  let assignedId: number
  let otherId: number
  const projectIds: number[] = []

  beforeAll(async () => {
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('DATABASE_URL must match TEST_DATABASE_URL')
    process.env.JWT_SECRET = 'integration-tests-only-secret'
    const gesloHash = await bcrypt.hash(password, 4)
    const admin = await prisma.uporabnik.create({ data: { email: `admin-${suffix}@example.com`, gesloHash, vloge: ['ADMIN'] } })
    adminId = admin.id
    const editor = await prisma.uporabnik.create({ data: { email: `editor-${suffix}@example.com`, gesloHash, vloge: ['UREDNIK'] } })
    editorId = editor.id
    const assigned = await prisma.knjiga.create({ data: { naslov: `Assigned ${suffix}`, uredniki_na_projektu: { connect: { id: editorId } } } })
    assignedId = assigned.id
    projectIds.push(assigned.id)
    const other = await prisma.knjiga.create({ data: { naslov: `Other ${suffix}` } })
    otherId = other.id
    projectIds.push(other.id)
  })

  afterAll(async () => {
    await prisma.knjiga.deleteMany({ where: { id: { in: projectIds } } })
    await prisma.uporabnik.deleteMany({ where: { email: { in: [`admin-${suffix}@example.com`, `editor-${suffix}@example.com`] } } })
    await prisma.$disconnect()
  })

  const auth = (id: number) => `auth_token=${createAuthToken(id)}`

  it('logs in using a real password hash and returns an HttpOnly session', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: `editor-${suffix}@example.com`, geslo: password })
    expect(response.status).toBe(200)
    expect(response.body).not.toHaveProperty('gesloHash')
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly')
    const session = response.headers['set-cookie']?.[0]?.split(';')[0]
    expect(session).toBeTruthy()
    const current = await request(app).get('/api/auth/me').set('Cookie', session!)
    expect(current.body.id).toBe(editorId)
  })

  it('returns only assigned projects to the editor from PostgreSQL', async () => {
    const response = await request(app).get('/api/projekti').set('Cookie', auth(editorId))
    expect(response.status).toBe(200)
    expect(response.body.map((item: { id: number }) => item.id)).toEqual([assignedId])
  })

  it('hides an unassigned project even when its ID is known', async () => {
    const response = await request(app).get(`/api/projekti/${otherId}`).set('Cookie', auth(editorId))
    expect(response.status).toBe(404)
  })

  it('prevents an editor from assigning themselves to another project', async () => {
    const response = await request(app).patch(`/api/projekti/${otherId}`).set('Cookie', auth(editorId)).send({ uredniki_na_projektu: [editorId] })
    expect(response.status).toBe(403)
  })

  it('persists edits to an assigned project', async () => {
    const response = await request(app).patch(`/api/projekti/${assignedId}`).set('Cookie', auth(editorId)).send({ naslov: 'Posodobljena knjiga', leto_izdaje: 2026 })
    expect(response.status).toBe(200)
    const saved = await prisma.knjiga.findUnique({ where: { id: assignedId } })
    expect(saved?.naslov).toBe('Posodobljena knjiga')
    expect(saved?.leto_izdaje).toBe(2026)
  })

  it('allows the administrator to create and delete a project', async () => {
    const created = await request(app).post('/api/projekti').set('Cookie', auth(adminId)).send({ naslov: 'Nova knjiga', uredniki_na_projektu: [editorId] })
    expect(created.status).toBe(201)
    projectIds.push(created.body.id)
    const deleted = await request(app).delete(`/api/projekti/${created.body.id}`).set('Cookie', auth(adminId))
    expect(deleted.status).toBe(204)
    expect(await prisma.knjiga.findUnique({ where: { id: created.body.id } })).toBeNull()
  })
})
