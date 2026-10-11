import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'

const router = Router()
const questionsFile = fileURLToPath(new URL('../rounds/round-2/questions.json', import.meta.url))
const maxAttempts = 2
const firstAttemptPoints = 6
const secondAttemptPoints = 4

async function loadQuestionSet() {
  try {
    const data = JSON.parse(await readFile(questionsFile, 'utf8'))
    if (!Array.isArray(data.questions)) return null
    const ids = new Set()
    for (const question of data.questions) {
      if (typeof question.id !== 'string' || !question.id.trim() || ids.has(question.id) ||
          typeof question.answer !== 'string' || !question.answer.trim() ||
          !Number.isFinite(question.points) || question.points < 0) return null
      ids.add(question.id)
    }
    return data.questions.map((question) => ({ ...question, answer: question.answer.trim().toLowerCase() }))
  } catch {
    return null
  }
}

async function round2IsActive() {
  const state = await prisma.eventState.findUnique({ where: { id: 1 }, select: { currentRound: true, status: true } })
  return state?.status === 'ACTIVE' && state.currentRound === 2
}

function publicProgress(progress) {
  return {
    attempts: progress.attempts,
    maxAttempts,
    solved: progress.solvedAt !== null,
    finished: progress.solvedAt !== null || progress.attempts >= maxAttempts,
    pointsAwarded: progress.pointsAwarded,
  }
}

async function prepareProgress(teamId, questions) {
  await prisma.round2QuestionProgress.createMany({
    data: questions.map(({ id: questionId, answer }) => ({ teamId, questionId, answer })),
    skipDuplicates: true,
  })
  for (const question of questions) {
    await prisma.round2QuestionProgress.updateMany({
      where: { teamId, questionId: question.id, answer: { not: question.answer } },
      data: { answer: question.answer, attempts: 0, solvedAt: null, pointsAwarded: 0 },
    })
  }
  return prisma.round2QuestionProgress.findMany({
    where: { teamId, questionId: { in: questions.map(({ id }) => id) } },
  })
}

router.get('/questions', requireTeamAuth, async (req, res, next) => {
  try {
    if (!(await round2IsActive())) return res.status(409).json({ error: 'Round 2 is not active.' })
    const questions = await loadQuestionSet()
    if (!questions) return res.status(503).json({ error: 'Round 2 questions are not configured correctly.' })
    const progress = await prepareProgress(req.auth.teamId, questions)
    return res.json({ questions: questions.map(({ id }) => ({
      id, points: firstAttemptPoints, progress: publicProgress(progress.find((item) => item.questionId === id)),
    })) })
  } catch (error) { return next(error) }
})

router.post('/submit', requireTeamAuth, async (req, res, next) => {
  const { questionId, answer } = req.body ?? {}
  if (typeof questionId !== 'string' || typeof answer !== 'string' || !answer.trim()) {
    return res.status(400).json({ error: 'Provide a question ID and an answer.' })
  }
  try {
    if (!(await round2IsActive())) return res.status(409).json({ error: 'Round 2 is not active.' })
    const questions = await loadQuestionSet()
    if (!questions) return res.status(503).json({ error: 'Round 2 questions are not configured correctly.' })
    const question = questions.find((item) => item.id === questionId)
    if (!question) return res.status(404).json({ error: 'That Round 2 question does not exist.' })
    await prepareProgress(req.auth.teamId, questions)
    const progress = await prisma.round2QuestionProgress.findUnique({ where: { teamId_questionId: { teamId: req.auth.teamId, questionId } } })
    if (progress.solvedAt || progress.attempts >= maxAttempts) {
      return res.status(409).json({ error: 'All attempts for this question have been used.', progress: publicProgress(progress) })
    }

    const correct = answer.trim().toLowerCase() === question.answer
    const pointsAwarded = correct ? (progress.attempts === 0 ? firstAttemptPoints : secondAttemptPoints) : 0
    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.round2QuestionProgress.updateMany({
        where: { id: progress.id, attempts: progress.attempts, solvedAt: null },
        data: {
          attempts: progress.attempts + 1,
          ...(correct ? { solvedAt: new Date(), pointsAwarded } : {}),
        },
      })
      if (!changed.count) return { conflict: true }
      const savedProgress = await tx.round2QuestionProgress.findUnique({ where: { id: progress.id } })
      const team = correct ? await tx.team.update({
        where: { id: req.auth.teamId }, data: { points: { increment: pointsAwarded } }, select: { points: true },
      }) : null
      return { progress: savedProgress, totalPoints: team?.points ?? null }
    })
    if (updated.conflict) {
      const current = await prisma.round2QuestionProgress.findUnique({ where: { id: progress.id } })
      return res.status(409).json({ error: 'An answer was submitted at the same time. Refresh this question.', progress: publicProgress(current) })
    }
    return res.json({ correct, pointsAwarded, totalPoints: updated.totalPoints, progress: publicProgress(updated.progress) })
  } catch (error) { return next(error) }
})

export default router
