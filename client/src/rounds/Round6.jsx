import { useEffect, useState } from 'react'
import { api } from '../api.js'
import './Round6.css'

function Round6({ team, eventState }) {
  const [buzzerState, setBuzzerState] = useState(eventState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const winnerName = buzzerState?.round6BuzzedName

  useEffect(() => {
    setBuzzerState(eventState)
  }, [eventState])

  async function buzzIn() {
    if (isSubmitting || buzzerState?.round6BuzzedTeamId != null) return
    setIsSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/event/round6/buzz')
      setBuzzerState(data.eventState)
    } catch (requestError) {
      if (requestError.response?.data?.eventState) setBuzzerState(requestError.response.data.eventState)
      setError(requestError.response?.data?.error || 'Could not send your buzz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="active-round round6">
      <div className="active-round__header">
        <div><span className="active-round__eyebrow">ROUND 06 · LIVE</span><h2>Fastest finger</h2></div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      <div className="round6__buzzer-area" aria-live="polite">
        {winnerName ? (
          <div className="round6__winner"><span>BUZZER CLAIMED</span><strong>{winnerName}</strong></div>
        ) : (
          <>
            <p>Be ready, {team.name}. Press the buzzer when you know the answer.</p>
            <button className="round6__buzzer" type="button" onClick={buzzIn} disabled={isSubmitting} aria-label="Buzz in">
              {isSubmitting ? 'Sending' : 'BUZZ'}
            </button>
            <span className="round6__hint">First team to buzz in gets the chance to answer.</span>
          </>
        )}
        {error && <p className="round6__error" role="alert">{error}</p>}
      </div>
    </article>
  )
}

export default Round6
