import { useState } from 'react'
import { api } from '../api.js'
import './Round5.css'

function Round5() {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(null)

  async function submitPassword(event) {
    event.preventDefault()
    if (!password.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError('')
    setScore(null)
    try {
      const { data } = await api.post('/submissions/round/5', { password: password.trim() })
      setScore(data.score)
      setPassword('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not submit your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="active-round round5">
      <div className="active-round__header">
        <div><span className="active-round__eyebrow">ROUND 05 · LIVE</span><h2>Password Challenge</h2></div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      <section className="round5__content">
        <p className="round5__instructions">Open the challenge in a new tab. Work out the password, then return here to submit it.</p>
        <a className="round5__challenge-link" href="/round5/challenge.html" target="_blank" rel="noopener noreferrer">
          Open challenge <span aria-hidden="true">↗</span>
        </a>
        <form className="round5__form" onSubmit={submitPassword}>
          <label htmlFor="round5-password">Your password</label>
          <div className="round5__controls">
            <input id="round5-password" type="text" value={password} onChange={(event) => setPassword(event.target.value)}
              autoComplete="off" autoCapitalize="none" disabled={isSubmitting} placeholder="Enter the password" />
            <button type="submit" disabled={isSubmitting || !password.trim()}>{isSubmitting ? 'Submitting…' : 'Submit'}</button>
          </div>
        </form>
        {error && <p className="round5__error" role="alert">{error}</p>}
        {score && (
          <div className="round5__score" role="status">
            <strong>{score.pointsAwarded} points awarded</strong>
            <span>{score.matchedLetters} of {score.totalLetters} password letters matched ({Math.round(score.percentage)}%).</span>
            {Number.isFinite(score.totalPoints) && <span>Team total: {score.totalPoints} points.</span>}
          </div>
        )}
      </section>
    </article>
  )
}

export default Round5
