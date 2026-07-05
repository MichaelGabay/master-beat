import { useCallback, useEffect, useRef, useState } from 'react'

import { AudioPlaying } from '@/components/AudioPlaying'
import { Leaderboard } from '@/components/Leaderboard'
import { ListeningPhase } from '@/components/ListeningPhase'
import { PhaseTransition } from '@/components/PhaseTransition'
import { QuestionPhase } from '@/components/QuestionPhase'
import { RoundResults } from '@/components/RoundResults'
import { WaitingForOthers } from '@/components/WaitingForOthers'
import { useSocketReconnect } from '@/hooks/useSocketReconnect'
import { createAndPlayPreview } from '@/lib/audio'
import { clearSession } from '@/lib/session'
import { getSocket } from '@/lib/socket'

/**
 * @typedef {'audio' | 'questions' | 'submitted' | 'waiting' | 'roundResults' | 'ended'} ClientPhase
 */

/**
 * @typedef {'idle' | 'playing' | 'finished'} PlaybackStatus
 */

/**
 * @typedef {{
 *   previewUrl: string,
 *   songDuration: number,
 *   trackId: number,
 *   roundNumber: number,
 * }} PlayAudioPayload
 */

/**
 * @typedef {{
 *   id: string,
 *   type: 'text' | 'number',
 *   label: string,
 *   prompt: string,
 * }} Question
 */

/**
 * @typedef {{
 *   roundNumber: number,
 *   answerTimeLimit: number,
 *   deadline: number,
 *   questions: Question[],
 * }} ShowQuestionsPayload
 */

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

/**
 * @typedef {{
 *   roundNumber: number,
 *   questions: QuestionSummary[],
 *   results: Record<string, PlayerRoundResult>,
 *   standings?: RoundStanding[],
 *   songsRemaining: number,
 * }} RoundResultsPayload
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   isHost: boolean,
 *   score: number,
 *   rank: number,
 * }} RankingEntry
 */

/**
 * @param {{
 *   isHost?: boolean,
 *   playerName?: string,
 *   initialRoundAudio?: PlayAudioPayload | null,
 *   initialSession?: {
 *     phase?: ClientPhase,
 *     score?: number,
 *     roundNumber?: number,
 *     questionsPayload?: ShowQuestionsPayload,
 *     roundResultsPayload?: RoundResultsPayload,
 *     rankings?: RankingEntry[],
 *   } | null,
 * }} props
 */
