import { useEffect, useState } from 'react'
import { api } from '../api.js'
import './Round2.css'

function Round2() {
  const [questions, setQuestions] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [totalPoints, setTotalPoints] = useState(null)
  const selected = questions.find((question) => question.id === selectedId)

  useEffect(() => {
    let mounted = true
    api.get('/round2/questions')
      .then(({ data }) => {
        if (!mounted) return
        setQuestions(data.questions)
        setSelectedId(data.questions[0]?.id || '')
      })
      .catch((requestError) => { if (mounted) setError(requestError.response?.data?.error || 'Could not load Round 2 questions.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  function selectQuestion(id) {
    setSelectedId(id)
    setAnswer('')
    setError('')
    setMessage('')
  }

  async function submitAnswer(event) {
    event.preventDefault()
    if (!selected || submitting || selected.progress.finished) return
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post('/round2/submit', { questionId: selected.id, answer })
      setQuestions((current) => current.map((question) => question.id === selected.id
        ? { ...question, progress: data.progress }
        : question))
      setAnswer('')
      setTotalPoints(data.totalPoints)
      setMessage(data.correct
        ? `Correct! You earned ${data.pointsAwarded} point${data.pointsAwarded === 1 ? '' : 's'}.`
        : `Not quite. ${data.progress.maxAttempts - data.progress.attempts} attempt${data.progress.maxAttempts - data.progress.attempts === 1 ? '' : 's'} remaining.`)
    } catch (requestError) {
      const progress = requestError.response?.data?.progress
      if (progress) setQuestions((current) => current.map((question) => question.id === selected.id ? { ...question, progress } : question))
      setError(requestError.response?.data?.error || 'Could not submit your answer.')
    } finally { setSubmitting(false) }
  }

  return (
    <article className="active-round round2">
      <div className="active-round__header">
        <div><span className="active-round__eyebrow">ROUND 02 · LIVE</span><h2>Picture Clues</h2></div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      {loading ? <p className="round2__status">Loading questions…</p> : error && questions.length === 0 ? (
        <p className="round2__status round2__status--error" role="alert">{error}</p>
      ) : questions.length === 0 ? <p className="round2__status">No Round 2 questions are configured.</p> : (
        <div className="round2__game">
          <nav className="round2__nav" aria-label="Round 2 questions">
            <span className="round2__nav-title">QUESTIONS</span>
            {questions.map((question, index) => (
              <button key={question.id} type="button" onClick={() => selectQuestion(question.id)}
                className={`round2__tab${selectedId === question.id ? ' is-active' : ''}${question.progress.solved ? ' is-solved' : ''}`}
                aria-current={selectedId === question.id ? 'step' : undefined}>
                <span>Q{index + 1}</span>
                <small>{question.progress.solved ? 'Solved' : question.progress.finished ? 'Finished' : `${question.points} pts`}</small>
              </button>
            ))}
          </nav>
          {selected && <section className="round2__question" aria-live="polite">
            <div className="round2__heading"><div><span>QUESTION {questions.findIndex((question) => question.id === selected.id) + 1}</span><h3>Study the pictures</h3></div><strong>{selected.points} PTS</strong></div>
            <p className="round2__hint">Use the pictures to work out the answer. Earn 6 points on your first try or 4 points on your second try.</p>
            <div className="round2__images" aria-label={`Picture clues for question ${questions.findIndex((question) => question.id === selected.id) + 1}`}>
              {[1, 2, 3, 4].map((imageNumber) => (
                <img key={imageNumber} src={`/round2/${selected.id}-${imageNumber}.png`}
                  alt={`Clue ${imageNumber}`} onError={(event) => { event.currentTarget.hidden = true }} />
              ))}
            </div>
            <form className="round2__form" onSubmit={submitAnswer}>
              <label htmlFor={`round2-answer-${selected.id}`}>Your answer</label>
              <div className="round2__controls">
                <input id={`round2-answer-${selected.id}`} value={answer} onChange={(event) => setAnswer(event.target.value)}
                  autoComplete="off" disabled={submitting || selected.progress.finished} placeholder="Type your answer" />
                <button type="submit" disabled={submitting || !answer.trim() || selected.progress.finished}>
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
            <p className="round2__attempts">{selected.progress.maxAttempts - selected.progress.attempts} of {selected.progress.maxAttempts} submissions remaining</p>
            {message && <p className="round2__feedback" role="status">{message}{totalPoints !== null ? ` Total points: ${totalPoints}.` : ''}</p>}
            {error && <p className="round2__error" role="alert">{error}</p>}
            {selected.progress.solved && <p className="round2__complete round2__complete--win">Question solved. +{selected.progress.pointsAwarded} points</p>}
            {selected.progress.finished && !selected.progress.solved && <p className="round2__complete">No submissions remaining for this question.</p>}
          </section>}
        </div>
      )}
    </article>
  )
}

export default Round2
