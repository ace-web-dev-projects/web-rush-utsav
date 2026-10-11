import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'

const rounds = [1, 2, 3, 4, 5, 6]

function AdminControl() {
  const [eventState, setEventState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selection, setSelection] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResettingBuzzer, setIsResettingBuzzer] = useState(false)
  const [teams, setTeams] = useState([])
  const [selectedTeamIds, setSelectedTeamIds] = useState([])
  const [marking, setMarking] = useState('positive')
  const [points, setPoints] = useState('')
  const [isScoring, setIsScoring] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadControl = () => adminApi.get('/admin/control')
      .then(({ data }) => { if (isMounted) setEventState(data.eventState) })
      .catch((requestError) => { if (isMounted) setError(requestError.response?.data?.error || 'Could not load event state.') })
      .finally(() => { if (isMounted) setIsLoading(false) })
    adminApi.get('/admin/teams')
      .then(({ data }) => { if (isMounted) setTeams(data.teams) })
      .catch((requestError) => { if (isMounted) setError(requestError.response?.data?.error || 'Could not load teams.') })
    loadControl()
    const intervalId = window.setInterval(loadControl, 1500)
    return () => { isMounted = false; window.clearInterval(intervalId) }
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
      const refreshed = await adminApi.get('/admin/control')
      setEventState(refreshed.data.eventState)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not reset the buzzer.')
    } finally {
      setIsResettingBuzzer(false)
    }
  }

  function toggleTeam(teamId) {
    setSelectedTeamIds((current) => current.includes(teamId)
      ? current.filter((id) => id !== teamId)
      : [...current, teamId])
  }

  async function applyRound6Points() {
    const amount = Number(points)
    if (!Number.isSafeInteger(amount) || amount < 1 || selectedTeamIds.length === 0) return
    setIsScoring(true)
    setError('')
    setMessage('')
    try {
      const { data } = await adminApi.post('/admin/control/round6/score', { teamIds: selectedTeamIds, points: amount, marking })
      setTeams((current) => current.map((team) => data.teams.find((item) => item.id === team.id) || team))
      setMessage(`${data.teams.length} team${data.teams.length === 1 ? '' : 's'} ${marking === 'positive' ? 'received' : 'lost'} ${amount} point${amount === 1 ? '' : 's'}.`)
      setSelectedTeamIds([])
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not update Round 6 points.')
    } finally {
      setIsScoring(false)
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

      <div className={`admin-control-layout${eventState?.status === 'ACTIVE' && eventState.currentRound === 6 ? ' has-round6-panel' : ''}`}>
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
        <aside className="round6-admin-panel" aria-label="Round 6 scoring controls">
          <div className="round6-admin-panel__buzz" aria-live="polite">
            <span className="round6-admin-panel__eyebrow">CURRENT BUZZ</span>
            <strong>{eventState.round6BuzzedName || 'No team has buzzed yet'}</strong>
            <button className="admin-button admin-button--quiet" type="button" onClick={handleWrongAnswer} disabled={isResettingBuzzer}>
              {isResettingBuzzer ? 'Resetting...' : 'Wrong answer · Reset buzzer'}
            </button>
          </div>
          <div className="round6-admin-panel__settings">
            <span className="round6-admin-panel__eyebrow">MARKING</span>
            <div className="round6-marking" role="group" aria-label="Choose marking type">
              <button type="button" className={marking === 'positive' ? 'is-selected' : ''} aria-pressed={marking === 'positive'} onClick={() => setMarking('positive')}>Positive</button>
              <button type="button" className={marking === 'negative' ? 'is-selected is-negative' : ''} aria-pressed={marking === 'negative'} onClick={() => setMarking('negative')}>Negative</button>
            </div>
            <label className="round6-points-input">Points per team
              <input type="number" min="1" step="1" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="Enter points" />
            </label>
          </div>
          <div className="round6-admin-panel__teams">
            <div className="round6-admin-panel__team-heading">
              <div><span className="round6-admin-panel__eyebrow">TEAMS</span><h2>Select teams to score</h2></div>
              <span>{selectedTeamIds.length} selected</span>
            </div>
            <div className="round6-team-grid">
              {teams.map((team) => (
                <label className={`round6-team-tile${selectedTeamIds.includes(team.id) ? ' is-selected' : ''}`} key={team.id}>
                  <input type="checkbox" checked={selectedTeamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} />
                  <span><strong>{team.name || `Name pending (${team.teamCode})`}</strong><small>{team.points} pts</small></span>
                </label>
              ))}
            </div>
            {selectedTeamIds.length > 0 && (
              <div className="round6-admin-panel__actions">
                <span>{marking === 'positive' ? 'Add' : 'Deduct'} {Number(points) > 0 ? points : '—'} point{Number(points) === 1 ? '' : 's'} from {selectedTeamIds.length} selected</span>
                <button className={`admin-button${marking === 'negative' ? ' admin-button--danger' : ''}`} type="button" onClick={applyRound6Points} disabled={isScoring || !Number.isSafeInteger(Number(points)) || Number(points) < 1}>
                  {isScoring ? 'Applying...' : marking === 'positive' ? 'Add positive' : 'Add negative'}
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
      </div>

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
