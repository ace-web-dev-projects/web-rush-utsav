import { Router } from 'express'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'

const router = Router()

router.get('/state', async (_req, res, next) => {
  try {
    const eventState = await prisma.eventState.findUnique({
      where: { id: 1 },
      select: {
        currentRound: true,
        status: true,
        startedAt: true,
        endedAt: true,
        round6BuzzedTeamId: true,
        round6BuzzedName: true,
      },
    })

    return res.json({ eventState })
  } catch (error) {
    return next(error)
  }
})

router.post('/round6/buzz', requireTeamAuth, async (req, res, next) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.auth.teamId },
      select: { id: true, name: true },
    })

    if (!team) return res.status(401).json({ error: 'The team account no longer exists.' })

    const result = await prisma.eventState.updateMany({
      where: {
        id: 1,
        status: 'ACTIVE',
        currentRound: 6,
        round6BuzzedTeamId: null,
      },
      data: { round6BuzzedTeamId: team.id, round6BuzzedName: team.name },
    })

    const eventState = await prisma.eventState.findUnique({
      where: { id: 1 },
      select: { currentRound: true, status: true, round6BuzzedTeamId: true, round6BuzzedName: true },
    })

    if (result.count === 0) {
      if (eventState?.status !== 'ACTIVE' || eventState.currentRound !== 6) {
        return res.status(409).json({ error: 'Round 6 is not active.', eventState })
      }
      return res.status(409).json({ error: 'The buzzer has already been claimed.', eventState })
    }

    return res.json({ eventState })
  } catch (error) {
    return next(error)
  }
})

router.get('/leaderboard', requireTeamAuth, async (_req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, points: true },
      orderBy: [{ points: 'desc' }, { name: 'asc' }],
    })

    let previousPoints = null
    let currentRank = 0
    const leaderboard = teams.map((team, index) => {
      if (team.points !== previousPoints) currentRank = index + 1
      previousPoints = team.points
      return { rank: currentRank, id: team.id, name: team.name, points: team.points }
    })

    return res.json({ leaderboard })
  } catch (error) {
    return next(error)
  }
})

export default router
