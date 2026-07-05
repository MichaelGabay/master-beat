const STORAGE_KEY = 'masterBeatSession'

/**
 * @typedef {{
 *   role: 'host' | 'player',
 *   roomCode: string,
 *   playerName: string,
 *   gameStarted: boolean,
 * }} GameSession
 */

/**
 * @param {GameSession} session
 */
export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore quota / private mode errors
  }
}

/**
 * @returns {GameSession | null}
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
