import { Headphones, Pause } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

/**
 * @param {{
 *   roundNumber?: number,
 *   audioState?: 'idle' | 'playing',
 * }} props
 */
export function ListeningPhase({ roundNumber, audioState = 'idle' }) {
  const isPlaying = audioState === 'playing'

  return (
    <Card className="border-purple-500/30 bg-purple-500/10">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-purple-500/20">
          {isPlaying ? (
            <Headphones className="size-8 animate-pulse text-purple-300" />
          ) : (
            <Pause className="size-8 text-zinc-400" />
          )}
        </div>
        <div>
          <p className="text-xl font-semibold text-white">
            {isPlaying ? 'הקשיבו היטב' : 'ממתין למארח'}
          </p>
          {roundNumber != null && (
            <p className="mt-1 text-sm text-zinc-400">סיבוב {roundNumber}</p>
          )}
          <p className="mt-3 text-sm text-zinc-400">
            {isPlaying
              ? 'המארח מנגן שיר. הקשיבו לרמקול שלו — השאלות בדרך.'
              : 'המארח ינגן את השיר כשיהיה מוכן. הוא יכול לנגן שוב לפני תחילת השאלות.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
