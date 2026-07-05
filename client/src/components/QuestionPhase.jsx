import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * @typedef {{
 *   id: string,
 *   type: 'text' | 'number',
 *   label: string,
 *   prompt: string,
 * }} Question
 */

const RING_RADIUS = 42
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * @param {number} remainingRatio 0–1, where 1 = full time left
 * @returns {string}
 */
function getTimerColor(remainingRatio) {
  if (remainingRatio > 0.5) return '#22c55e'
  if (remainingRatio > 0.25) return '#eab308'
  return '#ef4444'
}

/**
 * @param {{
 *   remainingSeconds: number,
 *   remainingRatio: number,
 *   timerColor: string,
 *   isUrgent: boolean,
 * }} props
 */
function CountdownClock({ remainingSeconds, remainingRatio, timerColor, isUrgent }) {
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - remainingRatio)

  return (
    <div className="relative flex size-[5.5rem] items-center justify-center">
      {isUrgent && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 0 2px ${timerColor}40` }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
        <circle
          cx="48"
          cy="48"
          r={RING_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="48"
          cy="48"
          r={RING_RADIUS}
          fill="none"
          stroke={timerColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset,stroke] duration-100 ease-linear"
        />
      </svg>

      <motion.span
        key={remainingSeconds}
        initial={{ scale: 1.15, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative font-mono text-3xl font-bold tabular-nums"
        style={{ color: timerColor }}
        dir="ltr"
      >
        {remainingSeconds}
      </motion.span>
    </div>
  )
}

/**
 * @param {{
 *   questions: Question[],
 *   deadline: number,
 *   answerTimeLimit: number,
 *   onSubmit: (answers: Record<string, string>) => void,
 * }} props
 */
export function QuestionPhase({ questions, deadline, answerTimeLimit, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadline - Date.now()))
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null))

  const currentQuestion = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1

  const remainingRatio = useMemo(() => {
    if (answerTimeLimit <= 0) return 0
    return Math.max(0, remainingMs / (answerTimeLimit * 1000))
  }, [answerTimeLimit, remainingMs])

  const timerColor = getTimerColor(remainingRatio)
  const isUrgent = remainingRatio <= 0.25 && remainingMs > 0

  useEffect(() => {
    const tick = () => {
      setRemainingMs(Math.max(0, deadline - Date.now()))
    }

    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [deadline])

  useEffect(() => {
    if (remainingMs === 0 && !hasSubmitted) {
      onSubmit(answers)
      setHasSubmitted(true)
    }
  }, [remainingMs, hasSubmitted, answers, onSubmit])

  const updateAnswer = (value) => {
    if (!currentQuestion) return
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }))
  }

  const handleSubmit = () => {
    if (hasSubmitted) return
    onSubmit(answers)
    setHasSubmitted(true)
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000)

  if (!currentQuestion) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex shrink-0 justify-center py-1">
        <CountdownClock
          remainingSeconds={remainingSeconds}
          remainingRatio={remainingRatio}
          timerColor={timerColor}
          isUrgent={isUrgent}
        />
      </div>

      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-purple-400">
            שאלה {currentIndex + 1} מתוך {questions.length}
          </p>
          <CardTitle className="text-lg text-white">{currentQuestion.label}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {currentQuestion.prompt ? (
            <p className="text-base leading-relaxed text-zinc-200">{currentQuestion.prompt}</p>
          ) : null}

          <Input
            ref={inputRef}
            type={currentQuestion.type === 'number' ? 'number' : 'text'}
            inputMode={currentQuestion.type === 'number' ? 'numeric' : 'text'}
            value={answers[currentQuestion.id] ?? ''}
            onChange={(event) => updateAnswer(event.target.value)}
            placeholder={currentQuestion.type === 'number' ? 'לדוגמה: 1985' : 'התשובה שלך'}
            disabled={hasSubmitted || remainingMs === 0}
            autoComplete="off"
            className={cn('text-base', currentQuestion.type === 'number' && 'text-right')}
            dir={currentQuestion.type === 'number' ? 'ltr' : undefined}
          />
        </CardContent>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentIndex((index) => index - 1)}
          disabled={isFirst || hasSubmitted || remainingMs === 0}
          className="h-auto border-white/15 bg-white/5 py-3 text-zinc-300 hover:bg-white/10"
        >
          <ChevronRight className="size-4" />
          חזרה
        </Button>

        {isLast ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={hasSubmitted || remainingMs === 0}
            className="h-auto bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-white hover:from-purple-500 hover:to-pink-500"
          >
            שליחה
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setCurrentIndex((index) => index + 1)}
            disabled={hasSubmitted || remainingMs === 0}
            className="h-auto bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-white hover:from-purple-500 hover:to-pink-500"
          >
            הבא
            <ChevronLeft className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
