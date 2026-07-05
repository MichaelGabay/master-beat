import { SERVER_URL } from './config.js'

/**
 * @param {string} previewUrl
 */
export function getPlaybackUrl(previewUrl) {
  return `${SERVER_URL}/api/audio-proxy?url=${encodeURIComponent(previewUrl)}`
}

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

/** @type {HTMLAudioElement | null} */
let sharedAudio = null

function getSharedAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    configureMobileAudio(sharedAudio)
  }
  return sharedAudio
}

/**
 * Call from a user gesture (e.g. Start Game click) so later playback is allowed.
 */
export function unlockAudioPlayback() {
  const audio = getSharedAudio()
  audio.src = SILENT_WAV
  audio.volume = 0.01

  return audio.play().finally(() => {
    audio.pause()
    audio.src = ''
    audio.volume = 1
  })
}

/**
 * @param {HTMLAudioElement} audio
 */
export function configureMobileAudio(audio) {
  audio.volume = 1
  audio.preload = 'auto'
  audio.setAttribute('playsinline', '')
  audio.setAttribute('webkit-playsinline', '')
  return audio
}

/**
 * @param {HTMLAudioElement} audio
 */
export function waitForAudioReady(audio, timeoutMs = 10000) {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        resolve()
        return
      }
      reject(new Error('Audio load timed out'))
    }, timeoutMs)

    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Failed to load audio'))
    }
    const cleanup = () => {
      clearTimeout(timeout)
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('error', onError)
    }

    audio.addEventListener('canplaythrough', onReady)
    audio.addEventListener('canplay', onReady)
    audio.addEventListener('error', onError)
    audio.load()
  })
}

/**
 * @param {HTMLAudioElement} audio
 */
export async function playAudioElement(audio) {
  await waitForAudioReady(audio)
  await audio.play()
}

/**
 * @param {string} previewUrl
 * @returns {Promise<HTMLAudioElement>}
 */
export async function createAndPlayPreview(previewUrl) {
  const sources = [getPlaybackUrl(previewUrl), previewUrl]
  let lastError = new Error('Failed to play audio')

  for (const source of sources) {
    const audio = configureMobileAudio(new Audio(source))

    try {
      await playAudioElement(audio)
      return audio
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to play audio')
      audio.pause()
      audio.src = ''
    }
  }

  throw lastError
}
