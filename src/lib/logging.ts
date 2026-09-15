import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { EventType } from '../types'

/**
 * Fire-and-forget research event log, per the spec's
 * student_id, lesson_id, event_type, target_id, timestamp schema
 * (see supabase/schema.sql -> event_logs). No-ops when Supabase isn't
 * configured so the app works fully offline during local preview.
 */
export function logEvent(
  studentId: string | null,
  lessonId: string,
  eventType: EventType,
  targetId: string | null = null,
) {
  if (!isSupabaseConfigured || !supabase || !studentId) return
  void supabase.from('event_logs').insert({
    student_id: studentId,
    lesson_id: lessonId,
    event_type: eventType,
    target_id: targetId,
    timestamp: new Date().toISOString(),
  })
}
