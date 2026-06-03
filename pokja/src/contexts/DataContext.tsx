import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Pokja, ProgramPokok } from '@/types'
import { fetchPokja, fetchProgramPokok } from '@/lib/db'
import { useAuth } from '@/contexts/AuthContext'

interface DataContextValue {
  pokja: Pokja[]
  programPokok: ProgramPokok[]
  isLoading: boolean
  reload: () => void
}

const DataContext = createContext<DataContextValue>({
  pokja: [],
  programPokok: [],
  isLoading: true,
  reload: () => {},
})

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [pokja, setPokja] = useState<Pokja[]>([])
  const [programPokok, setProgramPokok] = useState<ProgramPokok[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) { setIsLoading(false); return }
    setIsLoading(true)
    Promise.all([fetchPokja(), fetchProgramPokok()])
      .then(([p, pp]) => { setPokja(p); setProgramPokok(pp) })
      .finally(() => setIsLoading(false))
  }, [user, tick])

  function reload() { setTick(t => t + 1) }

  return (
    <DataContext.Provider value={{ pokja, programPokok, isLoading, reload }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
