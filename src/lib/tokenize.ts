import type { VocabWord } from '../types'

export interface Token {
  text: string
  word?: VocabWord
}

/**
 * Greedy longest-match tokenizer: walks the sentence left to right and, at
 * each position, picks the longest known vocab word that starts there.
 * Good enough for glossary-linking short lesson passages without a full
 * Chinese segmenter dependency.
 */
export function tokenizeHanzi(text: string, words: VocabWord[]): Token[] {
  const sorted = [...words].sort((a, b) => b.hanzi.length - a.hanzi.length)
  const tokens: Token[] = []
  let i = 0

  while (i < text.length) {
    const match = sorted.find((w) => text.startsWith(w.hanzi, i))
    if (match) {
      tokens.push({ text: match.hanzi, word: match })
      i += match.hanzi.length
    } else {
      const last = tokens[tokens.length - 1]
      if (last && !last.word) {
        last.text += text[i]
      } else {
        tokens.push({ text: text[i] })
      }
      i += 1
    }
  }

  return tokens
}
