import { createContext, useContext } from 'react'
import type { User } from '@/types'

// Context dan hook-nya dipisahkan dari AuthProvider: fast refresh React berhenti
// bekerja untuk seluruh berkas kalau ada ekspor non-komponen di dalamnya.
export interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
