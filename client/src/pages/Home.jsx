import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import { api, AUTH_TOKEN_KEY } from '../api.js'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
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
        <p>You’re signed in and ready for Web Rush. Your event space is coming soon.</p>
        <div className="home-welcome__team-code">
          <span>TEAM CODE</span>
          <strong>{team.teamCode}</strong>
        </div>
      </section>
      <footer className="home-footer">WEB RUSH <span>•</span> TEAM EVENT PORTAL</footer>
    </main>
  )
}

export default Home
