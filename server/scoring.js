import levenshtein from 'fast-levenshtein'

/** @typedef {import('./game.js').Song} Song */
/** @typedef {import('./rooms.js').Room} Room */

const TEXT_DISTANCE_THRESHOLD = 3

/**
 * @param {string | undefined | null} value
 */
function normalizeText(value) {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * @param {string} questionSentence
 * @param {string} completeSentence
 */
function extractLyricAnswer(questionSentence, completeSentence) {
  const parts = questionSentence.split(/_+/)
  if (parts.length !== 2) return completeSentence

  const [before, after] = parts
  if (completeSentence.startsWith(before) && completeSentence.endsWith(after)) {
    return completeSentence.slice(before.length, completeSentence.length - after.length).trim()
  }

  return completeSentence
}

/**
 * @param {import('./game.js').Song} song
 * @param {string} questionId
 */
function getCorrectAnswer(song, questionId) {
  switch (questionId) {
    case 'singerName':
      return song.trackName
    case 'creatorName':
      return song.artistName
    case 'releaseYear':
      return String(new Date(song.releaseDate).getFullYear())
    case 'completeLyric':
      return extractLyricAnswer(song.questionSentence ?? '', song.completeSentence ?? '')
    default:
      return ''
  }
}

/**
 * @param {string} answer
 * @param {string} correct
 */
export function scoreTextAnswer(answer, correct) {
  const normalizedAnswer = normalizeText(answer)
  const normalizedCorrect = normalizeText(correct)

  if (!normalizedAnswer) return 0
  if (normalizedAnswer === normalizedCorrect) return 10

  const distance = levenshtein.get(normalizedAnswer, normalizedCorrect)
  return distance <= TEXT_DISTANCE_THRESHOLD ? 10 : 0
}

/**
 * @param {string} answer
 * @param {number} correctYear
 */
export function scoreYearAnswer(answer, correctYear) {
  const parsed = Number.parseInt(answer, 10)
  if (!Number.isFinite(parsed)) return 0

  const diff = Math.abs(parsed - correctYear)
  if (diff === 0) return 10
  if (diff <= 3) return 8
  if (diff <= 10) return 5
  return 0
}

/**
 * @param {Room} room
 * @param {{ id: string, type: 'text' | 'number', label: string }[]} questions
 */
export function calculateRoundScores(room, questions) {
  if (!room.currentSong || !room.settings) {
    return { questions: [], results: {}, songsRemaining: 0 }
  }

  const song = room.currentSong
  const playlist = room.playlist
  const totalSongs = playlist?.songs.length ?? 0
  const songsRemaining = Math.max(0, totalSongs - room.playedTrackIds.length)

  /** @type {Record<string, { questionScores: Record<string, { points: number, label: string, playerAnswer: string, correctAnswer: string }>, roundTotal: number, totalScore: number }>} */
  const results = {}

  for (const player of room.players.values()) {
    /** @type {Record<string, { points: number, label: string, playerAnswer: string, correctAnswer: string }>} */
    const questionScores = {}
    let roundTotal = 0

    for (const question of questions) {
      const answer = player.answers[question.id] ?? ''
      let points = 0
      let correctAnswer = ''

      if (question.type === 'number') {
        const correctYear = new Date(song.releaseDate).getFullYear()
        correctAnswer = String(correctYear)
        points = scoreYearAnswer(answer, correctYear)
      } else {
        correctAnswer = getCorrectAnswer(song, question.id)
        points = scoreTextAnswer(answer, correctAnswer)
      }

      questionScores[question.id] = {
        points,
        label: question.label,
        playerAnswer: answer,
        correctAnswer,
      }
      roundTotal += points
    }

    player.score += roundTotal
    results[player.id] = {
      questionScores,
      roundTotal,
      totalScore: player.score,
    }
  }

  return { results, songsRemaining }
}
