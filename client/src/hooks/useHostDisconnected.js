import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { toast } from '@/hooks/use-toast'
import { getSocket } from '@/lib/socket'

const HOST_DISCONNECTED_MESSAGE = 'המארח התנתק. המשחק הסתיים.'

/**
 * Listens for `hostDisconnected` and redirects to home with a toast notification.
 */
export function useHostDisconnected() {
  const navigate = useNavigate()

  useEffect(() => {
    const socket = getSocket()

    const handleHostDisconnected = ({ message } = {}) => {
      toast({
        variant: 'destructive',
        title: 'המשחק הסתיים',
        description: message ?? HOST_DISCONNECTED_MESSAGE,
      })
      navigate('/', { replace: true })
    }

    socket.on('hostDisconnected', handleHostDisconnected)
    return () => {
      socket.off('hostDisconnected', handleHostDisconnected)
    }
  }, [navigate])
}
