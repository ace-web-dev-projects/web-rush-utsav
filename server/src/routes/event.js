import { Router } from 'express'
import { prisma } from '../db.js'

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

export default router
