import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'

function AdminTeams() {
  const [teams, setTeams] = useState([])
  const [changes, setChanges] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [savingTeamId, setSavingTeamId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    adminApi.get('/admin/teams')
      .then(({ data }) => setTeams(data.teams))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Could not load teams.'))
      .finally(() => setIsLoading(false))
  }, [])

  function updateChange(teamId, value) {
    setChanges((current) => ({ ...current, [teamId]: value }))
  }

  async function handlePointsSubmit(event, teamId) {
    event.preventDefault()
    const delta = Number(changes[teamId])
    if (!Number.isSafeInteger(delta) || delta === 0) {
      setError('Enter a non-zero whole number to add or subtract points.')
      setMessage('')
      return
    }

    setSavingTeamId(teamId)
    setError('')
    setMessage('')
    try {
      const { data } = await adminApi.patch(`/admin/teams/${teamId}/points`, { delta })
      setTeams((current) => current.map((team) => team.id === teamId ? data.team : team))
      setChanges((current) => ({ ...current, [teamId]: '' }))
      setMessage(`${data.team.name}: ${delta > 0 ? '+' : ''}${delta} points.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not update team points.')
    } finally {
      setSavingTeamId(null)
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section__heading">
        <div>
          <div className="eyebrow"><span className="eyebrow__dot" /> TEAM MANAGEMENT</div>
          <h1>Teams</h1>
          <p>View team points and add or subtract points.</p>
        </div>
        <span className="admin-state-badge">{teams.length} teams</span>
      </div>

      {message && <p className="admin-notice" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      {isLoading ? <p className="admin-status">Loading teams…</p> : teams.length === 0 ? (
        <p className="admin-empty">No teams have been added yet.</p>
      ) : (
        <div className="team-list">
          {teams.map((team) => (
            <article className="team-row" key={team.id}>
              <div className="team-row__identity">
                <h2>{team.name}</h2>
                <span>Code: {team.teamCode}</span>
              </div>
              <div className="team-row__score">
                <span>POINTS</span>
                <strong>{team.points}</strong>
              </div>
              <form className="team-row__form" onSubmit={(event) => handlePointsSubmit(event, team.id)}>
                <label className="visually-hidden" htmlFor={`points-${team.id}`}>Points to add or subtract for {team.name}</label>
                <input
                  id={`points-${team.id}`}
                  type="number"
                  step="1"
                  value={changes[team.id] ?? ''}
                  onChange={(event) => updateChange(team.id, event.target.value)}
                  placeholder="± points"
                  required
                />
                <button className="admin-button" type="submit" disabled={savingTeamId === team.id}>
                  {savingTeamId === team.id ? 'Saving…' : 'Update'}
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminTeams
