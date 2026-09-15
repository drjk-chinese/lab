import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

// When env vars are not set (e.g. local preview before the professor's
// Supabase keys are wired up) the app falls back to local JSON data and
// no-ops on writes (see lib/dataSource.ts and lib/logging.ts) instead of
// crashing on a missing client.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
