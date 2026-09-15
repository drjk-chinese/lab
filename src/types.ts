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
  color_roles: Record<GrammarRole, string>
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

export interface QuizResultRow {
  student_id: string
  lesson_id: string
  quiz_id: string
  question_id: string
  student_answer: string
  correct: boolean
  timestamp: string
}
