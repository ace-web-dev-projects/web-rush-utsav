import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import FormField from '../components/FormField.jsx'
import { adminApi, ADMIN_TOKEN_KEY } from '../api.js'
import './Login.css'

function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await adminApi.post('/admin/login', { username, password })
      localStorage.setItem(ADMIN_TOKEN_KEY, response.data.token)
      navigate('/admin', { replace: true })
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Could not connect to the event server. Please try again in a moment.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--top" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--bottom" aria-hidden="true" />
      <div className="auth-shell">
        <header className="auth-header">
          <BrandMark />
          <span className="auth-header__tag">ADMIN PORTAL</span>
        </header>
        <section className="auth-card" aria-labelledby="admin-login-title">
          <div className="auth-card__intro">
            <div className="eyebrow"><span className="eyebrow__dot" /> ADMIN ACCESS</div>
            <h1 id="admin-login-title">Sign in to manage Web Rush.</h1>
            <p>Use the administrator credentials provided for this event.</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <FormField
              id="adminUsername"
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
            <FormField
              id="adminPassword"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {error && <p className="login-form__error" role="alert">{error}</p>}
            <button className="login-form__submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing in…' : 'Sign in as admin'}</span>
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>
        </section>
        <footer className="auth-footer">
          <span>Web Rush administration</span>
          <span className="auth-footer__status"><span /> ADMIN ACCESS</span>
        </footer>
      </div>
    </main>
  )
}

export default AdminLogin
