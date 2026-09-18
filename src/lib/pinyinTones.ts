/**
 * Generates "same syllable, different tone" pinyin variants — e.g. wèidao →
 * wéidao / wěidao / wēidao — for building confusable multiple-choice quiz
 * distractors that actually test tone discrimination.
 */

const TONE_GROUPS: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

// character -> [vowel base, tone index (0 = neutral, 1-4 = tone marks)]
const CHAR_TO_TONE = new Map<string, [string, number]>()
for (const [base, variants] of Object.entries(TONE_GROUPS)) {
  variants.forEach((ch, idx) => CHAR_TO_TONE.set(ch, [base, idx]))
}

/**
 * Returns up to `count` alternate spellings of `pinyin` with a different
 * tone applied to one vowel, or [] if no vowel could be identified (e.g.
 * empty string). Prefers varying an already-toned vowel; falls back to
 * adding a tone to a plain (neutral) vowel when the word has none.
 */
export function toneVariants(pinyin: string, count = 3): string[] {
  let pos = -1
  let base = ''
  let toneIdx = 0

  for (let i = 0; i < pinyin.length; i++) {
    const entry = CHAR_TO_TONE.get(pinyin[i])
    if (entry && entry[1] !== 0) {
      pos = i
      base = entry[0]
      toneIdx = entry[1]
      break
    }
  }

  if (pos === -1) {
    for (let i = 0; i < pinyin.length; i++) {
      const entry = CHAR_TO_TONE.get(pinyin[i])
      if (entry) {
        pos = i
        base = entry[0]
        toneIdx = 0
        break
      }
    }
  }

  if (pos === -1) return []

  const otherTones = [1, 2, 3, 4].filter((t) => t !== toneIdx)
  for (let i = otherTones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[otherTones[i], otherTones[j]] = [otherTones[j], otherTones[i]]
  }

  return otherTones.slice(0, count).map((t) => pinyin.slice(0, pos) + TONE_GROUPS[base][t] + pinyin.slice(pos + 1))
}
