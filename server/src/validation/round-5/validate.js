const totalPoints = 100

export function validateRound5Answer(submittedPassword, correctPassword) {
  const correctLetters = Array.from(correctPassword)
  const submittedLetters = Array.from(submittedPassword)
  const matchedLetters = correctLetters.reduce(
    (total, letter, index) => total + Number(submittedLetters[index] === letter),
    0,
  )
  const percentage = (matchedLetters / correctLetters.length) * 100

  return {
    matchedLetters,
    totalLetters: correctLetters.length,
    percentage,
    pointsAwarded: Math.round((matchedLetters / correctLetters.length) * totalPoints),
  }
}
