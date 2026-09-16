/** Browser Web Speech API TTS — used for flashcards and grammar examples. */

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null

/**
 * Voice list loads asynchronously on many mobile browsers (empty on first
 * call). Waits for it once, with a timeout fallback for browsers that never
 * fire `voiceschanged`.
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise
  voicesPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length > 0) {
      resolve(existing)
      return
    }
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500)
  })
  return voicesPromise
}

export async function speak(text: string, lang = 'zh-CN') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()
  const voices = await loadVoices()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  const match =
    voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.toLowerCase().startsWith('zh'))
  if (match) utter.voice = match

  // Android Chrome/WebView has a known bug where speak() called right after
  // cancel() in the same tick gets silently dropped; a short delay avoids it.
  setTimeout(() => window.speechSynthesis.speak(utter), 60)
}
