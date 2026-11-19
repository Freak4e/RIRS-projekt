import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { existsSync } from 'node:fs'
import authRouter from './routes/auth'
import userRouter from './routes/user'
import authorRouter from './routes/author'
import editorRouter from './routes/editor'
import projectRouter from './routes/project'
import { requireAuth } from './middleware/requireAuth'
import { requireRoles } from './middleware/requireRoles'
import { prisma } from './prisma'

export const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok' })
  } catch {
    res.status(503).json({ status: 'unavailable' })
  }
})
app.use('/api/auth', authRouter)
app.use('/api/users', requireAuth, requireRoles('ADMIN'), userRouter)
app.use('/api/avtorji', requireAuth, authorRouter)
app.use('/api/uredniki', editorRouter)
app.use('/api/projekti', projectRouter)
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Pot ne obstaja.' }) })

// One public origin keeps the existing HttpOnly, SameSite=Lax login working.
const publicDirectory = path.resolve(process.env.STATIC_DIR ?? 'public')
if (existsSync(path.join(publicDirectory, 'index.html'))) {
  app.use(express.static(publicDirectory))
  app.get('/{*path}', (_req, res) => { res.sendFile(path.join(publicDirectory, 'index.html')) })
}
