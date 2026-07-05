import mongoose from 'mongoose'

const playlistSchema = new mongoose.Schema(
  {
    name: String,
    isWithLyrics: Boolean,
    imageUrl: String,
    songs: [mongoose.Schema.Types.Mixed],
  },
  { collection: 'playlists' },
)

const Playlist = mongoose.models.Playlist ?? mongoose.model('Playlist', playlistSchema)

/**
 * @param {import('mongoose').Document & { _id: import('mongoose').Types.ObjectId, name: string, isWithLyrics: boolean, imageUrl: string }} doc
 */
function toPlaylistSummary(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    isWithLyrics: doc.isWithLyrics,
    imageUrl: doc.imageUrl,
  }
}

/**
 * @param {import('mongoose').Document & { _id: import('mongoose').Types.ObjectId, name: string, isWithLyrics: boolean, imageUrl: string, songs: import('./game.js').Song[] }} doc
 */
function toFullPlaylist(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    isWithLyrics: doc.isWithLyrics,
    imageUrl: doc.imageUrl,
    songs: doc.songs ?? [],
  }
}

/**
 * @returns {Promise<{ id: string, name: string, isWithLyrics: boolean, imageUrl: string }[]>}
 */
export async function listPlaylists() {
  const docs = await Playlist.find({}, { name: 1, isWithLyrics: 1, imageUrl: 1 }).lean()
  return docs.map((doc) => toPlaylistSummary(doc))
}

/**
 * @param {string} id
 * @returns {Promise<{ id: string, name: string, isWithLyrics: boolean, imageUrl: string, songs: import('./game.js').Song[] } | null>}
 */
export async function getPlaylistById(id) {
  if (!mongoose.isValidObjectId(id)) return null

  const doc = await Playlist.findById(id).lean()
  if (!doc) return null

  return toFullPlaylist(doc)
}
