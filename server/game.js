import { calculateRoundScores } from './scoring.js'

/**
 * @typedef {{
 *   roundNumber: number,
 *   questions: { id: string, label: string }[],
 *   results: Record<string, unknown>,
 *   songsRemaining: number,
 * }} RoundResultsPayload
 */

/**
 * @typedef {{
 *   trackId: number,
 *   previewUrl: string,
 *   trackName: string,
 *   artistName: string,
 *   releaseDate: string,
 *   lyrics?: string,
 *   completeSentence?: string,
 *   questionSentence?: string,
 * }} Song
 */

/**
 * @typedef {import('./rooms.js').Room} Room
 */

/**
 * @param {Room} room
 * @returns {Song | null}
 */
export function pickRandomSong(room) {
  const playlist = room.playlist
  if (!playlist) return null

  const available = playlist.songs.filter((song) => !room.playedTrackIds.includes(song.trackId))
  if (available.length === 0) return null

  const song = available[Math.floor(Math.random() * available.length)]
  room.playedTrackIds.push(song.trackId)
  room.currentSong = song
  return song
}

/**
 * @param {Room} room
 */
export function resetPlayerSubmissions(room) {
  for (const player of room.players.values()) {
    player.submitted = false
    player.answers = {}
  }
}

/**
 * @param {Room} room
 * @returns {{ id: string, type: 'text' | 'number', label: string, prompt: string }[]}
 */
export function buildQuestionPayload(room) {
  if (!room.settings || !room.currentSong) return []

  const { questions } = room.settings
  const song = room.currentSong
  const playlist = room.playlist
  /** @type {{ id: string, type: 'text' | 'number', label: string, prompt: string }[]} */
  const payload = []

  if (questions.creatorName) {
    payload.push({
      id: 'creatorName',
      type: 'text',
      label: 'שם יוצר/ת השיר',
      prompt: '',
    })
  }

  if (questions.singerName) {
    payload.push({
      id: 'singerName',
      type: 'text',
      label: 'שם השיר',
      prompt: '',
    })
  }

  if (questions.releaseYear) {
    payload.push({
      id: 'releaseYear',
      type: 'number',
      label: 'באיזו שנה הוא יצא',
      prompt: '',
    })
  }

  if (questions.completeLyric && playlist?.isWithLyrics && song.questionSentence) {
    payload.push({
      id: 'completeLyric',
      type: 'text',
      label: 'השלם את המשפט',
      prompt: song.questionSentence,
    })
  }

  return payload
}

/**
 * @param {Room} room
 * @returns {{
 *   previewUrl: string,
 *   songDuration: number,
 *   trackId: number,
 *   roundNumber: number,
 * } | null}
 */
export function getRoundAudioPayload(room) {
  if (!room.currentSong || !room.settings) return null

  return {
    previewUrl: room.currentSong.previewUrl,
    songDuration: room.settings.songDuration,
    trackId: room.currentSong.trackId,
    roundNumber: room.roundNumber,
  }
}

/**
 * @param {import('socket.io').Server} io
 * @param {Room} room
 * @returns {{ ok: true, roundAudio: NonNullable<ReturnType<typeof getRoundAudioPayload>> } | { ok: false, error: string }}
 */
export function startRound(io, room) {
  const song = pickRandomSong(room)
  if (!song) {
    return { ok: false, error: 'אין עוד שירים ברשימת ההשמעה' }
  }

  room.roundNumber += 1
  room.phase = 'audio'
  resetPlayerSubmissions(room)
  clearAnswerTimer(room)

  const roundAudio = getRoundAudioPayload(room)
  if (!roundAudio) {
    return { ok: false, error: 'הכנת השמעת הסיבוב נכשלה' }
  }

  io.to(room.code).emit('roundStarted', {
    roundNumber: room.roundNumber,
    phase: 'audio',
  })

  io.to(room.hostId).emit('playAudio', roundAudio)

  return { ok: true, roundAudio }
}

/**
 * @param {Room} room
 */
export function clearAnswerTimer(room) {
  if (room.answerTimerId) {
    clearTimeout(room.answerTimerId)
    room.answerTimerId = null
  }
  room.answerDeadline = null
}

/**
 * @param {Room} room
 * @returns {import('./rooms.js').Player[]}
 */
export function getAnsweringPlayers(room) {
  return Array.from(room.players.values())
}

/**
 * @param {Room} room
 * @returns {boolean}
 */
export function allPlayersSubmitted(room) {
  const answeringPlayers = getAnsweringPlayers(room)
  return answeringPlayers.length > 0 && answeringPlayers.every((player) => player.submitted)
}

/**
 * @param {import('socket.io').Server} io
 * @param {Room} room
 */
export function finishQuestionPhase(io, room) {
  if (room.phase !== 'questions') return

  clearAnswerTimer(room)
  room.phase = 'waiting'

  const questions = buildQuestionPayload(room)
  const { results, songsRemaining } = calculateRoundScores(room, questions)

  const standings = Array.from(room.players.values())
    .map((player) => {
      const playerResult = results[player.id]
      return {
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        roundTotal: playerResult?.roundTotal ?? 0,
        totalScore: playerResult?.totalScore ?? player.score,
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  const roundResultsPayload = {
    roundNumber: room.roundNumber,
    questions: questions.map((question) => ({ id: question.id, label: question.label })),
    results,
    standings,
    songsRemaining,
  }

  room.lastRoundResults = roundResultsPayload

  io.to(room.code).emit('roundResults', roundResultsPayload)
}

/**
 * @param {import('socket.io').Server} io
 * @param {Room} room
 */
export function endGame(io, room) {
  clearAnswerTimer(room)
  room.status = 'ended'
  room.phase = null

  const rankings = Array.from(room.players.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((player, index) => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      score: player.score,
      rank: index + 1,
    }))

  io.to(room.code).emit('endGame', { rankings })
}

/**
 * @param {import('socket.io').Server} io
 * @param {Room} room
 */
export function beginQuestionPhase(io, room) {
  if (!room.settings || !room.currentSong) return

  room.phase = 'questions'
  const answerTimeLimit = room.settings.answerTimeLimit
  const deadline = Date.now() + answerTimeLimit * 1000
  room.answerDeadline = deadline

  const questions = buildQuestionPayload(room)

  io.to(room.code).emit('showQuestions', {
    roundNumber: room.roundNumber,
    answerTimeLimit,
    deadline,
    questions,
  })

  room.answerTimerId = setTimeout(() => {
    finishQuestionPhase(io, room)
  }, answerTimeLimit * 1000)
}
