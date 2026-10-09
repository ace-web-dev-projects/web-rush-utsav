import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'

function AdminTeamManagement() {
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({ name: '', teamCode: '', password: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingTeamId, setDeletingTeamId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    adminApi.get('/admin/teams')
      .then(({ data }) => setTeams(data.teams))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Could not load teams.'))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setMessage('')
    try {
      const { data } = await adminApi.post('/admin/teams', form)
      setTeams((current) => [...current, data.team].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ name: '', teamCode: '', password: '' })
      setMessage(`${data.team.name} was added.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not add the team.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(team) {
    if (!window.confirm(`Delete ${team.name}? The team will no longer be able to sign in.`)) return
    setDeletingTeamId(team.id)
    setError('')
    setMessage('')
    try {
      await adminApi.delete(`/admin/teams/${team.id}`)
      setTeams((current) => current.filter((item) => item.id !== team.id))
      setMessage(`${team.name} was deleted.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not delete the team.')
    } finally {
      setDeletingTeamId(null)
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <div className="admin-section">
      <div className="admin-section__heading">
        <div>
          <div className="eyebrow"><span className="eyebrow__dot" /> TEAM MANAGEMENT</div>
          <h1>Add or delete teams</h1>
          <p>Create team accounts or remove teams from the event.</p>
        </div>
        <span className="admin-state-badge">{teams.length} teams</span>
      </div>

      {message && <p className="admin-notice" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}

      <form className="admin-team-form" onSubmit={handleCreate}>
        <h2>Add a team</h2>
        <div className="admin-team-form__fields">
          <label>Team name<input name="name" value={form.name} onChange={updateField} maxLength={100} required /></label>
          <label>Team code<input name="teamCode" value={form.teamCode} onChange={updateField} maxLength={100} required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={updateField} minLength={8} autoComplete="new-password" required /></label>
        </div>
        <div className="admin-team-form__footer">
          <p>Password must be at least 8 characters. Share it with the team so they can sign in.</p>
          <button className="admin-button" type="submit" disabled={isSaving}>{isSaving ? 'Adding…' : 'Add team'}</button>
        </div>
      </form>

      <div className="admin-team-list-heading"><h2>Existing teams</h2></div>
      {isLoading ? <p className="admin-status">Loading teams…</p> : teams.length === 0 ? (
        <p className="admin-empty">No teams have been added yet.</p>
      ) : (
        <div className="team-list">
          {teams.map((team) => (
            <article className="team-row" key={team.id}>
              <div className="team-row__identity"><h2>{team.name}</h2><span>Code: {team.teamCode}</span></div>
              <div className="team-row__score"><span>POINTS</span><strong>{team.points}</strong></div>
              <button className="admin-button admin-button--danger" type="button" onClick={() => handleDelete(team)} disabled={deletingTeamId !== null}>
                {deletingTeamId === team.id ? 'Deleting…' : 'Delete team'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminTeamManagement
