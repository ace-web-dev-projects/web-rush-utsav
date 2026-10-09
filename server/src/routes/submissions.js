import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'

const router = Router()
const maxFileSize = 10 * 1024 * 1024
const round5TotalPoints = 100

function getSubmissionDirectory(round, teamId, submissionId) {
  return fileURLToPath(
    new URL(`../validation/round-${round}/uploads/team-${teamId}/${submissionId}/`, import.meta.url),
  )
}

const storage = multer.diskStorage({
  destination(req, _file, callback) {
    const directory = getSubmissionDirectory(req.round, req.auth.teamId, req.submissionId)
    mkdir(directory, { recursive: true })
      .then(() => callback(null, directory))
      .catch(callback)
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).replace(/[^.a-zA-Z0-9]/g, '')
    callback(null, `${randomUUID()}${extension}`)
  },
})

const receiveFiles = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 10 },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 10 },
])

router.post('/round/5/answer', requireTeamAuth, async (req, res, next) => {
  const { password } = req.body ?? {}
  const correctPassword = process.env.ROUND_5_ANSWER

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Provide the Round 5 password as a non-empty string.' })
  }

  if (typeof correctPassword !== 'string' || correctPassword.length === 0) {
    return res.status(503).json({ error: 'Round 5 answer validation is not configured.' })
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: req.auth.teamId },
      select: { id: true },
    })
    if (!team) return res.status(401).json({ error: 'The team account no longer exists.' })

    const correctLetters = Array.from(correctPassword)
    const submittedLetters = Array.from(password)
    const matchedLetters = correctLetters.reduce(
      (total, letter, index) => total + Number(submittedLetters[index] === letter),
      0,
    )
    const percentage = (matchedLetters / correctLetters.length) * 100
    const points = Math.round((matchedLetters / correctLetters.length) * round5TotalPoints)

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: { points: { increment: points } },
      select: { points: true },
    })

    return res.json({
      round: 5,
      matchedLetters,
      totalLetters: correctLetters.length,
      percentage,
      pointsAwarded: points,
      totalPoints: updatedTeam.points,
    })
  } catch (error) {
    return next(error)
  }
})

function validateRound(req, res, next) {
  const round = Number(req.params.round)
  if (!Number.isInteger(round) || round < 1 || round > 6) {
    return res.status(400).json({ error: 'Round must be a number from 1 to 6.' })
  }

  req.round = round
  req.submissionId = randomUUID()
  return next()
}

function getSubmissionBody(req, res) {
  if (req.is('multipart/form-data')) {
    if (typeof req.body?.submission === 'string') {
      try {
        const submission = JSON.parse(req.body.submission)
        if (submission === null || typeof submission !== 'object') {
          res.status(400).json({ error: 'The submission field must contain a JSON object or array.' })
          return null
        }
        return submission
      } catch {
        res.status(400).json({ error: 'The submission field must contain valid JSON.' })
        return null
      }
    }

    return req.body && Object.keys(req.body).length > 0 ? req.body : null
  }

  return req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? req.body
    : null
}

router.post('/round/:round', requireTeamAuth, validateRound, receiveFiles, async (req, res, next) => {
  const files = [...(req.files?.file ?? []), ...(req.files?.files ?? [])]
  const submission = getSubmissionBody(req, res)
  if (res.headersSent) return

  if (files.length === 0 && submission === null) {
    return res.status(400).json({ error: 'Include a JSON submission or at least one file.' })
  }

  try {
    let submissionFile = null
    if (submission !== null) {
      submissionFile = 'submission.json'
      const directory = getSubmissionDirectory(req.round, req.auth.teamId, req.submissionId)
      await mkdir(directory, { recursive: true })
      await writeFile(
        path.join(directory, submissionFile),
        JSON.stringify({ teamId: req.auth.teamId, round: req.round, submission }, null, 2),
        'utf8',
      )
    }

    return res.status(202).json({
      message: 'Submission received.',
      round: req.round,
      submissionId: req.submissionId,
      files: files.map((file) => ({
        originalName: file.originalname,
        storedName: file.filename,
        size: file.size,
        mimeType: file.mimetype,
      })),
      submissionFile,
    })
  } catch (error) {
    return next(error)
  }
})

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    return res.status(status).json({ error: error.message })
  }
  return next(error)
})

export default router
