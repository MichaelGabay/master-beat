import { Copy, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GameScreen } from '@/components/GameScreen'
import { GameSettings } from '@/components/GameSettings'
import { PlayersList } from '@/components/PlayersList'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { unlockAudioPlayback } from '@/lib/audio'
import { fetchPlaylists, getPlaylistById } from '@/lib/playlists'
import { getSocket, leaveRoom } from '@/lib/socket'

const DEFAULT_SETTINGS = {
  playlistId: '',
  questions: {
    singerName: true,
    creatorName: false,
    releaseYear: false,
    completeLyric: false,
  },
  songDuration: 10,
  answerTimeLimit: 60,
}

export function CreateGame() {
  const [hostName, setHostName] = useState('')
  const [roomCode, setRoomCode] = useState(null)
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [playlistsError, setPlaylistsError] = useState('')
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [gameStarted, setGameStarted] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [initialRoundAudio, setInitialRoundAudio] = useState(null)

  const playlist = getPlaylistById(playlists, settings.playlistId) ?? playlists[0]

  useEffect(() => {
    leaveRoom().catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchPlaylists()
      .then((items) => {
        if (cancelled) return

        setPlaylists(items)
        if (items.length > 0) {
          setSettings((current) => ({
            ...current,
            playlistId: current.playlistId || items[0].id,
          }))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaylistsError('טעינת רשימות ההשמעה נכשלה')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPlaylists(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!playlist?.isWithLyrics && settings.questions.completeLyric) {
      setSettings((current) => ({
        ...current,
        questions: { ...current.questions, completeLyric: false },
      }))
    }
  }, [playlist?.isWithLyrics, settings.questions.completeLyric])

  useEffect(() => {
    if (!roomCode) return

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
  }, [roomCode])

  const handleCreateRoom = (event) => {
    event.preventDefault()
    setError('')

    const trimmedName = hostName.trim()
    if (!trimmedName) {
      setError('נא להזין את שמך')
      return
    }

    setIsCreating(true)
    const socket = getSocket()

    socket.emit('createRoom', { hostName: trimmedName }, (response) => {
      setIsCreating(false)

      if (!response?.ok) {
        setError(response?.error ?? 'יצירת החדר נכשלה')
        return
      }

      setRoomCode(response.code)
      setPlayers(response.players)
    })
  }

  const handleStartGame = () => {
    setStartError('')
    setIsStarting(true)

    unlockAudioPlayback().catch(() => {})

    const socket = getSocket()
    const payload = {
      ...settings,
      answerTimeLimit: Number(settings.answerTimeLimit),
    }

    socket.emit('startGame', { settings: payload }, (response) => {
      setIsStarting(false)

      if (!response?.ok) {
        setStartError(response?.error ?? 'התחלת המשחק נכשלה')
        return
      }

      setGameStarted(true)
      if (response.roundAudio) {
        setInitialRoundAudio(response.roundAudio)
      }
    })
  }

  const handleCopyCode = async () => {
    if (!roomCode) return

    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  if (roomCode && gameStarted) {
    return <GameScreen isHost playerName={hostName.trim()} initialRoundAudio={initialRoundAudio} />
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#0a0612]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.1)_0%,_transparent_40%)]" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pb-24 pt-10">
        {!roomCode ? (
          <>
            <div>
              <Link
                to="/"
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                → חזרה
              </Link>
              <h1 className="mt-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                צור משחק
              </h1>
              <p className="mt-2 text-sm text-zinc-400">הזן את שמך כדי לארח משחק חדש.</p>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="hostName" className="text-sm font-medium text-zinc-300">
                  שם מארח
                </label>
                <Input
                  id="hostName"
                  value={hostName}
                  onChange={(event) => setHostName(event.target.value)}
                  placeholder="השם שלך"
                  autoComplete="name"
                  maxLength={24}
                  disabled={isCreating}
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={isCreating}
                className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500"
              >
                {isCreating ? 'יוצר...' : 'צור חדר'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div>
              <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                {hostName.trim()}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">שתף את הקוד הזה כדי ששחקנים יוכלו להצטרף.</p>
            </div>

            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="flex items-center justify-between gap-4 pt-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    קוד חדר
                  </p>
                  <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-white" dir="ltr">
                    {roomCode}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={handleCopyCode}
                  className="shrink-0 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  aria-label="העתק קוד חדר"
                >
                  {copied ? <Check className="size-5 text-green-400" /> : <Copy className="size-5" />}
                </Button>
              </CardContent>
            </Card>

            {isLoadingPlaylists ? (
              <p className="text-sm text-zinc-400">טוען רשימות השמעה...</p>
            ) : playlistsError ? (
              <p className="text-sm text-red-400">{playlistsError}</p>
            ) : playlists.length === 0 ? (
              <p className="text-sm text-amber-400">לא נמצאו רשימות השמעה.</p>
            ) : playlist ? (
              <GameSettings
                playlists={playlists}
                playlist={playlist}
                settings={settings}
                onSettingsChange={setSettings}
                onStartGame={handleStartGame}
                isStarting={isStarting}
              />
            ) : null}
            {startError && <p className="text-sm text-red-400">{startError}</p>}

            <PlayersList players={players} />
          </>
        )}
      </main>

      <FullscreenToggle />
    </div>
  )
}
