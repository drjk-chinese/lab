import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

const looksLikeUrl = !!rawUrl && /^https?:\/\/.+\.supabase\.co\/?$/.test(rawUrl)

/**
 * Set when VITE_SUPABASE_URL is present but not a valid Supabase project
 * URL — most often because the URL and anon-key environment variables got
 * swapped, or the value was copied with stray quotes/whitespace. Shown on
 * the login page so a misconfigured deploy doesn't just fail with a
 * cryptic browser fetch error.
 */
export const supabaseConfigError: string | null =
  rawUrl && !looksLikeUrl
    ? `VITE_SUPABASE_URL 값이 올바른 형식이 아닙니다: "${rawUrl}". https://xxxxx.supabase.co 형태여야 합니다. (Vercel 환경변수에서 URL과 anon key를 서로 바꿔 넣지 않았는지 확인해 주세요.)`
    : null

export const isSupabaseConfigured = Boolean(looksLikeUrl && rawAnonKey)

if (supabaseConfigError) {
  console.error(supabaseConfigError)
}

// When env vars are not set (e.g. local preview before the professor's
// Supabase keys are wired up) the app falls back to local JSON data and
// no-ops on writes (see lib/dataSource.ts and lib/logging.ts) instead of
// crashing on a missing client.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl as string, rawAnonKey as string)
  : null
