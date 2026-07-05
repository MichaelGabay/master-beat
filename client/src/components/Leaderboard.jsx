import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Crown, Home, Medal, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import { leaveRoom } from '@/lib/socket'

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   isHost: boolean,
 *   score: number,
 *   rank: number,
 * }} RankingEntry
 */

const PODIUM_STYLES = {
  1: {
    order: 'order-2',
    height: 'h-36',
    width: 'w-[30%]',
    gradient: 'from-amber-400 to-yellow-600',
    ring: 'ring-amber-400/50',
    icon: Crown,
    label: '1',
  },
  2: {
    order: 'order-1',
    height: 'h-28',
    width: 'w-[28%]',
    gradient: 'from-zinc-300 to-zinc-500',
    ring: 'ring-zinc-400/40',
    icon: Medal,
    label: '2',
  },
  3: {
    order: 'order-3',
    height: 'h-24',
    width: 'w-[28%]',
    gradient: 'from-orange-400 to-amber-700',
    ring: 'ring-orange-400/40',
    icon: Medal,
    label: '3',
  },
}

/**
 * @param {{ rankings: RankingEntry[] }} props
 */
export function Leaderboard({ rankings }) {
  const confettiFired = useRef(false)
  const navigate = useNavigate()
  const podium = rankings.filter((entry) => entry.rank <= 3)
  const rest = rankings.filter((entry) => entry.rank > 3)

  const handleGoHome = async () => {
    await leaveRoom()
    navigate('/')
  }

  useEffect(() => {
    if (confettiFired.current) return
    confettiFired.current = true

    const duration = 2500
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#a855f7', '#ec4899', '#fbbf24', '#22c55e'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#a855f7', '#ec4899', '#fbbf24', '#22c55e'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#fbbf24', '#f472b6'],
    })

    requestAnimationFrame(frame)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Trophy className="mx-auto size-12 text-amber-400" />
        <h2 className="mt-3 bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 bg-clip-text text-2xl font-bold text-transparent">
          טבלת המובילים
        </h2>
        <p className="mt-1 text-sm text-zinc-400">תודה ששיחקתם!</p>
      </div>

      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-2 px-2">
          {podium.map((entry) => {
            const style = PODIUM_STYLES[entry.rank]
            if (!style) return null

            const Icon = style.icon

            return (
              <div
                key={entry.id}
                className={`flex flex-col items-center ${style.order} ${style.width}`}
              >
                <Icon
                  className={`mb-2 size-5 ${entry.rank === 1 ? 'text-amber-300' : entry.rank === 2 ? 'text-zinc-300' : 'text-orange-300'}`}
                />
                <p className="max-w-full truncate text-center text-xs font-semibold text-white">
                  {entry.name}
                </p>
                <p className="text-xs text-zinc-400" dir="ltr">{entry.score} נק׳</p>
                <div
                  className={`mt-2 flex w-full flex-col items-center justify-end rounded-t-xl bg-gradient-to-t ${style.gradient} ${style.height} ring-2 ${style.ring}`}
                >
                  <span className="pb-3 text-sm font-bold text-black/70">{style.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rest.length > 0 && (
        <Card className="border-white/10 bg-black/20">
          <CardContent className="flex flex-col gap-2 pt-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              שאר השחקנים
            </p>
            {rest.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-200">
                    {entry.rank}
                  </span>
                  <span className="text-sm font-medium text-white">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold text-zinc-300" dir="ltr">{entry.score} נק׳</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <button
        type="button"
        onClick={handleGoHome}
        className="group/button inline-flex h-14 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white hover:from-purple-500 hover:to-pink-500"
      >
        <Home className="size-5" />
        חזרה לדף הבית
      </button>
    </div>
  )
}
