import { useState, useEffect, type ReactNode } from 'react'
import type { Pokja, ProgramPokok } from '@/types'
import { fetchPokja, fetchProgramPokok } from '@/lib/db'
import { useAuth } from '@/contexts/auth-context'
import { DataContext } from '@/contexts/data-context'

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<{ pokja: Pokja[]; programPokok: ProgramPokok[] } | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) return
    // Seluruh setState hanya di dalam callback asinkron. Versi sebelumnya
    // memanggil setIsLoading langsung di badan efek, yang memicu render
    // beruntun.
    let dibatalkan = false
    Promise.all([fetchPokja(), fetchProgramPokok()]).then(([p, pp]) => {
      if (!dibatalkan) setData({ pokja: p, programPokok: pp })
    })
    return () => { dibatalkan = true }
  }, [user, tick])

  // Diturunkan, bukan disimpan: tidak ada yang bisa membuatnya tak sinkron.
  const isLoading = Boolean(user) && data === null

  function reload() { setTick(t => t + 1) }

  return (
    <DataContext.Provider
      value={{
        pokja: data?.pokja ?? [],
        programPokok: data?.programPokok ?? [],
        isLoading,
        reload,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
