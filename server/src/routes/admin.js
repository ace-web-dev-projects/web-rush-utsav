import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { createAdminToken } from '../security.js'

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
