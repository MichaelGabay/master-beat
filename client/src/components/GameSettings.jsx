import { Check, ListMusic, Music2, Play } from 'lucide-react'
import { useState } from 'react'

import { PlaylistOption, PlaylistPickerSheet } from '@/components/PlaylistPickerSheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { getPreviewPlaylists } from '@/lib/playlists'
import { cn } from '@/lib/utils'

const SONG_DURATIONS = [2, 5, 10, 30]

const ANSWER_TIME_OPTIONS = [
  { value: 30, label: '30 שנ׳' },
  { value: 60, label: 'דקה' },
  { value: 90, label: 'דקה וחצי' },
  { value: 120, label: 'שתי דקות' },
]

const QUESTION_OPTIONS = [
  { key: 'creatorName', label: 'שם יוצר/ת השיר' },
  { key: 'singerName', label: 'שם השיר' },
  { key: 'releaseYear', label: 'באיזו שנה הוא יצא' },
  { key: 'completeLyric', label: 'השלם את המשפט', requiresLyrics: true },
]

/**
 * @param {{
 *   playlists: { id: string, name: string, imageUrl: string, isWithLyrics: boolean }[],
 *   playlist: { id: string, name: string, imageUrl: string, isWithLyrics: boolean },
 *   settings: {
 *     playlistId: string,
 *     questions: { singerName: boolean, creatorName: boolean, releaseYear: boolean, completeLyric: boolean },
 *     songDuration: number,
 *     answerTimeLimit: number,
 *   },
 *   onSettingsChange: (settings: object) => void,
 *   onStartGame: () => void,
 *   isStarting?: boolean,
 * }} props
 */
export function GameSettings({
  playlists,
  playlist,
  settings,
  onSettingsChange,
  onStartGame,
  isStarting = false,
}) {
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const previewPlaylists = getPreviewPlaylists(playlists, playlist.id)
  const hasMorePlaylists = playlists.length > previewPlaylists.length

  const hasActiveQuestion = Object.entries(settings.questions).some(([key, enabled]) => {
    if (!enabled) return false
    const option = QUESTION_OPTIONS.find((item) => item.key === key)
    if (option?.requiresLyrics && !playlist.isWithLyrics) return false
    return true
  })

  const updateQuestion = (key, checked) => {
    onSettingsChange({
      ...settings,
      questions: { ...settings.questions, [key]: checked },
    })
  }

  const updateSongDuration = (duration) => {
    onSettingsChange({ ...settings, songDuration: duration })
  }

  const updateAnswerTimeLimit = (duration) => {
    onSettingsChange({ ...settings, answerTimeLimit: duration })
  }

  const selectPlaylist = (playlistId) => {
    onSettingsChange({ ...settings, playlistId })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music2 className="size-4 text-purple-400" />
            רשימת השמעה
          </CardTitle>
          <CardDescription>בחר את רשימת ההשמעה למשחק הזה.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {previewPlaylists.map((item) => (
              <PlaylistOption
                key={item.id}
                item={item}
                isSelected={item.id === playlist.id}
                onSelect={() => selectPlaylist(item.id)}
              />
            ))}
          </div>

          {hasMorePlaylists ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPlaylistPickerOpen(true)}
              className="h-11 rounded-xl border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              <ListMusic className="size-4" />
              בחר פלייליסט
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">סוגי שאלות</CardTitle>
          <CardDescription>הפעל לפחות סוג שאלה אחד כדי להתחיל.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {QUESTION_OPTIONS.map(({ key, label, requiresLyrics }) => {
            if (requiresLyrics && !playlist.isWithLyrics) return null

            const isActive = settings.questions[key]

            return (
              <button
                key={key}
                type="button"
                onClick={() => updateQuestion(key, !isActive)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-start transition-all active:scale-[0.98]',
                  isActive
                    ? 'border-purple-500/40 bg-gradient-to-r from-purple-600/25 to-pink-600/20 text-white shadow-md shadow-purple-500/15'
                    : 'border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10',
                )}
              >
                <span className="text-sm font-medium leading-snug">{label}</span>
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'border border-white/20 bg-black/20',
                  )}
                  aria-hidden
                >
                  {isActive ? <Check className="size-3.5 stroke-[3]" /> : null}
                </span>
              </button>
            )
          })}
          {!hasActiveQuestion && (
            <p className="text-xs text-amber-400/90">יש להפעיל לפחות סוג שאלה אחד כדי להתחיל את המשחק.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">טיימרים</CardTitle>
          <CardDescription>כמה זמן השירים יושמעו וכמה זמן יש לשחקנים לענות.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-zinc-200">משך השיר</Label>
            <div className="grid grid-cols-4 gap-2">
              {SONG_DURATIONS.map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant={settings.songDuration === duration ? 'default' : 'outline'}
                  onClick={() => updateSongDuration(duration)}
                  className={cn(
                    'h-11 rounded-xl text-sm font-semibold',
                    settings.songDuration === duration
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                      : 'border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10',
                  )}
                >
                  {duration} שנ׳
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-200">זמן לענות</Label>
            <div className="grid grid-cols-2 gap-2">
              {ANSWER_TIME_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={settings.answerTimeLimit === value ? 'default' : 'outline'}
                  onClick={() => updateAnswerTimeLimit(value)}
                  className={cn(
                    'h-11 rounded-xl text-sm font-semibold',
                    settings.answerTimeLimit === value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                      : 'border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10',
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        size="lg"
        disabled={!hasActiveQuestion || isStarting}
        onClick={onStartGame}
        className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40"
      >
        <Play className="size-5" />
        {isStarting ? 'מתחיל...' : 'התחל משחק'}
      </Button>

      <PlaylistPickerSheet
        open={isPlaylistPickerOpen}
        onOpenChange={setIsPlaylistPickerOpen}
        playlists={playlists}
        selectedId={playlist.id}
        onSelect={selectPlaylist}
      />
    </div>
  )
}
