import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import { api, AUTH_TOKEN_KEY } from '../api.js'
import './Login.css'

function SetTeamName() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  if (!token) return <Navigate to="/login" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await api.post('/auth/team-name', { name })
      navigate('/', { replace: true })
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        navigate('/', { replace: true })
        return
      }
      setError(requestError.response?.data?.error || 'Could not save your team name.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--top" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--bottom" aria-hidden="true" />
      <div className="auth-shell">
        <header className="auth-header"><BrandMark /><span className="auth-header__tag">EVENT PORTAL</span></header>
        <section className="auth-card" aria-labelledby="team-name-title">
          <div className="auth-card__intro">
            <div className="eyebrow"><span className="eyebrow__dot" /> FIRST SIGN IN</div>
            <h1 id="team-name-title">What’s your team name?</h1>
            <p>Choose the name your team will use throughout Web Rush. You can set it only once.</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-field__label" htmlFor="teamName">Team name</label>
              <input className="form-field__input" id="teamName" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required autoFocus autoComplete="organization" placeholder="Enter your team name" />
            </div>
            {error && <p className="login-form__error" role="alert">{error}</p>}
            <button className="login-form__submit" type="submit" disabled={isSubmitting || !name.trim()}>
              <span>{isSubmitting ? 'Saving…' : 'Save team name'}</span>
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default SetTeamName
