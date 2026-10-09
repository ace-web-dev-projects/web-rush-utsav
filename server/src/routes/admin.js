import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { createAdminToken, hashPassword } from '../security.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body ?? {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Provide a username and password.' })
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { username: username.trim() },
    })

    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    return res.json({
      token: createAdminToken(admin.id),
      admin: { id: admin.id, username: admin.username },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/control', requireAdminAuth, async (_req, res, next) => {
  try {
    const eventState = await prisma.eventState.findUnique({ where: { id: 1 } })
    return res.json({ eventState })
  } catch (error) {
    return next(error)
  }
})

router.put('/control/round', requireAdminAuth, async (req, res, next) => {
  const { round, action } = req.body ?? {}
  if (!Number.isInteger(round) || round < 1 || round > 6 || !['start', 'stop'].includes(action)) {
    return res.status(400).json({ error: 'Provide a round from 1 to 6 and a start or stop action.' })
  }

  try {
    const currentState = await prisma.eventState.findUnique({ where: { id: 1 } })

    if (
      action === 'stop' &&
      (!currentState || currentState.currentRound !== round || currentState.status !== 'ACTIVE')
    ) {
      return res.status(409).json({ error: 'That round is not currently active.' })
    }

    const now = new Date()
    const eventState = await prisma.eventState.upsert({
      where: { id: 1 },
      create: action === 'start'
        ? { id: 1, currentRound: round, status: 'ACTIVE', startedAt: now, endedAt: null }
        : { id: 1, currentRound: round, status: 'ENDED', endedAt: now },
      update: action === 'start'
        ? { currentRound: round, status: 'ACTIVE', startedAt: now, endedAt: null }
        : { status: 'ENDED', endedAt: now },
    })

    return res.json({ eventState, message: `Round ${round} ${action === 'start' ? 'started' : 'stopped'}.` })
  } catch (error) {
    return next(error)
  }
})

router.get('/teams', requireAdminAuth, async (_req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, teamCode: true, points: true },
      orderBy: { name: 'asc' },
    })
    return res.json({ teams })
  } catch (error) {
    return next(error)
  }
})

router.post('/teams', requireAdminAuth, async (req, res, next) => {
  const { name, teamCode, password } = req.body ?? {}

  if (
    typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
    typeof teamCode !== 'string' || !teamCode.trim() || teamCode.trim().length > 100 ||
    typeof password !== 'string' || password.length < 8
  ) {
    return res.status(400).json({ error: 'Provide a team name and code (up to 100 characters) and a password of at least 8 characters.' })
  }

  try {
    const passwordHash = await hashPassword(password)
    const team = await prisma.team.create({
      data: { name: name.trim(), teamCode: teamCode.trim(), passwordHash },
      select: { id: true, name: true, teamCode: true, points: true },
    })
    return res.status(201).json({ team })
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'That team code is already in use.' })
    }
    return next(error)
  }
})

router.delete('/teams/:teamId', requireAdminAuth, async (req, res, next) => {
  const teamId = Number(req.params.teamId)
  if (!Number.isSafeInteger(teamId) || teamId < 1) {
    return res.status(400).json({ error: 'Provide a valid team ID.' })
  }

  try {
    await prisma.team.delete({ where: { id: teamId } })
    return res.status(204).end()
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Team not found.' })
    }
    return next(error)
  }
})

router.patch('/teams/:teamId/points', requireAdminAuth, async (req, res, next) => {
  const teamId = Number(req.params.teamId)
  const { delta } = req.body ?? {}

  if (
    !Number.isSafeInteger(teamId) || teamId < 1 || !Number.isSafeInteger(delta) ||
    delta < -2147483648 || delta > 2147483647 || delta === 0
  ) {
    return res.status(400).json({ error: 'Provide a valid team ID and a non-zero whole-number points change.' })
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { points: { increment: delta } },
      select: { id: true, name: true, teamCode: true, points: true },
    })
    return res.json({ team })
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Team not found.' })
    }
    return next(error)
  }
})

router.get('/me', requireAdminAuth, async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.auth.adminId },
      select: { id: true, username: true },
    })

    if (!admin) {
      return res.status(401).json({ error: 'The admin token is invalid or expired.' })
    }

    return res.json({ admin })
  } catch (error) {
    return next(error)
  }
})

export default router
