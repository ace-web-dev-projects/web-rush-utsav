import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import './Round1.css'

function Round1({ round = 1 }) {
  const [puzzles, setPuzzles] = useState([])
  const [selectedPuzzleId, setSelectedPuzzleId] = useState('')
  const [guess, setGuess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [totalPoints, setTotalPoints] = useState(null)

  useEffect(() => {
    if (round !== 1) return undefined
    let isMounted = true
    api.get('/round1/puzzles')
      .then(({ data }) => {
        if (!isMounted) return
        setPuzzles(data.puzzles)
        setSelectedPuzzleId((current) => current || data.puzzles[0]?.id || '')
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.response?.data?.error || 'Could not load Round 1 questions.')
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [round])

  const selectedPuzzle = useMemo(
    () => puzzles.find((puzzle) => puzzle.id === selectedPuzzleId),
    [puzzles, selectedPuzzleId],
  )

  function selectPuzzle(puzzleId) {
    setSelectedPuzzleId(puzzleId)
    setGuess('')
    setError('')
    setMessage('')
    setTotalPoints(null)
  }

  async function refreshQuestions() {
    setIsRefreshing(true)
    setError('')
    try {
      const { data } = await api.get('/round1/puzzles')
      setPuzzles(data.puzzles)
      setSelectedPuzzleId((current) => data.puzzles.some((puzzle) => puzzle.id === current)
        ? current
        : data.puzzles[0]?.id || '')
      setGuess('')
      setMessage('Questions refreshed from the server.')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not refresh Round 1 questions.')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function checkGuess(event) {
    event.preventDefault()
    if (!selectedPuzzle || isSubmitting) return
    setIsSubmitting(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post('/round1/check', { puzzleId: selectedPuzzle.id, guess })
      setPuzzles((current) => current.map((puzzle) => puzzle.id === selectedPuzzle.id
        ? { ...puzzle, progress: data.progress }
        : puzzle))
      setGuess('')
      setMessage(data.correct
        ? `Correct! You earned ${data.pointsAwarded} point${data.pointsAwarded === 1 ? '' : 's'}.`
        : `${data.progress.attempts} of ${data.progress.maxAttempts} attempts used.`)
      if (Number.isSafeInteger(data.totalPoints)) setTotalPoints(data.totalPoints)
    } catch (requestError) {
      const responseProgress = requestError.response?.data?.progress
      if (responseProgress) {
        setPuzzles((current) => current.map((puzzle) => puzzle.id === selectedPuzzle.id
          ? { ...puzzle, progress: responseProgress }
          : puzzle))
      }
      setError(requestError.response?.data?.error || 'Could not check your guess.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (round !== 1) {
    return (
      <article className="active-round">
        <div className="active-round__header">
          <div><span className="active-round__eyebrow">ROUND 0{round} · LIVE</span><h2>Round {round}</h2></div>
          <span className="active-round__indicator">IN PROGRESS</span>
        </div>
        <div className="active-round__content"><span>ROUND {round} AREA</span><p>Round {round} activity will appear here.</p></div>
      </article>
    )
  }

  return (
    <article className="active-round round1">
      <div className="active-round__header">
        <div><span className="active-round__eyebrow">ROUND 01 · LIVE</span><h2>Word Rush</h2></div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      {isLoading ? <p className="round1__status">Loading questions…</p> : error && puzzles.length === 0 ? (
        <p className="round1__status round1__status--error" role="alert">{error}</p>
      ) : (
        <div className="round1__game">
          <nav className="round1__question-nav" aria-label="Round 1 questions">
            <div className="round1__nav-heading">
              <span>QUESTIONS</span>
              <button type="button" onClick={refreshQuestions} disabled={isRefreshing} aria-label="Refresh questions">
                {isRefreshing ? '…' : '↻'}
              </button>
            </div>
            {puzzles.map((puzzle, index) => (
              <button
                key={puzzle.id}
                type="button"
                className={`round1__question-tab${puzzle.id === selectedPuzzleId ? ' is-active' : ''}${puzzle.progress.solved ? ' is-solved' : ''}`}
                onClick={() => selectPuzzle(puzzle.id)}
                aria-current={puzzle.id === selectedPuzzleId ? 'step' : undefined}
              >
                <span>Q{index + 1}</span>
                <small>{puzzle.progress.solved ? 'Solved' : puzzle.progress.failed ? 'Finished' : `${puzzle.points} pts`}</small>
              </button>
            ))}
          </nav>

          {selectedPuzzle && (
            <section className="round1__puzzle" aria-live="polite">
              <div className="round1__puzzle-heading">
                <div><span>QUESTION {puzzles.findIndex((puzzle) => puzzle.id === selectedPuzzle.id) + 1}</span><h3>Guess the word</h3></div>
                <strong>{selectedPuzzle.points} PTS</strong>
              </div>
              <p className="round1__instructions">Type a {selectedPuzzle.letterCount}-letter word. Green means right letter and position; yellow means the letter is in the word.</p>

              <div className="round1__guess-board" aria-label="Your guesses">
                {Array.from({ length: selectedPuzzle.progress.maxAttempts }, (_, rowIndex) => {
                  const savedGuess = selectedPuzzle.progress.guesses[rowIndex]
                  const isCurrentRow = rowIndex === selectedPuzzle.progress.attempts && !selectedPuzzle.progress.solved && !selectedPuzzle.progress.failed
                  const currentLetters = isCurrentRow ? guess.toUpperCase().split('') : []
                  return (
                    <div className="round1__guess-row" key={rowIndex}>
                      {Array.from({ length: selectedPuzzle.letterCount }, (_, tileIndex) => (
                        <span
                          className={`round1__tile${savedGuess ? ` is-${savedGuess.feedback[tileIndex]}` : ''}${!savedGuess && currentLetters[tileIndex] ? ' has-letter' : ''}`}
                          key={tileIndex}
                        >
                          {savedGuess?.guess[tileIndex]?.toUpperCase() || currentLetters[tileIndex] || ''}
                        </span>
                      ))}
                    </div>
                  )
                })}
              </div>

              <form className="round1__entry" onSubmit={checkGuess}>
                <label htmlFor={`round1-guess-${selectedPuzzle.id}`}>Your guess</label>
                <div className="round1__entry-controls">
                  <input
                    id={`round1-guess-${selectedPuzzle.id}`}
                    type="text"
                    value={guess}
                    onChange={(event) => setGuess(event.target.value.replace(/[^a-z]/gi, '').slice(0, selectedPuzzle.letterCount))}
                    maxLength={selectedPuzzle.letterCount}
                    autoComplete="off"
                    autoCapitalize="none"
                    disabled={isSubmitting || selectedPuzzle.progress.solved || selectedPuzzle.progress.failed}
                    placeholder={`${selectedPuzzle.letterCount} letters`}
                  />
                  <button type="submit" disabled={isSubmitting || guess.length !== selectedPuzzle.letterCount || selectedPuzzle.progress.solved || selectedPuzzle.progress.failed}>
                    {isSubmitting ? 'Checking…' : 'Check'}
                  </button>
                </div>
              </form>
              <p className="round1__attempts">{selectedPuzzle.progress.maxAttempts - selectedPuzzle.progress.attempts} attempts remaining</p>
              {message && <p className="round1__feedback-message" role="status">{message}{totalPoints !== null ? ` Total points: ${totalPoints}.` : ''}</p>}
              {error && <p className="round1__feedback-error" role="alert">{error}</p>}
              {selectedPuzzle.progress.solved && <p className="round1__complete round1__complete--win">Question solved. +{selectedPuzzle.progress.pointsAwarded} points</p>}
              {selectedPuzzle.progress.failed && <p className="round1__complete">No attempts remaining for this question.</p>}
            </section>
          )}
          {puzzles.length === 0 && <p className="round1__status">No Round 1 questions are configured.</p>}
        </div>
      )}
    </article>
  )
}

export default Round1
