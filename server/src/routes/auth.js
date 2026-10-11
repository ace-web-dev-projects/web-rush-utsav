import { Router } from 'express'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'
import { createTeamToken, hashPassword, verifyPassword } from '../security.js'

const router = Router()
function publicTeam(team) {
  return {
    id: team.id,
    name: team.name,
    teamCode: team.teamCode,
    createdAt: team.createdAt,
  }
}

router.post('/register', async (req, res, next) => {
  const { name, teamCode, password } = req.body ?? {}

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof teamCode !== 'string' ||
    !teamCode.trim() ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    return res.status(400).json({
      error: 'Provide a team name, team code, and password of at least 8 characters.',
    })
  }

  try {
    const passwordHash = await hashPassword(password)
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        teamCode: teamCode.trim(),
        passwordHash,
      },
    })

    return res.status(201).json({
      token: createTeamToken(team.id),
      team: publicTeam(team),
    })
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'That team code is already registered.' })
    }
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  const { teamCode, password } = req.body ?? {}

  if (typeof teamCode !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Provide a team code and password.' })
  }

  try {
    const team = await prisma.team.findUnique({
      where: { teamCode: teamCode.trim() },
    })

    if (!team?.passwordHash || !(await verifyPassword(password, team.passwordHash))) {
      return res.status(401).json({ error: 'Invalid team code or password.' })
    }

    return res.json({ token: createTeamToken(team.id), team: publicTeam(team) })
  } catch (error) {
    return next(error)
  }
})

router.post('/team-name', requireTeamAuth, async (req, res, next) => {
  const { name } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return res.status(400).json({ error: 'Enter a team name up to 100 characters.' })
  }

  try {
    const current = await prisma.team.findUnique({ where: { id: req.auth.teamId } })
    if (!current) return res.status(401).json({ error: 'The token is invalid or expired.' })
    if (current.name?.trim()) return res.status(409).json({ error: 'The team name has already been set.' })

    const changed = await prisma.team.updateMany({
      where: { id: current.id, name: current.name },
      data: { name: name.trim() },
    })
    if (!changed.count) return res.status(409).json({ error: 'The team name has already been set.' })

    const team = await prisma.team.findUnique({ where: { id: current.id } })
    return res.json({ team: publicTeam(team) })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireTeamAuth, async (req, res, next) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.auth.teamId } })

    if (!team) {
      return res.status(401).json({ error: 'The token is invalid or expired.' })
    }

    return res.json({ team: publicTeam(team) })
  } catch (error) {
    return next(error)
  }
})

export default router
