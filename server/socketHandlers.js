import {
  allPlayersSubmitted,
  beginQuestionPhase,
  clearAnswerTimer,
  endGame,
  finishQuestionPhase,
  getRoundAudioPayload,
  startRound,
} from './game.js'
import { getPlaylistById } from './playlists.js'
import {
  broadcastPlayersUpdated,
  buildSessionRestorePayload,
  generateRoomCode,
  getPlayersList,
  getRoomBySocketId,
  normalizePlayerName,
  releaseSocketFromRoom,
  removePlayerFromRoom,
  rooms,
  socketToRoom,
  validateGameSettings,
} from './rooms.js'

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSocketHandlers(io, socket) {
  socket.on('leaveRoom', (_payload, callback) => {
    releaseSocketFromRoom(socket)
    callback?.({ ok: true })
  })

  socket.on('createRoom', ({ hostName }, callback) => {
    const name = hostName?.trim()

    if (!name) {
      callback?.({ ok: false, error: 'נדרש שם מארח' })
      return
    }

    const existingRoom = getRoomBySocketId(socket.id)
    if (existingRoom?.status === 'ended') {
      releaseSocketFromRoom(socket)
    } else if (socketToRoom.has(socket.id)) {
      callback?.({ ok: false, error: 'כבר נמצא בחדר' })
      return
    }

    const code = generateRoomCode()
    const room = {
      code,
      hostId: socket.id,
      players: new Map([
        [
          socket.id,
          {
            id: socket.id,
            name,
            isHost: true,
            score: 0,
            submitted: false,
            answers: {},
            connected: true,
          },
        ],
      ]),
      settings: null,
      playlist: null,
      status: 'lobby',
      playedTrackIds: [],
      currentSong: null,
      phase: null,
      roundNumber: 0,
      answerDeadline: null,
      answerTimerId: null,
      lastRoundResults: null,
      disconnectedPlayers: new Map(),
    }

    rooms.set(code, room)
    socketToRoom.set(socket.id, code)
    socket.join(code)

    const players = getPlayersList(room)
    const payload = { code, players }

    socket.emit('roomCreated', payload)
    callback?.({ ok: true, ...payload })
  })

  socket.on('joinRoom', ({ code, playerName }, callback) => {
    const trimmedCode = code?.trim()
    const name = playerName?.trim()

    if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
      callback?.({ ok: false, error: 'הזן קוד חדר תקין בן 6 ספרות' })
      return
    }

    if (!name) {
      callback?.({ ok: false, error: 'נדרש שם שחקן' })
      return
    }

    const existingRoom = getRoomBySocketId(socket.id)
    if (existingRoom?.status === 'ended') {
      releaseSocketFromRoom(socket)
    } else if (socketToRoom.has(socket.id)) {
      callback?.({ ok: false, error: 'כבר נמצא בחדר' })
      return
    }

    const room = rooms.get(trimmedCode)
    if (!room) {
      callback?.({ ok: false, error: 'החדר לא נמצא' })
      return
    }

    const normalizedName = normalizePlayerName(name)
    const disconnectedPlayer = room.disconnectedPlayers.get(normalizedName)

    if (disconnectedPlayer) {
      room.disconnectedPlayers.delete(normalizedName)

      const restoredPlayer = {
        ...disconnectedPlayer,
        id: socket.id,
        connected: true,
      }

      room.players.set(socket.id, restoredPlayer)
      socketToRoom.set(socket.id, trimmedCode)
      socket.join(trimmedCode)

      const players = getPlayersList(room)
      const session = buildSessionRestorePayload(room, socket.id)
      const payload = {
        code: trimmedCode,
        players,
        reconnected: true,
        session,
      }

      socket.emit('joinSuccess', payload)
      broadcastPlayersUpdated(io, room)
      callback?.({ ok: true, ...payload })
      return
    }

    const nameTaken = getPlayersList(room).some(
      (player) => normalizePlayerName(player.name) === normalizedName,
    )
    if (nameTaken) {
      callback?.({ ok: false, error: 'השם הזה כבר תפוס בחדר' })
      return
    }

    room.players.set(socket.id, {
      id: socket.id,
      name,
      isHost: false,
      score: 0,
      submitted: false,
      answers: {},
      connected: true,
    })
    socketToRoom.set(socket.id, trimmedCode)
    socket.join(trimmedCode)

    const players = getPlayersList(room)
    const payload = { code: trimmedCode, players }

    socket.emit('joinSuccess', payload)
    broadcastPlayersUpdated(io, room)
    callback?.({ ok: true, ...payload })
  })

  socket.on('startGame', async ({ settings }, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול להתחיל את המשחק' })
      return
    }

    if (room.status !== 'lobby') {
      callback?.({ ok: false, error: 'המשחק כבר התחיל' })
      return
    }

    if (!settings?.playlistId) {
      callback?.({ ok: false, error: 'נדרשת רשימת השמעה' })
      return
    }

    let playlist
    try {
      playlist = await getPlaylistById(settings.playlistId)
    } catch {
      callback?.({ ok: false, error: 'טעינת רשימת ההשמעה נכשלה' })
      return
    }

    if (!playlist) {
      callback?.({ ok: false, error: 'רשימת ההשמעה לא נמצאה' })
      return
    }

    if (!playlist.songs?.length) {
      callback?.({ ok: false, error: 'רשימת ההשמעה ריקה' })
      return
    }

    const validation = validateGameSettings(settings, playlist)
    if (!validation.ok) {
      callback?.({ ok: false, error: validation.error })
      return
    }

    room.settings = settings
    room.playlist = playlist
    room.status = 'playing'
    room.playedTrackIds = []
    room.currentSong = null
    room.phase = null
    room.roundNumber = 0

    for (const player of room.players.values()) {
      player.score = 0
      player.submitted = false
      player.answers = {}
    }

    io.to(room.code).emit('gameStarted', { settings })

    socket.emit('playlistLoaded', { playlist })

    const roundResult = startRound(io, room)
    if (!roundResult.ok) {
      callback?.({ ok: false, error: roundResult.error })
      return
    }

    callback?.({ ok: true, settings, playlist, roundAudio: roundResult.roundAudio })
  })

  socket.on('requestRoundAudio', (_payload, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול לבקש שמע לסיבוב' })
      return
    }

    if (room.phase !== 'audio') {
      callback?.({ ok: false, error: 'לא בשלב השמעה' })
      return
    }

    const roundAudio = getRoundAudioPayload(room)
    if (!roundAudio) {
      callback?.({ ok: false, error: 'אין שיר זמין לסיבוב הזה' })
      return
    }

    callback?.({ ok: true, roundAudio })
  })

  socket.on('hostPlaybackStarted', (_payload, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול להתחיל השמעה' })
      return
    }

    if (room.phase !== 'audio') {
      callback?.({ ok: false, error: 'לא בשלב השמעה' })
      return
    }

    io.to(room.code).emit('audioStateChanged', {
      state: 'playing',
      roundNumber: room.roundNumber,
    })

    callback?.({ ok: true })
  })

  socket.on('hostPlaybackEnded', (_payload, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול לסיים השמעה' })
      return
    }

    if (room.phase !== 'audio') {
      callback?.({ ok: false, error: 'לא בשלב השמעה' })
      return
    }

    io.to(room.code).emit('audioStateChanged', {
      state: 'idle',
      roundNumber: room.roundNumber,
    })

    callback?.({ ok: true })
  })

  socket.on('startQuestions', (_payload, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול להתחיל שאלות' })
      return
    }

    if (room.phase !== 'audio') {
      callback?.({ ok: false, error: 'לא בשלב השמעה' })
      return
    }

    if (!room.currentSong) {
      callback?.({ ok: false, error: 'לא נבחר שיר לסיבוב הזה' })
      return
    }

    beginQuestionPhase(io, room)
    callback?.({ ok: true })
  })

  socket.on('submitAnswers', ({ answers }, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    const player = room.players.get(socket.id)
    if (!player) {
      callback?.({ ok: false, error: 'לא שחקן בחדר הזה' })
      return
    }

    if (room.phase !== 'questions') {
      callback?.({ ok: false, error: 'לא בשלב שאלות' })
      return
    }

    if (player.submitted) {
      callback?.({ ok: false, error: 'התשובות כבר נשלחו' })
      return
    }

    player.answers = answers ?? {}
    player.submitted = true

    callback?.({ ok: true })

    if (allPlayersSubmitted(room)) {
      finishQuestionPhase(io, room)
    }
  })

  socket.on('nextRound', (_payload, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול להתחיל סיבוב הבא' })
      return
    }

    if (room.status !== 'playing') {
      callback?.({ ok: false, error: 'המשחק לא פעיל' })
      return
    }

    if (room.phase !== 'waiting') {
      callback?.({ ok: false, error: 'הסיבוב הנוכחי עדיין לא הסתיים' })
      return
    }

    const roundResult = startRound(io, room)
    if (!roundResult.ok) {
      endGame(io, room)
      callback?.({ ok: true, gameEnded: true })
      return
    }

    callback?.({ ok: true, roundAudio: roundResult.roundAudio })
  })

  socket.on('endGame', (_payload, callback) => {
    const room = getRoomBySocketId(socket.id)

    if (!room) {
      callback?.({ ok: false, error: 'לא נמצא בחדר' })
      return
    }

    if (socket.id !== room.hostId) {
      callback?.({ ok: false, error: 'רק המארח יכול לסיים את המשחק' })
      return
    }

    if (room.status !== 'playing') {
      callback?.({ ok: false, error: 'המשחק לא פעיל' })
      return
    }

    if (room.phase !== 'waiting') {
      callback?.({ ok: false, error: 'הסיבוב הנוכחי עדיין לא הסתיים' })
      return
    }

    endGame(io, room)
    callback?.({ ok: true })
  })

  socket.on('disconnect', () => {
    const room = getRoomBySocketId(socket.id)
    if (room) {
      clearAnswerTimer(room)
    }
    removePlayerFromRoom(io, socket.id)
  })
}
