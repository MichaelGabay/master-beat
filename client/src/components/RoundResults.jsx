import { ChevronDown, Music2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 * }} QuestionSummary
 */

/**
 * @typedef {{
 *   questionScores: Record<string, { points: number, label: string, playerAnswer: string, correctAnswer: string }>,
 *   roundTotal: number,
 *   totalScore: number,
 * }} PlayerRoundResult
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   isHost: boolean,
 *   roundTotal: number,
 *   totalScore: number,
 *   rank: number,
 * }} RoundStanding
 */

function songsRemainingText(count) {
  if (count === 1) return 'שיר אחד נותר ברשימת ההשמעה'
  if (count === 2) return '2 שירים נותרו ברשימת ההשמעה'
  return `${count} שירים נותרו ברשימת ההשמעה`
}

/**
 * @param {{
 *   roundNumber: number,
 *   questions: QuestionSummary[],
 *   playerResult: PlayerRoundResult | null,
 *   standings?: RoundStanding[],
 *   currentPlayerId?: string | null,
 *   isHost?: boolean,
 *   songsRemaining?: number,
 *   onNextSong?: () => void,
 *   onEndGame?: () => void,
 *   isAdvancing?: boolean,
 * }} props
 */
export function RoundResults({
  roundNumber,
  questions,
  playerResult,
  standings = [],
  currentPlayerId = null,
  isHost = false,
  songsRemaining = 0,
  onNextSong,
  onEndGame,
  isAdvancing = false,
}) {
  const noSongsLeft = songsRemaining === 0
  const [expandedQuestionId, setExpandedQuestionId] = useState(/** @type {string | null} */ (null))

  return (
    <div className="flex flex-col gap-4">
      {playerResult && (
        <>
          <div className="flex flex-col gap-2">
            {questions.map((question) => {
              const score = playerResult.questionScores[question.id]
              const points = score?.points ?? 0
              const isExpanded = expandedQuestionId === question.id
              const playerAnswer = score?.playerAnswer?.trim() ?? ''
              const correctAnswer = score?.correctAnswer ?? ''

              return (
                <div
                  key={question.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestionId(isExpanded ? null : question.id)
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition-colors hover:bg-white/5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ChevronDown
                        className={cn(
                          'size-4 shrink-0 text-zinc-500 transition-transform',
                          isExpanded && 'rotate-180',
                        )}
                      />
                      <span className="text-sm text-zinc-300">{question.label}</span>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold ${points > 0 ? 'text-green-400' : 'text-zinc-500'}`}
                      dir="ltr"
                    >
                      +{points} נק׳
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 border-t border-white/10 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-500">התשובה שלך</p>
                        <p
                          className={cn(
                            'mt-1 text-sm',
                            playerAnswer ? 'text-white' : 'text-zinc-500 italic',
                          )}
                          dir="ltr"
                        >
                          {playerAnswer || 'לא ענית'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500">התשובה הנכונה</p>
                        <p className="mt-1 text-sm text-green-400" dir="ltr">
                          {correctAnswer || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
            <p className="text-xs font-medium text-zinc-400">
              סה״כ הרווחת בסיבוב זה
            </p>
            <p className="shrink-0 text-base font-bold text-white" dir="ltr">
              +{playerResult.roundTotal}
            </p>
          </div>
        </>
      )}

      {standings.length > 0 && (
        <Card className="border-white/10 bg-black/20">
          <CardContent className="flex flex-col gap-2 pt-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              מצב הנקודות
            </p>
            {standings.map((entry) => {
              const isCurrentPlayer = entry.id === currentPlayerId

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    isCurrentPlayer
                      ? 'border-purple-500/40 bg-purple-500/10'
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrentPlayer
                          ? 'bg-purple-500/30 text-purple-100'
                          : 'bg-white/10 text-zinc-300'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {entry.name}
                      </p>
                      <p
                        className={`text-xs ${entry.roundTotal > 0 ? 'text-green-400' : 'text-zinc-500'}`}
                        dir="ltr"
                      >
                        +{entry.roundTotal} בסיבוב
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${isCurrentPlayer ? 'text-purple-200' : 'text-zinc-300'}`}
                    dir="ltr"
                  >
                    {entry.totalScore} נק׳
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {isHost && (
        <div className="flex flex-col gap-3">
          {noSongsLeft ? (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
              כל השירים ברשימת ההשמעה הושמעו. המשחק יסתיים כשתמשיך.
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-400">
              {songsRemainingText(songsRemaining)}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            onClick={onNextSong}
            disabled={isAdvancing}
            className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white hover:from-purple-500 hover:to-pink-500"
          >
            <Music2 className="size-5" />
            {noSongsLeft ? 'סיים משחק' : 'שיר הבא'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onEndGame}
            disabled={isAdvancing}
            className="h-12 w-full rounded-xl border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
          >
            סיים משחק
          </Button>
        </div>
      )}
    </div>
  )
}
