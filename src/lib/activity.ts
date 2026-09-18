import { supabase, isSupabaseConfigured } from './supabaseClient'

/**
 * Distinct sentence_ids this student has ever triggered a recording
 * attempt for, across all sessions (not just this one) — backs the 낭독
 * 탭 recording-progress indicator. Recordings themselves aren't stored
 * (see spec: session-only playback), but the record_attempt event is, so
 * this is the best available signal of "have they tried this sentence".
 */
export async function getRecordedSentenceIds(studentId: string, lessonId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured || !supabase) return new Set()
  const { data, error } = await supabase
    .from('event_logs')
    .select('target_id')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .eq('event_type', 'record_attempt')
  if (error || !data) return new Set()
  return new Set(data.map((r) => r.target_id as string | null).filter((id): id is string => !!id))
}
