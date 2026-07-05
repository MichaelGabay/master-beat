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
