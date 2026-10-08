import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const passwordSaltBytes = 16
const passwordKeyBytes = 64
const tokenLifetimeSeconds = 12 * 60 * 60

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.')
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export async function hashPassword(password) {
  const salt = randomBytes(passwordSaltBytes)
  const derivedKey = await scrypt(password, salt, passwordKeyBytes, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })

  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelism, saltText, keyText] = storedHash.split('$')
  if (
    algorithm !== 'scrypt' || cost !== '16384' || blockSize !== '8' ||
    parallelism !== '1' || !saltText || !keyText
  ) {
    return false
  }

  const salt = Buffer.from(saltText, 'base64url')
  const expectedKey = Buffer.from(keyText, 'base64url')
  if (salt.length !== passwordSaltBytes || expectedKey.length !== passwordKeyBytes) {
    return false
  }

  const actualKey = await scrypt(password, salt, passwordKeyBytes, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })

  return timingSafeEqual(actualKey, expectedKey)
}

function createToken(subject, role) {
  const now = Math.floor(Date.now() / 1000)
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
  const payload = encodeJson({
    sub: String(subject),
    role,
    iat: now,
    exp: now + tokenLifetimeSeconds,
  })
  const unsignedToken = `${header}.${payload}`
  const signature = createHmac('sha256', process.env.JWT_SECRET)
    .update(unsignedToken)
    .digest('base64url')

  return `${unsignedToken}.${signature}`
}

export function createTeamToken(teamId) {
  return createToken(teamId, 'team')
}

export function createAdminToken(adminId) {
  return createToken(adminId, 'admin')
}

function readToken(token, expectedRole) {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString())
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null

    const expectedSignature = createHmac('sha256', process.env.JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest()
    const providedSignature = Buffer.from(encodedSignature, 'base64url')
    if (
      providedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(providedSignature, expectedSignature)
    ) {
      return null
    }

    const subjectId = Number(payload.sub)
    const now = Math.floor(Date.now() / 1000)
    // Tokens issued before roles were added remain valid for team accounts only.
    const roleMatches = payload.role === expectedRole ||
      (expectedRole === 'team' && payload.role === undefined)
    if (
      !roleMatches || !Number.isSafeInteger(subjectId) || subjectId < 1 ||
      !Number.isFinite(payload.exp) || payload.exp <= now
    ) {
      return null
    }

    return expectedRole === 'team' ? { teamId: subjectId } : { adminId: subjectId }
  } catch {
    return null
  }
}

export function readTeamToken(token) {
  return readToken(token, 'team')
}

export function readAdminToken(token) {
  return readToken(token, 'admin')
}
