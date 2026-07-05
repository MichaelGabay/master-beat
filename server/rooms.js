import { buildQuestionPayload } from './game.js'

/** @typedef {{ id: string, name: string, isHost: boolean, score: number, submitted: boolean, answers: Record<string, string>, connected: boolean }} Player */

/**
 * @typedef {{
 *   playlistId: string,
 *   questions: {
 *     singerName: boolean,
 *     creatorName: boolean,
 *     releaseYear: boolean,
 *     completeLyric: boolean,
 *   },
 *   songDuration: 2 | 5 | 10 | 30,
 *   answerTimeLimit: 30 | 60 | 90 | 120,
 * }} GameSettings
 */

/** @typedef {'audio' | 'questions' | 'waiting'} GamePhase */

/**
 * @typedef {{
 *   code: string,
 *   hostId: string,
 *   players: Map<string, Player>,
 *   settings: GameSettings | null,
 *   playlist: { id: string, name: string, isWithLyrics: boolean, imageUrl: string, songs: import('./game.js').Song[] } | null,
 *   status: 'lobby' | 'playing' | 'ended',
 *   playedTrackIds: number[],
 *   currentSong: import('./game.js').Song | null,
 *   phase: GamePhase | null,
 *   roundNumber: number,
 *   answerDeadline: number | null,
 *   answerTimerId: ReturnType<typeof setTimeout> | null,
 *   lastRoundResults: import('./game.js').RoundResultsPayload | null,
 *   disconnectedPlayers: Map<string, Player>,
 * }} Room */

/** @type {Map<string, Room>} */
export const rooms = new Map()

/** @type {Map<string, string>} socketId -> room code */
export const socketToRoom = new Map()

/**
 * @returns {string}
 */
export function generateRoomCode() {
  let code
  do {
    code = String(Math.floor(100000 + Math.random() * 900000))
  } while (rooms.has(code))
  return code
}

/**
 * @param {string} name
 * @returns {string}
 */
export function normalizePlayerName(name) {
  return name.trim().toLowerCase()
}

/**
 * @param {Room} room
 * @returns {Player[]}
 */
export function getPlayersList(room) {
  return Array.from(room.players.values()).filter((player) => player.connected)
}

/**
 * @param {string} socketId
 * @returns {Room | undefined}
 */
export function getRoomBySocketId(socketId) {
  const code = socketToRoom.get(socketId)
  if (!code) return undefined
  return rooms.get(code)
}

/**
 * @param {Room} room
 */
export function broadcastPlayersUpdated(io, room) {
  const players = getPlayersList(room)
  io.to(room.code).emit('playersUpdated', { players })
}

const VALID_SONG_DURATIONS = new Set([2, 5, 10, 30])
const VALID_ANSWER_TIME_LIMITS = new Set([30, 60, 90, 120])

/**
 * @param {GameSettings | null | undefined} settings
 * @param {{ isWithLyrics?: boolean }} [playlist]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateGameSettings(settings, playlist = { isWithLyrics: true }) {
  if (!settings) {
    return { ok: false, error: 'נדרשות הגדרות משחק' }
  }

  const { questions, songDuration, answerTimeLimit } = settings

  if (!questions || typeof questions !== 'object') {
    return { ok: false, error: 'נדרשות הגדרות שאלות' }
  }

  const activeQuestions = Object.entries(questions).filter(([key, enabled]) => {
    if (!enabled) return false
    if (key === 'completeLyric' && !playlist.isWithLyrics) return false
    return true
  })

  if (activeQuestions.length === 0) {
    return { ok: false, error: 'יש להפעיל לפחות סוג שאלה אחד' }
  }

  if (!VALID_SONG_DURATIONS.has(songDuration)) {
    return { ok: false, error: 'משך שיר לא תקין' }
  }

  if (!VALID_ANSWER_TIME_LIMITS.has(answerTimeLimit)) {
    return { ok: false, error: 'זמן לענות לא תקין' }
  }

  return { ok: true }
}

/**
 * @param {import('socket.io').Server} io
 * @param {Room} room
 */
function closeRoomDueToHostDisconnect(io, room) {
  for (const playerId of room.players.keys()) {
    socketToRoom.delete(playerId)
  }

  if (room.players.size > 0) {
    io.to(room.code).emit('hostDisconnected', {
      reason: 'hostDisconnected',
      message: 'המארח התנתק. המשחק הסתיים.',
    })
  }

  rooms.delete(room.code)
}

/**
 * @param {import('socket.io').Socket} socket
 * @returns {boolean}
 */
export function releaseSocketFromRoom(socket) {
  const socketId = socket.id
  const code = socketToRoom.get(socketId)
  if (!code) return false

  const room = rooms.get(code)
  socket.leave(code)
  socketToRoom.delete(socketId)

  if (!room) return true

  room.players.delete(socketId)

  for (const [name, player] of room.disconnectedPlayers.entries()) {
    if (player.id === socketId) {
      room.disconnectedPlayers.delete(name)
    }
  }

  if (room.players.size === 0 && room.disconnectedPlayers.size === 0) {
    rooms.delete(code)
  }

  return true
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} socketId
 */
export function removePlayerFromRoom(io, socketId) {
  const code = socketToRoom.get(socketId)
  if (!code) return

  const room = rooms.get(code)
  if (!room) {
    socketToRoom.delete(socketId)
    return
  }

  const isHost = socketId === room.hostId
  const player = room.players.get(socketId)

  room.players.delete(socketId)
  socketToRoom.delete(socketId)

  if (isHost) {
    closeRoomDueToHostDisconnect(io, room)
    return
  }

  if (player) {
    room.disconnectedPlayers.set(normalizePlayerName(player.name), {
      ...player,
      connected: false,
    })
  }

  const connectedCount = Array.from(room.players.values()).filter((entry) => entry.connected).length
  if (connectedCount === 0 && room.disconnectedPlayers.size === 0) {
    rooms.delete(code)
    return
  }

  broadcastPlayersUpdated(io, room)
}

/**
 * @param {Room} room
 * @param {string} socketId
 * @returns {object | null}
 */
export function buildSessionRestorePayload(room, socketId) {
  const player = room.players.get(socketId)
  if (!player) return null

  /** @type {Record<string, unknown>} */
  const session = {
    status: room.status,
    score: player.score,
    roundNumber: room.roundNumber,
    phase: null,
  }

  if (room.status === 'lobby') {
    return session
  }

  if (room.status === 'ended') {
    const rankings = Array.from(room.players.values())
      .concat(Array.from(room.disconnectedPlayers.values()))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .map((entry, index) => ({
        id: entry.id,
        name: entry.name,
        isHost: entry.isHost,
        score: entry.score,
        rank: index + 1,
      }))

    session.phase = 'ended'
    session.rankings = rankings
    return session
  }

  if (room.phase === 'audio') {
    session.phase = 'audio'
    return session
  }

  if (room.phase === 'questions') {
    session.phase = player.submitted ? 'submitted' : 'questions'
    if (!player.submitted && room.answerDeadline && room.settings && room.currentSong) {
      session.questionsPayload = {
        roundNumber: room.roundNumber,
        answerTimeLimit: room.settings.answerTimeLimit,
        deadline: room.answerDeadline,
        questions: buildQuestionPayload(room),
      }
    }
    return session
  }

  if (room.phase === 'waiting' && room.lastRoundResults) {
    session.phase = 'roundResults'
    session.roundResultsPayload = room.lastRoundResults
    return session
  }

  session.phase = 'waiting'
  return session
}
