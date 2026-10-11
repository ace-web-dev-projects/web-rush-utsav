import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import FormField from '../components/FormField.jsx'
import { api, AUTH_TOKEN_KEY } from '../api.js'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [teamCode, setTeamCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/login', { teamCode, password })
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token)
      navigate(response.data.team.name?.trim() ? '/' : '/team-name', { replace: true })
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
          <span className="auth-header__tag">EVENT PORTAL</span>
        </header>

        <section className="auth-card" aria-labelledby="login-title">
          <div className="auth-card__intro">
            <div className="eyebrow">
              <span className="eyebrow__dot" /> TEAM ACCESS
            </div>
            <h1 id="login-title">Your next move starts here.</h1>
            <p>Sign in with the team details shared with you for Web Rush.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <FormField
              id="teamCode"
              label="Team code"
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value)}
              placeholder="Enter your team code"
              autoComplete="username"
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            {error && (
              <p className="login-form__error" role="alert">
                {error}
              </p>
            )}

            <button className="login-form__submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing in…' : 'Sign in to your team'}</span>
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="auth-card__note">
            <span className="auth-card__note-icon" aria-hidden="true">i</span>
            <p>Team accounts are set up by the event organizers. Need help? Contact your team lead.</p>
          </div>
        </section>

        <footer className="auth-footer">
          <span>Built for teams ready to make something.</span>
          <span className="auth-footer__status"><span /> EVENT ACCESS</span>
        </footer>
      </div>
    </main>
  )
}

export default Login