export function GameActive({
  isHost = false,
  playerName = '',
  initialRoundAudio = null,
  initialSession = null,
}) {
  const [phase, setPhase] = useState(
    /** @type {ClientPhase} */ (initialSession?.phase ?? 'audio'),
  )
  const [roundNumber, setRoundNumber] = useState(
    initialSession?.roundNumber ?? initialRoundAudio?.roundNumber ?? 1,
  )
  const [score, setScore] = useState(initialSession?.score ?? 0)
  const [playAudioPayload, setPlayAudioPayload] = useState(
    /** @type {PlayAudioPayload | null} */ (initialRoundAudio),
  )
  const [questionsPayload, setQuestionsPayload] = useState(
    /** @type {ShowQuestionsPayload | null} */ (initialSession?.questionsPayload ?? null),
  )
  const [roundResultsPayload, setRoundResultsPayload] = useState(
    /** @type {RoundResultsPayload | null} */ (initialSession?.roundResultsPayload ?? null),
  )
  const [rankings, setRankings] = useState(
    /** @type {RankingEntry[] | null} */ (initialSession?.rankings ?? null),
  )
  const [playbackStatus, setPlaybackStatus] = useState(/** @type {PlaybackStatus} */ ('idle'))
  const [playerAudioState, setPlayerAudioState] = useState(/** @type {'idle' | 'playing'} */ ('idle'))
  const [playbackError, setPlaybackError] = useState(/** @type {string | null} */ (null))
  const [isStartingQuestions, setIsStartingQuestions] = useState(false)
  const [isSkippingSong, setIsSkippingSong] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null))
  const audioTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
  const socketIdRef = useRef(/** @type {string | null} */ (null))

  const applyRestoredSession = useCallback((session) => {
    if (!session) return

    if (session.phase) {
      setPhase(session.phase)
    }
    if (session.roundNumber != null) {
      setRoundNumber(session.roundNumber)
    }
    if (session.score != null) {
      setScore(session.score)
    }
    if (session.questionsPayload) {
      setQuestionsPayload(session.questionsPayload)
    }
    if (session.roundResultsPayload) {
      setRoundResultsPayload(session.roundResultsPayload)
    }
    if (session.rankings) {
      setRankings(session.rankings)
    }
  }, [])

  useSocketReconnect(
    useCallback(
      (response) => {
        const socket = getSocket()
        socketIdRef.current = socket.id ?? null

        if (response.session) {
          applyRestoredSession(response.session)
        }
      },
      [applyRestoredSession],
    ),
  )

  const clearPlaybackTimer = useCallback(() => {
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current)
      audioTimerRef.current = null
    }
  }, [])

  const stopAudio = useCallback(() => {
    clearPlaybackTimer()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [clearPlaybackTimer])

  const handleSubmitAnswers = useCallback((answers) => {
    const socket = getSocket()
    socket.emit('submitAnswers', { answers }, (response) => {
      if (response?.ok) {
        setPhase('submitted')
      }
    })
  }, [])

  const handlePlay = useCallback(async () => {
    if (!isHost || playbackStatus === 'playing') return

    if (!playAudioPayload) {
      setPlaybackError('השיר עדיין לא נטען. המתן רגע ונסה שוב.')
      return
    }

    stopAudio()
    setPlaybackError(null)
    setPlaybackStatus('playing')

    const socket = getSocket()
    socket.emit('hostPlaybackStarted', {}, () => {})

    try {
      const audio = await createAndPlayPreview(playAudioPayload.previewUrl)
      audioRef.current = audio

      clearPlaybackTimer()
      audioTimerRef.current = setTimeout(() => {
        stopAudio()
        setPlaybackStatus('finished')
        socket.emit('hostPlaybackEnded', {}, () => {})
      }, playAudioPayload.songDuration * 1000)
    } catch {
      setPlaybackStatus('idle')
      setPlaybackError('לא ניתן לנגן את השיר. נסה שוב, התחל שאלות, או דלג לשיר הבא.')
      socket.emit('hostPlaybackEnded', {}, () => {})
    }
  }, [isHost, playAudioPayload, playbackStatus, stopAudio, clearPlaybackTimer])

  const handleStartQuestions = useCallback(() => {
    if (!isHost || isStartingQuestions) return

    setIsStartingQuestions(true)
    const socket = getSocket()

    socket.emit('startQuestions', {}, (response) => {
      setIsStartingQuestions(false)

      if (!response?.ok) {
        setPlaybackError(response?.error ?? 'התחלת השאלות נכשלה')
      }
    })
  }, [isHost, isStartingQuestions])

  const handleSkipSong = useCallback(() => {
    if (!isHost || isSkippingSong) return

    setIsSkippingSong(true)
    const socket = getSocket()

    socket.emit('skipSong', {}, (response) => {
      setIsSkippingSong(false)

      if (!response?.ok) {
        setPlaybackError(response?.error ?? 'דילוג על השיר נכשל')
        return
      }

      if (response.gameEnded) {
        return
      }

      if (response.roundAudio) {
        setPlayAudioPayload(response.roundAudio)
        setRoundNumber(response.roundAudio.roundNumber)
      }

      setPhase('audio')
      setPlaybackStatus('idle')
      setPlaybackError(null)
      stopAudio()
    })
  }, [isHost, isSkippingSong, stopAudio])

  const handleNextSong = useCallback(() => {
    if (!isHost || isAdvancing) return

    setIsAdvancing(true)
    const socket = getSocket()

    socket.emit('nextRound', {}, (response) => {
      setIsAdvancing(false)

      if (!response?.ok) {
        setPlaybackError(response?.error ?? 'התחלת הסיבוב הבא נכשלה')
        return
      }

      if (response.gameEnded) {
        return
      }

      if (response.roundAudio) {
        setPlayAudioPayload(response.roundAudio)
        setRoundNumber(response.roundAudio.roundNumber)
      }

      setRoundResultsPayload(null)
      setPhase('audio')
      setPlaybackStatus('idle')
      setPlaybackError(null)
    })
  }, [isHost, isAdvancing])

  const handleEndGame = useCallback(() => {
    if (!isHost || isAdvancing) return

    setIsAdvancing(true)
    const socket = getSocket()

    socket.emit('endGame', {}, (response) => {
      setIsAdvancing(false)

      if (!response?.ok) {
        setPlaybackError(response?.error ?? 'סיום המשחק נכשל')
      }
    })
  }, [isHost, isAdvancing])

  useEffect(() => {
    const socket = getSocket()
    socketIdRef.current = socket.id ?? null

    const handleConnect = () => {
      socketIdRef.current = socket.id ?? null
    }

    socket.on('connect', handleConnect)
    return () => {
      socket.off('connect', handleConnect)
    }
  }, [])

  useEffect(() => {
    if (!isHost || playAudioPayload) return

    const socket = getSocket()
    socket.emit('requestRoundAudio', {}, (response) => {
      if (response?.ok && response.roundAudio) {
        setPlayAudioPayload(response.roundAudio)
        setRoundNumber(response.roundAudio.roundNumber)
      }
    })
  }, [isHost, playAudioPayload])

  useEffect(() => {
    const socket = getSocket()

    const handleRoundStarted = ({ roundNumber: nextRound }) => {
      setRoundNumber(nextRound)
      setPhase('audio')
      setQuestionsPayload(null)
      setRoundResultsPayload(null)
      setPlaybackStatus('idle')
      setPlayerAudioState('idle')
      setPlaybackError(null)
      setIsStartingQuestions(false)
      stopAudio()
    }

    const handlePlayAudio = (payload) => {
      if (!isHost) return
      setPlayAudioPayload(payload)
      setRoundNumber(payload.roundNumber)
      setPhase('audio')
      setPlaybackStatus('idle')
      setPlaybackError(null)
    }

    const handleAudioStateChanged = ({ state }) => {
      if (isHost) return
      setPlayerAudioState(state === 'playing' ? 'playing' : 'idle')
    }

    const handleShowQuestions = (payload) => {
      setQuestionsPayload(payload)
      setRoundNumber(payload.roundNumber)
      setPhase('questions')
      setPlaybackStatus('idle')
      setPlayerAudioState('idle')
      stopAudio()
    }

    const handleRoundResults = (payload) => {
      setRoundResultsPayload(payload)
      setPhase('roundResults')

      const playerId = socketIdRef.current ?? socket.id
      const playerResult = playerId ? payload.results?.[playerId] : null
      if (playerResult) {
        setScore(playerResult.totalScore)
      }
    }

    const handleEndGame = ({ rankings: finalRankings }) => {
      setRankings(finalRankings)
      setPhase('ended')
      stopAudio()
      clearSession()
    }

    socket.on('roundStarted', handleRoundStarted)
    socket.on('playAudio', handlePlayAudio)
    socket.on('audioStateChanged', handleAudioStateChanged)
    socket.on('showQuestions', handleShowQuestions)
    socket.on('roundResults', handleRoundResults)
    socket.on('endGame', handleEndGame)

    return () => {
      socket.off('roundStarted', handleRoundStarted)
      socket.off('playAudio', handlePlayAudio)
      socket.off('audioStateChanged', handleAudioStateChanged)
      socket.off('showQuestions', handleShowQuestions)
      socket.off('roundResults', handleRoundResults)
      socket.off('endGame', handleEndGame)
    }
  }, [isHost, stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  const playerId = socketIdRef.current ?? getSocket().id ?? null
  const playerResult =
    roundResultsPayload && playerId ? roundResultsPayload.results[playerId] ?? null : null

  if (phase === 'ended' && rankings) {
    return (
      <PhaseTransition phaseKey="ended" className="flex flex-1 flex-col gap-6">
        <Leaderboard rankings={rankings} />
      </PhaseTransition>
    )
  }

  const phaseContent = (() => {
    if (phase === 'audio' && isHost) {
      return (
        <AudioPlaying
          roundNumber={roundNumber}
          songDuration={playAudioPayload?.songDuration}
          playbackStatus={playbackStatus}
          playbackError={playbackError}
          isSongReady={Boolean(playAudioPayload)}
          onPlay={handlePlay}
          onStartQuestions={handleStartQuestions}
          onSkipSong={handleSkipSong}
          isStartingQuestions={isStartingQuestions}
          isSkippingSong={isSkippingSong}
        />
      )
    }

    if (phase === 'audio' && !isHost) {
      return <ListeningPhase roundNumber={roundNumber} audioState={playerAudioState} />
    }

    if (phase === 'questions' && questionsPayload) {
      return (
        <QuestionPhase
          key={questionsPayload.roundNumber}
          questions={questionsPayload.questions}
          deadline={questionsPayload.deadline}
          answerTimeLimit={questionsPayload.answerTimeLimit}
          onSubmit={handleSubmitAnswers}
        />
      )
    }

    if (phase === 'submitted' || phase === 'waiting') {
      return <WaitingForOthers isHost={isHost} />
    }

    if (phase === 'roundResults' && roundResultsPayload) {
      return (
        <RoundResults
          roundNumber={roundResultsPayload.roundNumber}
          questions={roundResultsPayload.questions}
          playerResult={playerResult}
          standings={roundResultsPayload.standings ?? []}
          currentPlayerId={playerId}
          isHost={isHost}
          songsRemaining={roundResultsPayload.songsRemaining}
          onNextSong={handleNextSong}
          onEndGame={handleEndGame}
          isAdvancing={isAdvancing}
        />
      )
    }

    return null
  })()

  return (
    <div className="flex flex-1 flex-col gap-6">
      {playerName && (
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            {playerName}
          </h1>
        </div>
      )}

      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">ציון כולל</p>
        <p className="mt-0.5 text-2xl font-bold text-white">{score}</p>
      </div>

      <div
        className={`flex flex-1 flex-col gap-4 ${phase === 'questions' ? 'min-h-0 justify-start' : 'justify-center'}`}
      >
        <PhaseTransition phaseKey={phase} className="flex flex-col gap-4">
          {phaseContent}
        </PhaseTransition>

        {playbackError && phase !== 'audio' && (
          <p className="text-center text-sm text-red-400">{playbackError}</p>
        )}
      </div>
    </div>
  )
}
