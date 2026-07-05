import levenshtein from 'fast-levenshtein'

/** @typedef {import('./game.js').Song} Song */
/** @typedef {import('./rooms.js').Room} Room */

/**
 * Allowed Levenshtein errors for a text answer, based on expected answer length.
 * Uses 50% of length (floored). Answers of 1–2 characters require an exact match
 * so unrelated one-character-off guesses are not accepted as correct.
 * @param {number} expectedLength
 */
function getAllowedTextErrors(expectedLength) {
  if (expectedLength <= 2) return 0
  return Math.floor(expectedLength * 0.5)
}

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
 * @param {string} expected
 */
function matchesTextAnswer(answer, expected) {
  const normalizedAnswer = normalizeText(answer)
  const normalizedExpected = normalizeText(expected)

  if (!normalizedAnswer) return false
  if (normalizedAnswer === normalizedExpected) return true

  const distance = levenshtein.get(normalizedAnswer, normalizedExpected)
  const allowedErrors = getAllowedTextErrors(normalizedExpected.length)
  return distance <= allowedErrors
}

/**
 * Split a multi-artist name into individual artist alternatives (e.g. "A & B").
 * @param {string} artistName
 */
function splitArtistAlternatives(artistName) {
  return artistName
    .split(/\s*&\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

/**
 * @param {string} answer
 * @param {string} correct
 */
export function scoreTextAnswer(answer, correct) {
  return matchesTextAnswer(answer, correct) ? 10 : 0
}

/**
 * Score an artist/creator name. Accepts the full name or any single artist
 * when the correct answer lists multiple artists (e.g. "Daryl Hall & John Oates").
 * @param {string} answer
 * @param {string} correct
 */
export function scoreArtistAnswer(answer, correct) {
  if (matchesTextAnswer(answer, correct)) return 10

  const alternatives = splitArtistAlternatives(correct)
  if (alternatives.length <= 1) return 0

  return alternatives.some((alternative) => matchesTextAnswer(answer, alternative)) ? 10 : 0
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
        points =
          question.id === 'creatorName'
            ? scoreArtistAnswer(answer, correctAnswer)
            : scoreTextAnswer(answer, correctAnswer)
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
