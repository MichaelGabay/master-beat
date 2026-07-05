import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getSocket } from '@/lib/socket'

/**
 * Listens for server `roomClosed` events (e.g. host disconnect) and exposes
 * a message + dismiss handler that returns the user to the home screen.
 */
export function useRoomClosed() {
  const [closedMessage, setClosedMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const socket = getSocket()

    const handleRoomClosed = ({ message }) => {
      setClosedMessage(message ?? 'המארח התנתק. המשחק הסתיים.')
    }

    socket.on('roomClosed', handleRoomClosed)
    return () => {
      socket.off('roomClosed', handleRoomClosed)
    }
  }, [])

  const dismissRoomClosed = () => {
    setClosedMessage(null)
    navigate('/')
  }

  return { closedMessage, dismissRoomClosed }
}
