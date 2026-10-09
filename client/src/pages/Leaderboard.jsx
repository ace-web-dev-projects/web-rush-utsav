import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TeamHeader from '../components/TeamHeader.jsx'
import { api, AUTH_TOKEN_KEY } from '../api.js'
import './Leaderboard.css'

const refreshInterval = 10000

function Leaderboard() {
  const [team, setTeam] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(
    () => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),
  )
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return

    let isMounted = true
    api.get('/auth/me')
      .then(({ data }) => {
        if (isMounted) setTeam(data.team)
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        if (isMounted) setTeam(null)
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!team) return undefined

    let isMounted = true
    let timeoutId

    async function refreshLeaderboard() {
      try {
        const { data } = await api.get('/event/leaderboard')
        if (isMounted) {
          setLeaderboard(data.leaderboard)
          setError('')
        }
      } catch {
        if (isMounted) setError('Could not load the leaderboard. Retrying...')
      } finally {
        if (isMounted) {
          setIsLoading(false)
          timeoutId = setTimeout(refreshLeaderboard, refreshInterval)
        }
      }
    }

    refreshLeaderboard()
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [team])

  if (isCheckingSession) {
    return (
      <main className="home-loading" aria-live="polite">
        <span className="home-loading__spinner" aria-hidden="true" />
        <p>Checking your team session…</p>
      </main>
    )
  }

  if (!team) return <Navigate to="/login" replace />

  return (
    <main className="home-page leaderboard-page">
      <TeamHeader />
      <section className="leaderboard-content" aria-live="polite">
        <div className="eyebrow"><span className="eyebrow__dot" /> LIVE STANDINGS</div>
        <div className="leaderboard-heading">
          <div>
            <h1>Leaderboard</h1>
            <p>Team scores, ranked by points.</p>
          </div>
          <span className="leaderboard-refresh">Updates every 10 seconds</span>
        </div>

        {error && <p className="leaderboard-error" role="status">{error}</p>}
        {isLoading ? (
          <p className="leaderboard-state">Loading teams…</p>
        ) : leaderboard.length === 0 ? (
          <p className="leaderboard-state">No teams have scores yet.</p>
        ) : (
          <ol className="leaderboard-list" aria-label="Team standings">
            {leaderboard.map((entry) => (
              <li
                className={`leaderboard-row${entry.id === team.id ? ' is-your-team' : ''}`}
                key={entry.id}
              >
                <span className="leaderboard-row__rank">{String(entry.rank).padStart(2, '0')}</span>
                <span className="leaderboard-row__name">
                  {entry.name}
                  {entry.id === team.id && <span className="leaderboard-row__you">YOUR TEAM</span>}
                </span>
                <strong className="leaderboard-row__points">{entry.points} <span>PTS</span></strong>
              </li>
            ))}
          </ol>
        )}
      </section>
      <footer className="home-footer">WEB RUSH <span>•</span> TEAM EVENT PORTAL</footer>
    </main>
  )
}

export default Leaderboard
