import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import { adminApi, ADMIN_TOKEN_KEY } from '../api.js'
import './Admin.css'

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
      <main className="admin-loading" aria-live="polite">
        <span className="admin-loading__spinner" aria-hidden="true" />
        <p>Checking administrator session…</p>
      </main>
    )
  }

  if (!admin) return <Navigate to="/admin/login" replace />

  return (
    <main className="admin-page">
      <header className="admin-header">
        <BrandMark compact />
        <div className="admin-header__account">
          <span>{admin.username}</span>
          <button className="admin-header__signout" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <nav className="admin-nav" aria-label="Admin pages">
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}>
          Control
        </NavLink>
        <NavLink to="/admin/teams" className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}>
          Teams
        </NavLink>
        <NavLink to="/admin/manage-teams" className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}>
          Add / delete teams
        </NavLink>
        <NavLink to="/admin/round3-submissions" className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}>
          Round 3 submissions
        </NavLink>
      </nav>
      <section className="admin-content"><Outlet /></section>
    </main>
  )
}

export default AdminHome
