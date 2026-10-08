import { readTeamToken } from '../security.js'

export function requireTeamAuth(req, res, next) {
  const authorization = req.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'A bearer token is required.' })
  }

  const identity = readTeamToken(token)
  if (!identity) {
    return res.status(401).json({ error: 'The token is invalid or expired.' })
  }

  req.auth = identity
  return next()
}
