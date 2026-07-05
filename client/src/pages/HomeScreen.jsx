import { Music2 } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { FullscreenToggle } from '@/components/FullscreenToggle'
import { Button } from '@/components/ui/button'
import { leaveRoom } from '@/lib/socket'

export function HomeScreen() {
  useEffect(() => {
    leaveRoom().catch(() => {})
  }, [])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#0a0612]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.1)_0%,_transparent_40%)]" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-24 pt-16">
        <div className="mb-auto flex flex-col items-center text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            <Music2 className="size-10 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Master Beat
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          <Link to="/create" className="w-full">
            <Button
              size="lg"
              className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500"
            >
              צור משחק
            </Button>
          </Link>
          <Link to="/join" className="w-full">
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full rounded-xl border-white/15 bg-white/5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              הצטרף למשחק
            </Button>
          </Link>
        </div>
      </main>

      <FullscreenToggle />
    </div>
  )
}
