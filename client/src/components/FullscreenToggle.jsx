import { Maximize, Minimize } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleFullscreen}
      className="fixed bottom-4 left-4 z-50 size-10 rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
      aria-label={isFullscreen ? 'צא ממסך מלא' : 'כנס למסך מלא'}
    >
      {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
    </Button>
  )
}
