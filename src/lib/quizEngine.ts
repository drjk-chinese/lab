import type { FillBlankQuestion, QuizData, WordOrderQuestion } from '../types'

export type AnyQuizQuestion = FillBlankQuestion | WordOrderQuestion

export interface QuizSet {
  fillBlank: FillBlankQuestion[]
  wordOrder: WordOrderQuestion[]
}

export type QuizMode = 'random' | 'random_plus_selected'

const FILL_BLANK_COUNT = 8
const WORD_ORDER_COUNT = 4

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Picks `count` questions from `pool`, preferring ones whose source
 * sentence is in `bookmarked` (student-starred in the 낭독 tab) before
 * filling the rest randomly. Pass an empty `bookmarked` set for pure
 * random mode.
 */
function pickQuestions<T extends { source_sentence_id: string }>(
  pool: T[],
  count: number,
  bookmarked: Set<string>,
): T[] {
  const prioritized = pool.filter((q) => bookmarked.has(q.source_sentence_id))
  const rest = pool.filter((q) => !bookmarked.has(q.source_sentence_id))
  const chosenPrioritized = shuffle(prioritized).slice(0, count)
  const chosenRest = shuffle(rest).slice(0, Math.max(0, count - chosenPrioritized.length))
  return shuffle([...chosenPrioritized, ...chosenRest])
}

export function drawQuizSet(data: QuizData, mode: QuizMode, bookmarked: Set<string>): QuizSet {
  const effectiveBookmarks = mode === 'random_plus_selected' ? bookmarked : new Set<string>()
  return {
    fillBlank: pickQuestions(data.fill_blank, FILL_BLANK_COUNT, effectiveBookmarks),
    wordOrder: pickQuestions(data.word_order, WORD_ORDER_COUNT, effectiveBookmarks),
  }
}

export function gradeFillBlank(q: FillBlankQuestion, selected: (string | null)[]): boolean[] {
  return q.slots.map((slot, i) => selected[i] === slot.answer)
}

export function gradeWordOrder(q: WordOrderQuestion, arranged: string[]): boolean {
  return arranged.length === q.tokens.length && arranged.every((t, i) => t === q.tokens[i])
}

/**
 * Finds a different question to retry with instead of the exact one the
 * student got wrong — same topic (grammar card / vocab tag) when possible,
 * so the retry still drills the same point but isn't memorizable by
 * position. Falls back to any other question of the same type, then to
 * the original question itself if the pool is too small.
 */
export function findVariant<T extends AnyQuizQuestion>(
  wrong: T,
  pool: T[],
  excludeIds: Set<string>,
): T {
  const others = pool.filter((q) => q.question_id !== wrong.question_id && !excludeIds.has(q.question_id))
  const sameTopic = others.filter((q) => q.topics.some((t) => wrong.topics.includes(t)))
  const candidates = sameTopic.length > 0 ? sameTopic : others
  if (candidates.length === 0) return wrong
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function buildRetrySet(
  wrongFillBlank: FillBlankQuestion[],
  wrongWordOrder: WordOrderQuestion[],
  data: QuizData,
  askedIds: Set<string>,
): QuizSet {
  return {
    fillBlank: wrongFillBlank.map((q) => findVariant(q, data.fill_blank, askedIds)),
    wordOrder: wrongWordOrder.map((q) => findVariant(q, data.word_order, askedIds)),
  }
}

export { shuffle }
