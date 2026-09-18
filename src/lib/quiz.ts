import type { VocabWord } from '../types'
import { toneVariants } from './pinyinTones'

export type QuizQuestionType = 'meaning' | 'pinyin'

export interface QuizQuestion {
  word: VocabWord
  type: QuizQuestionType
  choices: string[]
  correctIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Builds a 4-choice question for one word. Meaning questions pull
 * distractors from the full word pool as before. Pinyin questions prefer
 * "same syllable, different tone" distractors (e.g. wèidao vs wéidao) so
 * the quiz actually drills tone discrimination instead of just word
 * recognition; it only falls back to random pool pinyin when a word
 * doesn't yield enough tone variants (e.g. very short/neutral syllables).
 */
function buildQuestion(word: VocabWord, type: QuizQuestionType, pool: VocabWord[]): QuizQuestion {
  const correct = type === 'meaning' ? word.meaning_kr : word.pinyin
  const distractorPool = pool.filter((w) => w.word_id !== word.word_id)

  let distractors: string[]
  if (type === 'pinyin') {
    const toneBased = toneVariants(word.pinyin, 3).filter((v) => v !== correct)
    const missing = 3 - toneBased.length
    const poolFallback =
      missing > 0
        ? shuffle(distractorPool)
            .map((w) => w.pinyin)
            .filter((p) => p !== correct && !toneBased.includes(p))
            .slice(0, missing)
        : []
    distractors = [...toneBased, ...poolFallback]
  } else {
    distractors = shuffle(distractorPool)
      .slice(0, 3)
      .map((w) => w.meaning_kr)
  }

  const choices = shuffle([correct, ...distractors])
  return { word, type, choices, correctIndex: choices.indexOf(correct) }
}

/** Generates 뜻 + 병음 questions (both 4-choice) for every given word, per spec. */
export function buildQuizQuestions(words: VocabWord[], pool: VocabWord[]): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  for (const word of words) {
    questions.push(buildQuestion(word, 'meaning', pool))
    questions.push(buildQuestion(word, 'pinyin', pool))
  }
  return shuffle(questions)
}
