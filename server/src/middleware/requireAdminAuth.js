import { readAdminToken } from '../security.js'

export function requireAdminAuth(req, res, next) {
  const authorization = req.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'An admin bearer token is required.' })
  }

  const identity = readAdminToken(token)
  if (!identity) {
    return res.status(401).json({ error: 'The admin token is invalid or expired.' })
  }

  req.auth = identity
  return next()
}
