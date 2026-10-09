import { Router } from 'express'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'

const router = Router()

router.get('/state', async (_req, res, next) => {
  try {
    const eventState = await prisma.eventState.findUnique({
      where: { id: 1 },
      select: { currentRound: true, status: true, startedAt: true, endedAt: true },
    })

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
