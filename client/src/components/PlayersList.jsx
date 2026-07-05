import { Crown, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * @param {{ players: Array<{ id: string, name: string, isHost: boolean }> }} props
 */
export function PlayersList({ players }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-purple-400" />
          שחקנים ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-zinc-500">אין שחקנים עדיין.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2.5"
              >
                <span className="font-medium text-white">{player.name}</span>
                {player.isHost && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                    <Crown className="size-3.5" />
                    מארח
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
