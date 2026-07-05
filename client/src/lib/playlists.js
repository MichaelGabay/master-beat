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
 * @param {{ id: string }[]} playlists
 * @param {string} selectedId
 * @param {number} [limit]
 */
export function getPreviewPlaylists(playlists, selectedId, limit = 3) {
  if (playlists.length <= limit) return playlists

  const selected = playlists.find((item) => item.id === selectedId)
  if (!selected) return playlists.slice(0, limit)

  const others = playlists.filter((item) => item.id !== selectedId)
  return [selected, ...others].slice(0, limit)
}
