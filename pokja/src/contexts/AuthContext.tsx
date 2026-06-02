import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'
import { mockUsers, mockCredentials } from '@/data/mockData'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pkk_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('pkk_user')
      }
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    await new Promise(r => setTimeout(r, 600))
    const correctPassword = mockCredentials[email]
    if (!correctPassword || correctPassword !== password) {
      throw new Error('Email atau password salah.')
    }
    const found = mockUsers.find(u => u.email === email && u.is_active)
    if (!found) {
      throw new Error('Akun tidak aktif. Hubungi Administrator.')
    }
    setUser(found)
    localStorage.setItem('pkk_user', JSON.stringify(found))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('pkk_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
