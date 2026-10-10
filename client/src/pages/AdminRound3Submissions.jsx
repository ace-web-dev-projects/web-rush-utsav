import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'

function AdminRound3Submissions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.get('/submissions/admin/round/3')
      .then(({ data }) => setQuestions(data.questions))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Could not load Round 3 submissions.'))
      .finally(() => setLoading(false))
  }, [])

  return <section className="admin-section">
    <div className="admin-section__heading"><div><span className="round3-admin__eyebrow">ROUND 03</span><h1>Team submissions</h1><p>Files are listed in submission order within each question.</p></div></div>
    {loading ? <p className="admin-status">Loading submissions…</p> : error ? <p className="admin-error" role="alert">{error}</p> : (
      <div className="round3-admin__questions">
        {questions.map((question, index) => <section className="round3-admin__question" key={question.id}>
          <div className="round3-admin__question-heading"><h2>Question {index + 1}: {question.title}</h2><span>{question.submissions.length} submission{question.submissions.length === 1 ? '' : 's'}</span></div>
          {question.submissions.length === 0 ? <p className="admin-empty">No teams have submitted files for this question yet.</p> : (
            <ol className="round3-admin__list">
              {question.submissions.map((submission) => <li className="round3-admin__submission" key={submission.submissionId}>
                <div className="round3-admin__team"><strong>{submission.teamName}</strong><span>{submission.teamCode}</span></div>
                <time dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString()}</time>
                <ul className="round3-admin__files">
                  {submission.files.map((file) => <li key={file.storedName}>
                    <a href={`${adminApi.defaults.baseURL}/submissions/admin/round/3/${submission.teamId}/${submission.submissionId}/${encodeURIComponent(file.storedName)}`}
                      onClick={(event) => {
                        event.preventDefault()
                        adminApi.get(`/submissions/admin/round/3/${submission.teamId}/${submission.submissionId}/${encodeURIComponent(file.storedName)}`, { responseType: 'blob' })
                          .then(({ data }) => { const url = URL.createObjectURL(data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(url) })
                          .catch(() => setError('Could not download that file.'))
                      }}>{file.originalName}</a>
                    <small>{(file.size / 1024).toFixed(1)} KB</small>
                  </li>)}
                </ul>
              </li>)}
            </ol>
          )}
        </section>)}
      </div>
    )}
  </section>
}

export default AdminRound3Submissions
