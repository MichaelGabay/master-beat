import { ChevronDown, Music2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const MAX_QUESTION_POINTS = 10

/**
 * @typedef {'full' | 'partial' | 'none'} ScoreLevel
 */

/**
 * @param {number} points
 * @returns {ScoreLevel}
 */
function getScoreLevel(points) {
  if (points >= MAX_QUESTION_POINTS) return 'full'
  if (points > 0) return 'partial'
  return 'none'
}

/** @type {Record<ScoreLevel, { bar: string, points: string, ring: string }>} */
const scoreLevelStyles = {
  full: {
    bar: 'bg-green-500',
    points: 'text-green-400',
    ring: 'ring-green-500/30',
  },
  partial: {
    bar: 'bg-amber-400',
    points: 'text-amber-300',
    ring: 'ring-amber-400/30',
  },
  none: {
    bar: 'bg-red-500/80',
    points: 'text-red-400/90',
    ring: 'ring-red-500/20',
  },
}

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
    <div className="flex flex-col gap-5">
      {playerResult && (
        <Card className="border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-black/20">
          <CardContent className="flex flex-col gap-4 pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-purple-300/80">
              התוצאות שלי · סיבוב {roundNumber}
            </p>

            <p className="text-sm text-zinc-400">
              סה״כ הרווחת בסיבוב זה{' '}
              <span
                className={cn(
                  'font-semibold',
                  playerResult.roundTotal > 0 ? 'text-green-400' : 'text-zinc-300',
                )}
                dir="ltr"
              >
                {playerResult.roundTotal > 0 ? `+${playerResult.roundTotal}` : playerResult.roundTotal}
              </span>
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-zinc-500">פירוט לפי שאלה</p>
              {questions.map((question) => {
                const score = playerResult.questionScores[question.id]
                const points = score?.points ?? 0
                const level = getScoreLevel(points)
                const styles = scoreLevelStyles[level]
                const isExpanded = expandedQuestionId === question.id
                const playerAnswer = score?.playerAnswer?.trim() ?? ''
                const correctAnswer = score?.correctAnswer ?? ''

                return (
                  <div
                    key={question.id}
                    className={cn(
                      'overflow-hidden rounded-xl border border-white/10 bg-black/25 ring-1',
                      styles.ring,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedQuestionId(isExpanded ? null : question.id)
                      }
                      className="flex w-full items-stretch text-start transition-colors hover:bg-white/5"
                    >
                      <div className={cn('w-1 shrink-0', styles.bar)} aria-hidden />
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <ChevronDown
                            className={cn(
                              'size-4 shrink-0 text-zinc-500 transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                          />
                          <span className="text-sm text-zinc-200">{question.label}</span>
                        </div>
                        <span
                          className={cn('shrink-0 text-sm font-bold', styles.points)}
                          dir="ltr"
                        >
                          +{points} נק׳
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-white/10 px-4 py-3 ps-5">
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
          </CardContent>
        </Card>
      )}

      {standings.length > 0 && (
        <Card className="border-white/10 bg-black/20">
          <CardContent className="flex flex-col gap-2 pt-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              לוח התוצאות
            </p>
            {standings.map((entry) => {
              const isCurrentPlayer = entry.id === currentPlayerId

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-4 py-3',
                    isCurrentPlayer
                      ? 'border-purple-500/40 bg-purple-500/10'
                      : 'border-white/5 bg-white/5',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        isCurrentPlayer
                          ? 'bg-purple-500/30 text-purple-100'
                          : 'bg-white/10 text-zinc-300',
                      )}
                    >
                      {entry.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                      <p
                        className={cn(
                          'text-xs',
                          entry.roundTotal > 0 ? 'text-green-400' : 'text-zinc-500',
                        )}
                        dir="ltr"
                      >
                        +{entry.roundTotal} בסיבוב
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-semibold',
                      isCurrentPlayer ? 'text-purple-200' : 'text-zinc-300',
                    )}
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
