import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import useEventState from '../hooks/useEventState.js'
import { api, AUTH_TOKEN_KEY } from '../api.js'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const { eventState, error: eventStateError } = useEventState(Boolean(team))
  const [isCheckingSession, setIsCheckingSession] = useState(
    () => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),
  )

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      return
    }

    api.get('/auth/me')
      .then(({ data }) => setTeam(data.team))
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setTeam(null)
      })
      .finally(() => setIsCheckingSession(false))
  }, [])

  function handleSignOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setTeam(null)
    navigate('/login', { replace: true })
  }

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
    <main className="home-page">
      <header className="home-header">
        <BrandMark compact />
        <button className="home-header__signout" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <section className="home-welcome">
        <div className="eyebrow"><span className="eyebrow__dot" /> TEAM SPACE</div>
        <h1>Welcome, {team.name}.</h1>
        <p>You’re signed in and ready for Web Rush.</p>
        <div className="home-welcome__team-code">
          <span>TEAM CODE</span>
          <strong>{team.teamCode}</strong>
        </div>
      </section>
      <section className="team-event" aria-live="polite">
        {eventStateError && <p className="team-event__connection-error" role="status">{eventStateError}</p>}
        {eventState?.status === 'ACTIVE' &&
        Number.isInteger(eventState.currentRound) &&
        eventState.currentRound >= 1 && eventState.currentRound <= 6 ? (
          <ActiveRound round={eventState.currentRound} />
        ) : (
          <div className="team-event__waiting">
            <span className="team-event__waiting-dot" aria-hidden="true" />
            <div>
              <h2>Waiting for the host to start a round</h2>
              <p>The next round will appear here when it begins.</p>
            </div>
          </div>
        )}
      </section>
      <footer className="home-footer">WEB RUSH <span>•</span> TEAM EVENT PORTAL</footer>
    </main>
  )
}

function ActiveRound({ round }) {
  return (
    <article className="active-round">
      <div className="active-round__header">
        <div>
          <span className="active-round__eyebrow">ROUND 0{round} · LIVE</span>
          <h2>Round {round}</h2>
        </div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      <div className="active-round__content">
        <span>ROUND {round} AREA</span>
        <p>Round {round} is live. Round-specific content will appear here.</p>
      </div>
    </article>
  )
}

export default Home
