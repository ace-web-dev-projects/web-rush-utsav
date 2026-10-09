import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'

const router = Router()
const puzzlesFile = fileURLToPath(new URL('../rounds/round-1/puzzles.json', import.meta.url))

async function loadPuzzleSet() {
  try {
    const data = JSON.parse(await readFile(puzzlesFile, 'utf8'))
    if (!Number.isInteger(data.maxAttempts) || data.maxAttempts < 1 || !Array.isArray(data.puzzles) || data.puzzles.length === 0) return null

    const ids = new Set()
    for (const puzzle of data.puzzles) {
      if (
        typeof puzzle.id !== 'string' || !puzzle.id.trim() || ids.has(puzzle.id) ||
        typeof puzzle.word !== 'string' || !/^[a-z]+$/i.test(puzzle.word) ||
        !Number.isSafeInteger(puzzle.points) || puzzle.points < 0
      ) return null
      ids.add(puzzle.id)
    }

    return {
      maxAttempts: data.maxAttempts,
      puzzles: data.puzzles.map((puzzle) => ({ ...puzzle, word: puzzle.word.toLowerCase() })),
    }
  } catch {
    return null
  }
}

async function isRound1Active() {
  const eventState = await prisma.eventState.findUnique({ where: { id: 1 }, select: { currentRound: true, status: true } })
  return eventState?.status === 'ACTIVE' && eventState.currentRound === 1
}

function getPublicProgress(progress, maxAttempts) {
  return {
    puzzleId: progress.puzzleId,
    attempts: progress.attempts,
    maxAttempts,
    guesses: progress.guesses,
    solved: progress.solvedAt !== null,
    failed: progress.solvedAt === null && progress.attempts >= maxAttempts,
    pointsAwarded: progress.pointsAwarded,
  }
}

async function prepareTeamProgress(teamId, puzzleSet) {
  await prisma.round1PuzzleProgress.createMany({
    data: puzzleSet.puzzles.map(({ id, word }) => ({ teamId, puzzleId: id, word })),
    skipDuplicates: true,
  })

  for (const puzzle of puzzleSet.puzzles) {
    await prisma.round1PuzzleProgress.updateMany({
      where: { teamId, puzzleId: puzzle.id, word: { not: puzzle.word } },
      data: { word: puzzle.word, guesses: [], attempts: 0, solvedAt: null, pointsAwarded: 0 },
    })
  }

  return prisma.round1PuzzleProgress.findMany({
    where: { teamId, puzzleId: { in: puzzleSet.puzzles.map(({ id }) => id) } },
  })
}

function scoreGuess(guess, answer) {
  const feedback = Array(guess.length).fill('absent')
  const remainingLetters = answer.split('')

  for (let index = 0; index < guess.length; index += 1) {
    if (guess[index] === answer[index]) {
      feedback[index] = 'correct'
      remainingLetters[index] = null
    }
  }

  for (let index = 0; index < guess.length; index += 1) {
    if (feedback[index] === 'correct') continue
    const matchingIndex = remainingLetters.indexOf(guess[index])
    if (matchingIndex !== -1) {
      feedback[index] = 'present'
      remainingLetters[matchingIndex] = null
    }
  }

  return feedback
}

router.get('/puzzles', requireTeamAuth, async (req, res, next) => {
  try {
    if (!(await isRound1Active())) return res.status(409).json({ error: 'Round 1 is not active.' })
    const puzzleSet = await loadPuzzleSet()
    if (!puzzleSet) return res.status(503).json({ error: 'Round 1 puzzles are not configured correctly.' })

    const progress = await prepareTeamProgress(req.auth.teamId, puzzleSet)
    return res.json({
      maxAttempts: puzzleSet.maxAttempts,
      puzzles: puzzleSet.puzzles.map(({ id, word, points }) => ({
        id,
        letterCount: word.length,
        points,
        progress: getPublicProgress(progress.find((item) => item.puzzleId === id), puzzleSet.maxAttempts),
      })),
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/check', requireTeamAuth, async (req, res, next) => {
  const { puzzleId, guess } = req.body ?? {}
  if (typeof puzzleId !== 'string' || typeof guess !== 'string') {
    return res.status(400).json({ error: 'Provide a puzzle ID and a word guess.' })
  }

  try {
    if (!(await isRound1Active())) return res.status(409).json({ error: 'Round 1 is not active.' })
    const puzzleSet = await loadPuzzleSet()
    if (!puzzleSet) return res.status(503).json({ error: 'Round 1 puzzles are not configured correctly.' })
    const puzzle = puzzleSet.puzzles.find((item) => item.id === puzzleId)
    if (!puzzle) return res.status(404).json({ error: 'That Round 1 question does not exist.' })

    const normalizedGuess = guess.trim().toLowerCase()
    if (!/^[a-z]+$/.test(normalizedGuess) || normalizedGuess.length !== puzzle.word.length) {
      return res.status(400).json({ error: `Enter a ${puzzle.word.length}-letter word using letters only.` })
    }

    await prepareTeamProgress(req.auth.teamId, puzzleSet)
    const progress = await prisma.round1PuzzleProgress.findUnique({
      where: { teamId_puzzleId: { teamId: req.auth.teamId, puzzleId } },
    })
    if (progress.solvedAt) {
      return res.json({ correct: true, alreadySolved: true, feedback: null, progress: getPublicProgress(progress, puzzleSet.maxAttempts) })
    }
    if (progress.attempts >= puzzleSet.maxAttempts) {
      return res.status(409).json({ error: 'You have used all attempts for this question.', progress: getPublicProgress(progress, puzzleSet.maxAttempts) })
    }

    const feedback = scoreGuess(normalizedGuess, puzzle.word)
    const correct = feedback.every((result) => result === 'correct')
    const guesses = [...progress.guesses, { guess: normalizedGuess, feedback }]
    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.round1PuzzleProgress.updateMany({
        where: { id: progress.id, attempts: progress.attempts, solvedAt: null },
        data: {
          guesses,
          attempts: progress.attempts + 1,
          ...(correct ? { solvedAt: new Date(), pointsAwarded: puzzle.points } : {}),
        },
      })
      if (changed.count === 0) return { conflict: true }

      const savedProgress = await tx.round1PuzzleProgress.findUnique({ where: { id: progress.id } })
      const team = correct
        ? await tx.team.update({
            where: { id: req.auth.teamId },
            data: { points: { increment: puzzle.points } },
            select: { points: true },
          })
        : null
      return { progress: savedProgress, totalPoints: team?.points ?? null }
    })

    if (updated.conflict) {
      const current = await prisma.round1PuzzleProgress.findUnique({ where: { id: progress.id } })
      return res.status(409).json({ error: 'Another guess was submitted at the same time. Refresh this question and try again.', progress: getPublicProgress(current, puzzleSet.maxAttempts) })
    }

    return res.json({
      correct,
      feedback,
      pointsAwarded: correct ? puzzle.points : 0,
      totalPoints: updated.totalPoints,
      progress: getPublicProgress(updated.progress, puzzleSet.maxAttempts),
    })
  } catch (error) {
    return next(error)
  }
})

export default router
