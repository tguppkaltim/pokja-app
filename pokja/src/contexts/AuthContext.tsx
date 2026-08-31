import { useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'
import { AuthContext } from '@/contexts/auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Didefinisikan di dalam efek: satu-satunya pemakainya adalah efek ini, dan
    // seluruh setState terjadi di dalam callback asinkron — bukan langsung di
    // badan efek, yang memicu render beruntun.
    let dibatalkan = false

    async function muatProfil(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (dibatalkan) return

      // Akun yang dinonaktifkan diblokir di Supabase Auth, tapi access token
      // yang sudah dipegang tetap sah sampai kedaluwarsa — biasanya sejam.
      // Tanpa pemeriksaan ini, pengguna yang baru dinonaktifkan masih bisa
      // bekerja selama sisa waktu itu.
      if (!error && data && !(data as User).is_active) {
        await supabase.auth.signOut()
        setUser(null)
        setIsLoading(false)
        return
      }

      if (!error && data) setUser(data as User)
      setIsLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (dibatalkan) return
      if (session?.user) {
        muatProfil(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (dibatalkan) return
      if (session?.user) {
        muatProfil(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      dibatalkan = true
      subscription.unsubscribe()
    }
  }, [])

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
