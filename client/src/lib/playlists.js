import { SERVER_URL } from '@/lib/config'

/**
 * @returns {Promise<{ id: string, name: string, isWithLyrics: boolean, imageUrl: string }[]>}
 */
export async function fetchPlaylists() {
  const response = await fetch(`${SERVER_URL}/api/playlists`)

  if (!response.ok) {
    throw new Error('Failed to fetch playlists')
  }

  return response.json()
}

/**
 * @param {{ id: string, name: string, isWithLyrics: boolean, imageUrl: string }[]} playlists
 * @param {string} id
 */
export function getPlaylistById(playlists, id) {
  return playlists.find((playlist) => playlist.id === id)
}

/**
 * Returns a stable preview list: the first N playlists in server order.
 * If the selected playlist is outside that window (chosen via the picker),
 * it replaces the last preview slot without reordering the rest.
 *
 * @param {{ id: string }[]} playlists
 * @param {string} selectedId
 * @param {number} [limit]
 */
export function getPreviewPlaylists(playlists, selectedId, limit = 3) {
  if (playlists.length <= limit) return playlists

  const preview = playlists.slice(0, limit)
  if (!selectedId) return preview

  const isSelectedInPreview = preview.some((item) => item.id === selectedId)
  if (isSelectedInPreview) return preview

  const selected = playlists.find((item) => item.id === selectedId)
  if (!selected) return preview

  return [...preview.slice(0, limit - 1), selected]
}
