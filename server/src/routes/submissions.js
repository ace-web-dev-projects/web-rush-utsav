import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile as readStoredFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../db.js'
import { requireTeamAuth } from '../middleware/requireTeamAuth.js'
import { loadRound5Answer, validateRound5Answer } from '../validation/round-5/validate.js'
import { loadRound3Questions } from './round3.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'

const router = Router()
const maxFileSize = 10 * 1024 * 1024

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

function validateRound(req, res, next) {
  const round = Number(req.params.round)
  if (!Number.isInteger(round) || round < 1 || round > 6) {
    return res.status(400).json({ error: 'Round must be a number from 1 to 6.' })
  }

  req.round = round
  req.submissionId = randomUUID()
  req.submittedAt = new Date()
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

  let round5Score = null
  if (req.round === 5) {
    if (typeof submission?.password !== 'string' || submission.password.length === 0) {
      return res.status(400).json({ error: 'Include the Round 5 answer in a password field.' })
    }

    const correctPassword = await loadRound5Answer()
    if (!correctPassword) {
      return res.status(503).json({ error: 'Round 5 answer validation is not configured.' })
    }

    round5Score = validateRound5Answer(submission.password, correctPassword)
  }

  if (req.round === 3) {
    const questionId = submission?.questionId
    const state = await prisma.eventState.findUnique({ where: { id: 1 }, select: { currentRound: true, status: true } })
    const questions = await loadRound3Questions()
    if (state?.status !== 'ACTIVE' || state.currentRound !== 3) return res.status(409).json({ error: 'Round 3 is not active.' })
    if (!questions || !questions.some((question) => question.id === questionId)) {
      return res.status(400).json({ error: 'Choose a valid Round 3 question.' })
    }
    if (files.length === 0) return res.status(400).json({ error: 'Choose at least one file to upload.' })
  }

  try {
    let submissionFile = null
    if (submission !== null) {
      submissionFile = 'submission.json'
      const directory = getSubmissionDirectory(req.round, req.auth.teamId, req.submissionId)
      await mkdir(directory, { recursive: true })
      await writeFile(
        path.join(directory, submissionFile),
        JSON.stringify({ teamId: req.auth.teamId, round: req.round, submittedAt: req.submittedAt.toISOString(), submission,
          files: files.map((file) => ({ originalName: file.originalname, storedName: file.filename, size: file.size, mimeType: file.mimetype })) }, null, 2),
        'utf8',
      )
    }

    let totalPoints = null
    if (round5Score) {
      const updatedTeam = await prisma.team.update({
        where: { id: req.auth.teamId },
        data: { points: { increment: round5Score.pointsAwarded } },
        select: { points: true },
      })
      totalPoints = updatedTeam.points
    }

    return res.status(round5Score ? 200 : 202).json({
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
      ...(round5Score ? { score: { ...round5Score, totalPoints } } : {}),
    })
  } catch (error) {
    return next(error)
  }
})

const round3UploadsDirectory = fileURLToPath(new URL('../validation/round-3/uploads/', import.meta.url))
router.get('/admin/round/3', requireAdminAuth, async (_req, res, next) => {
  try {
    const questions = await loadRound3Questions()
    if (!questions) return res.status(503).json({ error: 'Round 3 questions are not configured correctly.' })
    const submissionsByQuestion = Object.fromEntries(questions.map(({ id }) => [id, []]))
    let teamDirectories = []
    try { teamDirectories = await readdir(round3UploadsDirectory, { withFileTypes: true }) } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    for (const teamDirectory of teamDirectories.filter((item) => item.isDirectory() && /^team-\d+$/.test(item.name))) {
      const teamId = Number(teamDirectory.name.slice(5))
      const submissionDirectories = await readdir(path.join(round3UploadsDirectory, teamDirectory.name), { withFileTypes: true })
      for (const submissionDirectory of submissionDirectories.filter((item) => item.isDirectory() && /^[\da-f-]{36}$/i.test(item.name))) {
        try {
          const metadata = JSON.parse(await readStoredFile(path.join(round3UploadsDirectory, teamDirectory.name, submissionDirectory.name, 'submission.json'), 'utf8'))
          const questionId = metadata.submission?.questionId
          if (!submissionsByQuestion[questionId]) continue
          const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true, teamCode: true } })
          if (!team) continue
          submissionsByQuestion[questionId].push({ teamId, teamName: team.name, teamCode: team.teamCode,
            submissionId: submissionDirectory.name, submittedAt: metadata.submittedAt,
            files: (metadata.files ?? []).map(({ originalName, storedName, size, mimeType }) => ({ originalName, storedName, size, mimeType })) })
        } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error }
      }
    }
    for (const items of Object.values(submissionsByQuestion)) items.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    return res.json({ questions: questions.map(({ id, title }) => ({ id, title, submissions: submissionsByQuestion[id] })) })
  } catch (error) { return next(error) }
})

router.get('/admin/round/3/:teamId/:submissionId/:fileName', requireAdminAuth, async (req, res, next) => {
  const { teamId, submissionId, fileName } = req.params
  if (!/^\d+$/.test(teamId) || !/^[\da-f-]{36}$/i.test(submissionId) || !/^[\da-f-]{36}(\.[a-zA-Z0-9]{1,10})?$/.test(fileName)) {
    return res.status(400).json({ error: 'Invalid uploaded file reference.' })
  }
  try {
    const filePath = path.join(round3UploadsDirectory, `team-${teamId}`, submissionId, fileName)
    return res.download(filePath)
  } catch (error) { return next(error) }
})

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    return res.status(status).json({ error: error.message })
  }
  return next(error)
})

export default router
