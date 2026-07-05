import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GameScreen } from '@/components/GameScreen'
import { PlayersList } from '@/components/PlayersList'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { getSocket, leaveRoom } from '@/lib/socket'

export function JoinGame() {
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [joinedCode, setJoinedCode] = useState(null)
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [restoredSession, setRestoredSession] = useState(null)

  useEffect(() => {
    leaveRoom().catch(() => {})
  }, [])

  useEffect(() => {
    if (!joinedCode) return

    const socket = getSocket()

    const handlePlayersUpdated = ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers)
    }

    const handleGameStarted = () => {
      setGameStarted(true)
    }

    socket.on('playersUpdated', handlePlayersUpdated)
    socket.on('gameStarted', handleGameStarted)

    return () => {
      socket.off('playersUpdated', handlePlayersUpdated)
      socket.off('gameStarted', handleGameStarted)
    }
  }, [joinedCode])

  const handleJoinRoom = (event) => {
    event.preventDefault()
    setError('')

    const trimmedCode = roomCode.trim()
    const trimmedName = playerName.trim()

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('הזן קוד חדר תקין בן 6 ספרות')
      return
    }

    if (!trimmedName) {
      setError('נא להזין את שמך')
      return
    }

    setIsJoining(true)
    const socket = getSocket()

    socket.emit('joinRoom', { code: trimmedCode, playerName: trimmedName }, (response) => {
      setIsJoining(false)

      if (!response?.ok) {
        setError(response?.error ?? 'ההצטרפות לחדר נכשלה')
        return
      }

      setJoinedCode(response.code)
      setPlayers(response.players)

      if (response.reconnected) {
        toast({
          title: 'חיבור מחדש',
          description: 'ברוך שובך! המשך מהמקום שבו עצרת.',
        })

        if (response.session?.status && response.session.status !== 'lobby') {
          setRestoredSession(response.session)
          setGameStarted(true)
        }
      }
    })
  }

  const handleCodeChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6)
    setRoomCode(digitsOnly)
  }

  if (joinedCode && gameStarted) {
    return <GameScreen playerName={playerName.trim()} initialSession={restoredSession} />
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#0a0612]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.1)_0%,_transparent_40%)]" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pb-24 pt-10">
        {!joinedCode ? (
          <>
            <div>
              <Link
                to="/"
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                → חזרה
              </Link>
              <h1 className="mt-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                הצטרף למשחק
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                הזן את קוד החדר מהמארח ובחר שם.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="roomCode" className="text-sm font-medium text-zinc-300">
                  קוד חדר
                </label>
                <Input
                  id="roomCode"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  disabled={isJoining}
                  className="font-mono text-2xl tracking-[0.3em]"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="playerName" className="text-sm font-medium text-zinc-300">
                  השם שלך
                </label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="השם שלך"
                  autoComplete="name"
                  maxLength={24}
                  disabled={isJoining}
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={isJoining}
                className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500"
              >
                {isJoining ? 'מצטרף...' : 'הצטרף לחדר'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                {playerName.trim()}
              </h1>
            </div>

            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="size-8 animate-spin text-purple-400" />
                <p className="text-lg font-medium text-white">ממתין למארח שיתחיל...</p>
                <p className="text-sm text-zinc-400">המתן בזמן שהמארח מגדיר את המשחק.</p>
              </CardContent>
            </Card>

            <PlayersList players={players} />
          </>
        )}
      </main>

      <FullscreenToggle />
    </div>
  )
}
