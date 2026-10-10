import { useEffect, useState } from 'react'
import { api } from '../api.js'
import './Round3.css'

function Round3() {
  const [questions, setQuestions] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const selected = questions.find((question) => question.id === selectedId)

  useEffect(() => {
    let mounted = true
    api.get('/round3/questions')
      .then(({ data }) => { if (mounted) { setQuestions(data.questions); setSelectedId(data.questions[0]?.id ?? '') } })
      .catch((requestError) => { if (mounted) setError(requestError.response?.data?.error || 'Could not load Round 3 questions.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  function selectQuestion(id) {
    setSelectedId(id)
    setFiles([])
    setError('')
    setMessage('')
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(selected.code)
      setMessage('Starter code copied.')
      setError('')
    } catch {
      setError('Could not copy automatically. Select the code and copy it manually.')
    }
  }

  async function submitFiles(event) {
    event.preventDefault()
    if (!selected || files.length === 0 || submitting) return
    const form = event.currentTarget
    setSubmitting(true)
    setError('')
    setMessage('')
    const formData = new FormData()
    formData.append('submission', JSON.stringify({ questionId: selected.id }))
    Array.from(files).forEach((file) => formData.append('files', file))
    try {
      await api.post('/submissions/round/3', formData)
      setMessage(`${files.length} file${files.length === 1 ? '' : 's'} submitted for ${selected.title}.`)
      setFiles([])
      form.reset()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not upload your files.')
    } finally { setSubmitting(false) }
  }

  return (
    <article className="active-round round3">
      <div className="active-round__header">
        <div><span className="active-round__eyebrow">ROUND 03 · LIVE</span><h2>Pixel Perfect</h2></div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      {loading ? <p className="round3__status">Loading questions…</p> : error && questions.length === 0 ? (
        <p className="round3__status round3__status--error" role="alert">{error}</p>
      ) : questions.length === 0 ? <p className="round3__status">No Round 3 questions are configured.</p> : (
        <div className="round3__game">
          <nav className="round3__nav" aria-label="Round 3 questions">
            <span className="round3__nav-title">QUESTIONS</span>
            {questions.map((question, index) => <button key={question.id} type="button"
              className={`round3__tab${selectedId === question.id ? ' is-active' : ''}`}
              onClick={() => selectQuestion(question.id)} aria-current={selectedId === question.id ? 'step' : undefined}>
              <span>Q{index + 1}</span><small>{question.title}</small>
            </button>)}
          </nav>
          {selected && <section className="round3__question" aria-live="polite">
            <div className="round3__heading"><div><span>QUESTION {questions.indexOf(selected) + 1}</span><h3>{selected.title}</h3></div></div>
            <p className="round3__instructions">{selected.instructions}</p>
            <img className="round3__reference" src={selected.image} alt={`Reference design for ${selected.title}`} />
            <div className="round3__code-panel">
              <div className="round3__code-heading"><strong>Starter code</strong><button type="button" onClick={copyCode}>Copy code</button></div>
              <pre className="round3__code"><code>{selected.code}</code></pre>
            </div>
            <form className="round3__upload" onSubmit={submitFiles}>
              <label htmlFor={`round3-files-${selected.id}`}>Upload your finished files</label>
              <p>Choose up to 10 files. Each file can be up to 10 MB.</p>
              <input id={`round3-files-${selected.id}`} type="file" multiple onChange={(event) => setFiles(event.target.files)} />
              {files.length > 0 && <small>{files.length} file{files.length === 1 ? '' : 's'} selected</small>}
              <button type="submit" disabled={submitting || files.length === 0}>{submitting ? 'Uploading…' : 'Submit files'}</button>
            </form>
            {message && <p className="round3__feedback" role="status">{message}</p>}
            {error && <p className="round3__error" role="alert">{error}</p>}
          </section>}
        </div>
      )}
    </article>
  )
}

export default Round3
