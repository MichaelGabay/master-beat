import { Loader2, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

/**
 * @param {{ isHost?: boolean }} props
 */
export function WaitingForOthers({ isHost = false }) {
  return (
    <Card className="border-purple-500/30 bg-purple-500/10">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <Loader2 className="size-10 animate-spin text-purple-400" />
        <div>
          <p className="text-xl font-semibold text-white">ממתין לאחרים...</p>
          <p className="mt-2 text-sm text-zinc-400">
            התשובות שלך נשלחו. המתן בזמן ששאר השחקנים מסיימים.
          </p>
        </div>
        {isHost && <Users className="size-6 text-pink-400/80" />}
      </CardContent>
    </Card>
  )
}
