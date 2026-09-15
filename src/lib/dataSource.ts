import { supabase, isSupabaseConfigured } from './supabaseClient'
import vocabLocal from '../data/vocab_L01.json'
import grammarLocal from '../data/grammar_L01.json'
import sentencesLocal from '../data/sentences_L01.json'
import type { VocabData, GrammarData, SentencesData } from '../types'

// Content lives in Supabase tables (see supabase/schema.sql) once a project
// is connected, seeded from the JSON files in src/data. That lets the admin
// panel's inline editor persist changes without a redeploy. Until env vars
// are set, everything reads from the bundled JSON so the app is fully
// usable for local preview / demoing to the professor.

export async function getVocab(lessonId = 'L01'): Promise<VocabData> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('payload')
      .eq('lesson_id', lessonId)
      .eq('kind', 'vocab')
      .maybeSingle()
    if (!error && data?.payload) return data.payload as VocabData
  }
  return vocabLocal as VocabData
}

export async function getGrammar(lessonId = 'L01'): Promise<GrammarData> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('payload')
      .eq('lesson_id', lessonId)
      .eq('kind', 'grammar')
      .maybeSingle()
    if (!error && data?.payload) return data.payload as GrammarData
  }
  return grammarLocal as GrammarData
}

export async function getSentences(lessonId = 'L01'): Promise<SentencesData> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('payload')
      .eq('lesson_id', lessonId)
      .eq('kind', 'sentences')
      .maybeSingle()
    if (!error && data?.payload) return data.payload as SentencesData
  }
  return sentencesLocal as SentencesData
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
