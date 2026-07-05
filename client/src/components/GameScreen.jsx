import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GameActive } from '@/components/GameActive'

/**
 * @param {{
 *   isHost?: boolean,
 *   playerName?: string,
 *   initialRoundAudio?: {
 *     previewUrl: string,
 *     songDuration: number,
 *     trackId: number,
 *     roundNumber: number,
 *   } | null,
 *   initialSession?: Record<string, unknown> | null,
 * }} props
 */
export function GameScreen({
  isHost = false,
  playerName = '',
  initialRoundAudio = null,
  initialSession = null,
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#0a0612]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.1)_0%,_transparent_40%)]" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-24 pt-10">
        <GameActive
          isHost={isHost}
          playerName={playerName}
          initialRoundAudio={initialRoundAudio}
          initialSession={initialSession}
        />
      </main>

      <FullscreenToggle />
    </div>
  )
}
