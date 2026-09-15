/** Browser Web Speech API TTS — used for flashcards only, per spec. */
export function speak(text: string, lang = 'zh-CN') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  window.speechSynthesis.speak(utter)
}
