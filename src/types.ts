export interface VocabExample {
  text: string
  pinyin: string
  meaning_kr: string
}

export interface VocabWord {
  word_id: string
  hanzi: string
  pinyin: string
  meaning_kr: string
  example: VocabExample
}

export interface VocabSection {
  section_id: string
  words: VocabWord[]
}

export interface VocabData {
  lesson_id: string
  sections: VocabSection[]
}

export type GrammarRole =
  | 'verb'
  | 'complement'
  | 'marker'
  | 'object'
  | 'subject'
  | 'rang'
  | 'object_person'
  | 'action'

export interface GrammarSegment {
  text: string
  role: GrammarRole
}

export interface GrammarExample {
  source: 'text' | 'extra'
  hanzi: string
  pinyin: string
  meaning_kr: string
  footnote_marker?: boolean
  segments?: GrammarSegment[]
  /** Short label for what this example demonstrates (e.g. "가벼운 시도"). */
  usage?: string
}

export interface GrammarCard {
  card_id: string
  title: string
  structure: string
  meaning: string
  footnote?: string
  examples: GrammarExample[]
}

export interface GrammarData {
  lesson_id: string
  grammar_cards: GrammarCard[]
  /** Unused by the app (role→color is hardcoded in GrammarTab); kept optional for older data files that still include it. */
  color_roles?: Record<GrammarRole, string>
}

export interface Sentence {
  sentence_id: string
  hanzi: string
  pinyin: string
  meaning_kr: string
  audio_url: string | null
  grammar_card_ids: string[]
  confirmed: boolean
  /**
   * Optional text override sent to the TTS engine instead of `hanzi` (e.g.
   * an extra space to stop the model from mis-segmenting/mispronouncing a
   * word). The displayed text (reading tab, glossary) always uses `hanzi`;
   * only audio generation uses this when present.
   */
  tts_text?: string
}

export interface SentenceSection {
  section_id: string
  complete: boolean
  sentences: Sentence[]
}

export interface SentencesData {
  lesson_id: string
  lesson_title: string
  note: string
  sections: SentenceSection[]
}

export type UserRole = 'student' | 'admin'

export interface AppUser {
  id: string
  studentId: string
  name: string | null
  role: UserRole
}

export type EventType =
  | 'login'
  | 'word_lookup'
  | 'word_check'
  | 'flashcard_view'
  | 'quiz_answer'
  | 'sentence_play'
  | 'record_attempt'
  | 'sentence_bookmark'

/** One blank inside a fill_blank question's sentence template. */
export interface FillBlankSlot {
  answer: string
  choices: string[]
}

export interface FillBlankQuestion {
  question_id: string
  type: 'fill_blank'
  /** Sentence with each blank written as {{0}}, {{1}}, ... matching `slots` order. */
  template: string
  meaning_kr: string
  slots: FillBlankSlot[]
  explanation: string
  /** sentence_id in sentences_<lesson>.json this question was derived from, used for "선택 문장 포함" mode. */
  source_sentence_id: string
  /** Grammar card ids / vocab tags this question drills, used to pick a same-topic variant on retry. */
  topics: string[]
}

export interface WordOrderQuestion {
  question_id: string
  type: 'word_order'
  /** Correct order of chunks; shuffled for display. */
  tokens: string[]
  meaning_kr: string
  explanation: string
  source_sentence_id: string
  topics: string[]
}

export type QuizQuestionData = FillBlankQuestion | WordOrderQuestion

export interface QuizData {
  lesson_id: string
  fill_blank: FillBlankQuestion[]
  word_order: WordOrderQuestion[]
}

export interface QuizResultRow {
  student_id: string
  lesson_id: string
  quiz_id: string
  question_id: string
  student_answer: string
  correct: boolean
  timestamp: string
}
