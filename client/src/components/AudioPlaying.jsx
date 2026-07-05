import { Music2, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * @param {{
 *   roundNumber?: number,
 *   songDuration?: number,
 *   playbackStatus?: 'idle' | 'playing' | 'finished',
 *   playbackError?: string | null,
 *   isSongReady?: boolean,
 *   onPlay?: () => void,
 *   onStartQuestions?: () => void,
 *   isStartingQuestions?: boolean,
 * }} props
 */
export function AudioPlaying({
  roundNumber,
  songDuration,
  playbackStatus = 'idle',
  playbackError = null,
  isSongReady = true,
  onPlay,
  onStartQuestions,
  isStartingQuestions = false,
}) {
  const isPlaying = playbackStatus === 'playing'
  const isFinished = playbackStatus === 'finished'
  const isIdle = playbackStatus === 'idle'

  return (
    <Card className="border-purple-500/30 bg-purple-500/10">
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="relative flex size-24 items-center justify-center">
          {isPlaying && <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/20" />}
          <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600/40 to-pink-600/40">
            {playbackError ? (
              <VolumeX className="size-10 text-amber-300" />
            ) : (
              <Music2 className={`size-10 text-purple-200 ${isPlaying ? 'animate-pulse' : ''}`} />
            )}
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold text-white">
            {isPlaying ? 'מנגן' : isFinished ? 'ההשמעה הסתיימה' : 'מוכן להשמעה'}
          </p>
          {roundNumber != null && (
            <p className="mt-1 text-sm text-zinc-400">סיבוב {roundNumber}</p>
          )}
          {playbackError ? (
            <p className="mt-3 text-sm text-red-400">{playbackError}</p>
          ) : isPlaying ? (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Volume2 className="size-4 text-pink-400" />
              מנגן {songDuration} שנ׳ — השחקנים צריכים להקשיב
            </p>
          ) : isFinished ? (
            <p className="mt-3 text-sm text-zinc-400">
              נגן שוב ({songDuration} שנ׳) או התחל את השאלות כשאתה מוכן.
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">
              לחץ על נגן כדי להתחיל את השיר (תצוגה מקדימה של {songDuration} שנ׳).
            </p>
          )}
        </div>

        {isIdle && onPlay && (
          <Button
            type="button"
            size="lg"
            disabled={!isSongReady}
            onClick={onPlay}
            className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40"
          >
            <Play className="size-5" />
            {isSongReady ? 'נגן שיר' : 'טוען שיר...'}
          </Button>
        )}

        {isFinished && (
          <div className="flex w-full flex-col gap-2">
            {onPlay && (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={onPlay}
                className="h-14 w-full rounded-xl border-white/15 bg-white/5 text-base font-semibold text-white hover:bg-white/10"
              >
                <RotateCcw className="size-5" />
                נגן שוב ({songDuration} שנ׳)
              </Button>
            )}
            {onStartQuestions && (
              <Button
                type="button"
                size="lg"
                disabled={isStartingQuestions}
                onClick={onStartQuestions}
                className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500"
              >
                {isStartingQuestions ? 'מתחיל...' : 'התחל שאלות'}
              </Button>
            )}
          </div>
        )}

        {isPlaying && !playbackError && (
          <div className="flex items-end gap-1.5">
            {[0, 1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className="w-2 rounded-full bg-gradient-to-t from-purple-500 to-pink-400"
                style={{
                  height: `${16 + (bar % 3) * 10}px`,
                  animation: 'audio-bar 0.8s ease-in-out infinite',
                  animationDelay: `${bar * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes audio-bar {
            0%, 100% { transform: scaleY(0.5); opacity: 0.6; }
            50% { transform: scaleY(1.4); opacity: 1; }
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
