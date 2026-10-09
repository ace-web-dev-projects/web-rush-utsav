import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TeamHeader from '../components/TeamHeader.jsx'
import useEventState from '../hooks/useEventState.js'
import { api, AUTH_TOKEN_KEY } from '../api.js'
import Round1 from '../rounds/Round1.jsx'
import Round2 from '../rounds/Round2.jsx'
import Round3 from '../rounds/Round3.jsx'
import Round4 from '../rounds/Round4.jsx'
import Round5 from '../rounds/Round5.jsx'
import Round6 from '../rounds/Round6.jsx'
import './Home.css'

const roundPages = { 1: Round1, 2: Round2, 3: Round3, 4: Round4, 5: Round5 }

function Home() {
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

  if (isCheckingSession) {
    return (
      <main className="home-loading" aria-live="polite">
        <span className="home-loading__spinner" aria-hidden="true" />
        <p>Checking your team session…</p>
      </main>
    )
  }

  if (!team) return <Navigate to="/login" replace />
  const RoundPage = roundPages[eventState?.currentRound]

  return (
    <main className="home-page">
      <TeamHeader />
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
          eventState.currentRound === 6
            ? <Round6 team={team} eventState={eventState} />
            : RoundPage ? <RoundPage /> : <ActiveRound round={eventState.currentRound} />
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
