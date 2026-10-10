import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import eventRouter from './routes/event.js'
import submissionsRouter from './routes/submissions.js'
import round1Router from './routes/round1.js'
import round2Router from './routes/round2.js'
import { prisma } from './db.js'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before starting the server.')
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a secret with at least 32 characters.')
}

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/event', eventRouter)
app.use('/api/round1', round1Router)
app.use('/api/round2', round2Router)
app.use('/api/submissions', submissionsRouter)

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'An unexpected server error occurred.' })
})

const server = app.listen(port,'0.0.0.0', () => {
  console.log(`Web Rush API listening on port ${port}`)
})

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
