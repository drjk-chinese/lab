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

  async function hydrateProfile(userId: string): Promise<boolean> {
    if (!supabase) return false
    const { data } = await supabase
      .from('profiles')
      .select('student_id, role')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      setUser({ id: userId, studentId: data.student_id as string, role: data.role as UserRole })
      return true
    }
    return false
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
      // Wrong password for an existing account: don't fall through to
      // signUp (which would just fail with "already registered").
      if (signInError.message !== 'Invalid login credentials') {
        setError(`로그인 실패: ${signInError.message}`)
        return
      }

      // First-time student login: self-provision the account + profile row.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(`가입 실패: ${signUpError.message}`)
        return
      }
      if (!signUpData.user) {
        setError('가입 실패: 이메일 인증이 필요하도록 설정되어 있는 것 같습니다. Supabase 대시보드 > Authentication > Providers > Email에서 "Confirm email"을 꺼주세요.')
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        student_id: cleanId,
        role: 'student',
      })
      if (profileError) {
        setError(`프로필 생성 실패: ${profileError.message}`)
        return
      }

      await hydrateProfile(signUpData.user.id)
      logEvent(cleanId, 'L01', 'login')
      return
    }

    if (data.user) {
      const found = await hydrateProfile(data.user.id)
      if (!found) {
        setError(
          '로그인은 됐지만 학생 정보(profiles)를 찾을 수 없습니다. Supabase에서 schema.sql이 실행되었는지 확인해 주세요.',
        )
        return
      }
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
