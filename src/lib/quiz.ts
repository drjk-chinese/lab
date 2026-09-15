import type { VocabWord } from '../types'

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

/** Builds a 4-choice question for one word, pulling distractors from the full word pool. */
function buildQuestion(word: VocabWord, type: QuizQuestionType, pool: VocabWord[]): QuizQuestion {
  const correct = type === 'meaning' ? word.meaning_kr : word.pinyin
  const distractorPool = pool.filter((w) => w.word_id !== word.word_id)
  const distractors = shuffle(distractorPool)
    .slice(0, 3)
    .map((w) => (type === 'meaning' ? w.meaning_kr : w.pinyin))

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
