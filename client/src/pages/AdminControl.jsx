import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'

const rounds = [1, 2, 3, 4, 5, 6]

function AdminControl() {
  const [eventState, setEventState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selection, setSelection] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResettingBuzzer, setIsResettingBuzzer] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.get('/admin/control')
      .then(({ data }) => setEventState(data.eventState))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Could not load event state.'))
      .finally(() => setIsLoading(false))
  }, [])

  function chooseRound(round) {
    const isActive = eventState?.status === 'ACTIVE' && eventState.currentRound === round
    setSelection({ round, action: isActive ? 'stop' : 'start' })
    setError('')
    setMessage('')
  }

  async function confirmSelection() {
    if (!selection) return
    setIsSaving(true)
    setError('')

    try {
      const { data } = await adminApi.put('/admin/control/round', selection)
      setEventState(data.eventState)
      setMessage(data.message)
      setSelection(null)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not update the round.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleWrongAnswer() {
    setIsResettingBuzzer(true)
    setError('')
    setMessage('')
    try {
      const { data } = await adminApi.post('/admin/control/round6/wrong-answer')
      setMessage(data.message)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not reset the buzzer.')
    } finally {
      setIsResettingBuzzer(false)
    }
  }

  if (isLoading) return <p className="admin-status">Loading event control…</p>

  return (
    <div className="admin-section">
      <div className="admin-section__heading">
        <div>
          <div className="eyebrow"><span className="eyebrow__dot" /> EVENT CONTROL</div>
          <h1>Rounds</h1>
          <p>Choose a round to start or stop it.</p>
        </div>
        {eventState?.status === 'ACTIVE' && (
          <span className="admin-state-badge">Round {eventState.currentRound} active</span>
        )}
      </div>

      {message && <p className="admin-notice" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="round-grid">
        {rounds.map((round) => {
          const isActive = eventState?.status === 'ACTIVE' && eventState.currentRound === round
          const isStopped = eventState?.status === 'ENDED' && eventState.currentRound === round
          return (
            <button
              className={`round-tile${isActive ? ' is-active' : ''}`}
              key={round}
              type="button"
              onClick={() => chooseRound(round)}
              aria-label={`${isActive ? 'Stop' : 'Start'} round ${round}`}
            >
              <span className="round-tile__number">0{round}</span>
              <span className="round-tile__name">Round {round}</span>
              <span className="round-tile__status">{isActive ? 'Active' : isStopped ? 'Stopped' : 'Ready'}</span>
              <span className="round-tile__action">{isActive ? 'Stop round' : 'Start round'} →</span>
            </button>
          )
        })}
      </div>

      {eventState?.status === 'ACTIVE' && eventState.currentRound === 6 && (
        <div className="admin-confirm" role="group" aria-label="Round 6 buzzer controls">
          <p>Wrong answer? Clear the current buzz so teams can buzz in again.</p>
          <button className="admin-button" type="button" onClick={handleWrongAnswer} disabled={isResettingBuzzer}>
            {isResettingBuzzer ? 'Resetting…' : 'Wrong answer'}
          </button>
        </div>
      )}

      {selection && (
        <div className="admin-confirm" role="group" aria-label="Confirm round change">
          <p>Are you sure you want to {selection.action} Round {selection.round}?</p>
          <div className="admin-confirm__actions">
            <button className="admin-button admin-button--quiet" type="button" onClick={() => setSelection(null)} disabled={isSaving}>
              Cancel
            </button>
            <button className="admin-button" type="button" onClick={confirmSelection} disabled={isSaving}>
              {isSaving ? 'Saving…' : `Sure, ${selection.action}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminControl
