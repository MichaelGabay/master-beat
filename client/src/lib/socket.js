import { io } from 'socket.io-client'
import { SERVER_URL } from './config.js'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
    })
  }

  return socket
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
