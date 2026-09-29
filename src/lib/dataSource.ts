import { supabase, isSupabaseConfigured } from './supabaseClient'
import vocabL01 from '../data/vocab_L01.json'
import grammarL01 from '../data/grammar_L01.json'
import sentencesL01 from '../data/sentences_L01.json'
import vocabL03 from '../data/vocab_L03.json'
import grammarL03 from '../data/grammar_L03.json'
import sentencesL03 from '../data/sentences_L03.json'
import { DEFAULT_LESSON_ID } from '../data/lessons'
import type { VocabData, GrammarData, SentencesData } from '../types'

// Content lives in Supabase tables (see supabase/schema.sql) once a project
// is connected, seeded from the JSON files in src/data. That lets the admin
// panel's inline editor persist changes without a redeploy. Until env vars
// are set (or for a lesson that hasn't been seeded yet), everything falls
// back to these bundled JSON files, keyed by lesson_id.

const VOCAB_LOCAL: Record<string, VocabData> = {
  L01: vocabL01 as VocabData,
  L03: vocabL03 as VocabData,
}
const GRAMMAR_LOCAL: Record<string, GrammarData> = {
  L01: grammarL01 as GrammarData,
  L03: grammarL03 as GrammarData,
}
const SENTENCES_LOCAL: Record<string, SentencesData> = {
  L01: sentencesL01 as SentencesData,
  L03: sentencesL03 as SentencesData,
}

export async function getVocab(lessonId = DEFAULT_LESSON_ID): Promise<VocabData> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('payload')
      .eq('lesson_id', lessonId)
      .eq('kind', 'vocab')
      .maybeSingle()
    if (!error && data?.payload) return data.payload as VocabData
  }
  return VOCAB_LOCAL[lessonId]
}

export async function getGrammar(lessonId = DEFAULT_LESSON_ID): Promise<GrammarData> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('payload')
      .eq('lesson_id', lessonId)
      .eq('kind', 'grammar')
      .maybeSingle()
    if (!error && data?.payload) return data.payload as GrammarData
  }
  return GRAMMAR_LOCAL[lessonId]
}

export async function getSentences(lessonId = DEFAULT_LESSON_ID): Promise<SentencesData> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('payload')
      .eq('lesson_id', lessonId)
      .eq('kind', 'sentences')
      .maybeSingle()
    if (!error && data?.payload) return data.payload as SentencesData
  }
  return SENTENCES_LOCAL[lessonId]
}

/**
 * Admin inline-edit save. Writes the whole content payload back to
 * Supabase. No-ops (returns false) when Supabase isn't configured; the
 * admin UI falls back to editing in-memory/localStorage in that case so
 * the professor can still preview the editing flow.
 */
export async function saveContent(
  lessonId: string,
  kind: 'vocab' | 'grammar' | 'sentences',
  payload: VocabData | GrammarData | SentencesData,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  const { error } = await supabase
    .from('lesson_content')
    .upsert({ lesson_id: lessonId, kind, payload }, { onConflict: 'lesson_id,kind' })
  return !error
}
