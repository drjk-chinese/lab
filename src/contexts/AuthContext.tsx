import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { logEvent } from '../lib/logging'
import type { AppUser, UserRole } from '../types'

const DEMO_STORAGE_KEY = 'demo_user'
const FAKE_EMAIL_DOMAIN = 'students.chinese-reading.local'

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  isDemoMode: boolean
  error: string | null
  login: (studentId: string, password: string) => Promise<void>
  loginAsDemoAdmin: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readDemoUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(readDemoUser())
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await hydrateProfile(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await hydrateProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function hydrateProfile(userId: string) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('student_id, role')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      setUser({ id: userId, studentId: data.student_id as string, role: data.role as UserRole })
    }
  }

  async function login(studentId: string, password: string) {
    setError(null)
    const cleanId = studentId.trim()
    if (!cleanId || !password) {
      setError('학번과 비밀번호를 입력해 주세요.')
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      // Demo mode: no backend configured yet. Anyone can sign in as a
      // student so the app is previewable before Supabase keys are added.
      const demoUser: AppUser = { id: `demo-${cleanId}`, studentId: cleanId, role: 'student' }
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    const email = `${cleanId}@${FAKE_EMAIL_DOMAIN}`
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      // First-time student login: self-provision the account + profile row.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError || !signUpData.user) {
        setError('로그인에 실패했습니다. 학번/비밀번호를 확인해 주세요.')
        return
      }
      await supabase.from('profiles').insert({
        id: signUpData.user.id,
        student_id: cleanId,
        role: 'student',
      })
      await hydrateProfile(signUpData.user.id)
      logEvent(cleanId, 'L01', 'login')
      return
    }

    if (data.user) {
      await hydrateProfile(data.user.id)
      logEvent(cleanId, 'L01', 'login')
    }
  }

  function loginAsDemoAdmin() {
    const demoAdmin: AppUser = { id: 'demo-admin', studentId: 'admin', role: 'admin' }
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoAdmin))
    setUser(demoAdmin)
  }

  async function logout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem(DEMO_STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, isDemoMode: !isSupabaseConfigured, error, login, loginAsDemoAdmin, logout }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
