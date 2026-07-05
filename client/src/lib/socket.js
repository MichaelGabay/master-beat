import { io } from 'socket.io-client'
import { SERVER_URL } from './config.js'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })
  }

  return socket
}

/**
 * Rejoin a room after disconnect or page reload using saved credentials.
 * @param {{ roomCode: string, playerName: string }} session
 * @returns {Promise<Record<string, unknown> | undefined>}
 */
export function reconnectToSession({ roomCode, playerName }) {
  const activeSocket = getSocket()

  return new Promise((resolve) => {
    const attempt = () => {
      activeSocket.emit(
        'joinRoom',
        { code: roomCode, playerName },
        (response) => resolve(response),
      )
    }

    if (activeSocket.connected) {
      attempt()
    } else {
      activeSocket.once('connect', attempt)
    }
  })
}

export function pingServer(payload) {
  const activeSocket = getSocket()
  activeSocket.emit('ping', payload)
}

export function leaveRoom() {
  const activeSocket = getSocket()

  return new Promise((resolve) => {
    if (!activeSocket.connected) {
      resolve({ ok: true })
      return
    }

    activeSocket.emit('leaveRoom', {}, (response) => {
      resolve(response ?? { ok: true })
    })
  })
}
