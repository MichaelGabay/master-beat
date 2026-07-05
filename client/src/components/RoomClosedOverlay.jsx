import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * @param {{ message: string | null, onDismiss: () => void }} props
 */
export function RoomClosedOverlay({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <Card className="w-full max-w-sm border-red-500/30 bg-[#1a0f2e] shadow-xl shadow-red-500/10">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle className="size-7 text-red-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white">המשחק הסתיים</h2>
            <p className="text-sm text-zinc-400">{message}</p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={onDismiss}
            className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white hover:from-purple-500 hover:to-pink-500"
          >
            חזרה לדף הבית
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
