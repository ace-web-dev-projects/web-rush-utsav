import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const totalPoints = 100
const answerFile = fileURLToPath(new URL('./round_5_answer.json', import.meta.url))

export async function loadRound5Answer() {
  try {
    const answerData = JSON.parse(await readFile(answerFile, 'utf8'))
    return typeof answerData.password === 'string' && answerData.password.length > 0
      ? answerData.password
      : null
  } catch {
    return null
  }
}

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
