import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'

const router = Router()
const questionsFile = fileURLToPath(new URL('../rounds/round-3/questions.json', import.meta.url))

export async function loadRound3Questions() {
  try {
    const data = JSON.parse(await readFile(questionsFile, 'utf8'))
    if (!Array.isArray(data.questions)) return null
    const ids = new Set()
    for (const question of data.questions) {
      if (typeof question.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(question.id) || ids.has(question.id) ||
          typeof question.title !== 'string' || typeof question.instructions !== 'string' ||
          typeof question.image !== 'string' || typeof question.code !== 'string') return null
      ids.add(question.id)
    }
    return data.questions
  } catch {
    return null
  }
}

router.get('/questions', requireTeamAuth, async (_req, res, next) => {
  try {
    const state = await prisma.eventState.findUnique({ where: { id: 1 }, select: { currentRound: true, status: true } })
    if (state?.status !== 'ACTIVE' || state.currentRound !== 3) return res.status(409).json({ error: 'Round 3 is not active.' })
    const questions = await loadRound3Questions()
    if (!questions) return res.status(503).json({ error: 'Round 3 questions are not configured correctly.' })
    return res.json({ questions })
  } catch (error) { return next(error) }
})

export default router
