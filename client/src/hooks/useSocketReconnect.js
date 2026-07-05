import { useEffect, useRef } from 'react'

import { toast } from '@/hooks/use-toast'
import { loadSession } from '@/lib/session'
import { getSocket, reconnectToSession } from '@/lib/socket'

/**
 * Rejoins the room when the socket reconnects after a temporary disconnect.
 * @param {(response: Record<string, unknown>) => void} onRestored
 * @param {boolean} [enabled]
 */
export function useSocketReconnect(onRestored, enabled = true) {
  const onRestoredRef = useRef(onRestored)
  onRestoredRef.current = onRestored

  useEffect(() => {
    if (!enabled) return

    const socket = getSocket()
    let hasDisconnected = false

    const handleDisconnect = () => {
      hasDisconnected = true
    }

    const handleConnect = () => {
      if (!hasDisconnected) return

      const session = loadSession()
      if (!session) return

      reconnectToSession(session).then((response) => {
        if (!response?.ok) return

        if (response.reconnected) {
          toast({
            title: 'חיבור מחדש',
            description: 'ברוך שובך! המשך מהמקום שבו עצרת.',
          })
        }

        onRestoredRef.current(response)
      })
    }

    socket.on('disconnect', handleDisconnect)
    socket.on('connect', handleConnect)

    return () => {
      socket.off('disconnect', handleDisconnect)
      socket.off('connect', handleConnect)
    }
  }, [enabled])
}
