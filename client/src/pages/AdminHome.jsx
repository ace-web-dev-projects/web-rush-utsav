import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import { adminApi, ADMIN_TOKEN_KEY } from '../api.js'
import './Home.css'

function AdminHome() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(
    () => Boolean(localStorage.getItem(ADMIN_TOKEN_KEY)),
  )

  useEffect(() => {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) return

    adminApi.get('/admin/me')
      .then(({ data }) => setAdmin(data.admin))
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        setAdmin(null)
      })
      .finally(() => setIsCheckingSession(false))
  }, [])

  function handleSignOut() {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdmin(null)
    navigate('/admin/login', { replace: true })
  }

  if (isCheckingSession) {
    return (
      <main className="home-loading" aria-live="polite">
        <span className="home-loading__spinner" aria-hidden="true" />
        <p>Checking administrator session…</p>
      </main>
    )
  }

  if (!admin) return <Navigate to="/admin/login" replace />

  return (
    <main className="home-page">
      <header className="home-header">
        <BrandMark compact />
        <button className="home-header__signout" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <section className="home-welcome">
        <div className="eyebrow"><span className="eyebrow__dot" /> ADMIN SPACE</div>
        <h1>Welcome, {admin.username}.</h1>
        <p>Your Web Rush admin panel is ready. Event management components will be added here.</p>
      </section>
      <footer className="home-footer">WEB RUSH <span>•</span> ADMIN PORTAL</footer>
    </main>
  )
}

export default AdminHome
