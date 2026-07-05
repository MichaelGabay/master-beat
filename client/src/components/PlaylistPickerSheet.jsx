import { AnimatePresence, motion } from 'framer-motion'
import { Check, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * @param {{
 *   item: { id: string, name: string, imageUrl: string, isWithLyrics: boolean },
 *   isSelected: boolean,
 *   onSelect: () => void,
 * }} props
 */
export function PlaylistOption({ item, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-4 rounded-xl border p-3 text-start transition-all active:scale-[0.98]',
        isSelected
          ? 'border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 shadow-md shadow-purple-500/15'
          : 'border-white/15 bg-white/5 hover:bg-white/10',
      )}
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        className="size-16 shrink-0 rounded-lg object-cover shadow-lg shadow-purple-500/20"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-white">{item.name}</p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {item.isWithLyrics ? 'כולל שאלות מילים' : 'ללא שאלות מילים'}
        </p>
      </div>
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
          isSelected
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            : 'border border-white/20 bg-black/20',
        )}
        aria-hidden
      >
        {isSelected ? <Check className="size-3.5 stroke-[3]" /> : null}
      </span>
    </button>
  )
}

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   playlists: { id: string, name: string, imageUrl: string, isWithLyrics: boolean }[],
 *   selectedId: string,
 *   onSelect: (playlistId: string) => void,
 * }} props
 */
export function PlaylistPickerSheet({ open, onOpenChange, playlists, selectedId, onSelect }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

  const filteredPlaylists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return playlists

    return playlists.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
  }, [playlists, query])

  const handleSelect = (playlistId) => {
    onSelect(playlistId)
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="סגור"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-picker-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 flex max-h-[85svh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-gradient-to-b from-[#1a0f2e] to-[#0a0612] shadow-2xl shadow-purple-950/50"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="playlist-picker-title" className="text-lg font-semibold text-white">
                  בחר פלייליסט
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">{playlists.length} פלייליסטים זמינים</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="size-9 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="px-5 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="חפש פלייליסט..."
                  className="pr-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 pb-6">
              {filteredPlaylists.length > 0 ? (
                filteredPlaylists.map((item) => (
                  <PlaylistOption
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    onSelect={() => handleSelect(item.id)}
                  />
                ))
              ) : (
                <p className="py-8 text-center text-sm text-zinc-400">לא נמצאו פלייליסטים תואמים.</p>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
