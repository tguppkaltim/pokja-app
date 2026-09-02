import { useState, useEffect, type ReactNode } from 'react'
import type { Pokja, ProgramPokok, ProgramUnggulan, ProgramPrioritas } from '@/types'
import { fetchPokja, fetchProgramPokok, fetchProgramUnggulan, fetchProgramPrioritas } from '@/lib/db'
import { useAuth } from '@/contexts/auth-context'
import { DataContext } from '@/contexts/data-context'

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  // Seluruh master program dimuat sekali: isinya puluhan baris, dan hampir
  // setiap halaman butuh menelusuri hierarkinya.
  const [data, setData] = useState<{
    pokja: Pokja[]
    programPokok: ProgramPokok[]
    programUnggulan: ProgramUnggulan[]
    programPrioritas: ProgramPrioritas[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) return
    // Seluruh setState hanya di dalam callback asinkron. Versi sebelumnya
    // memanggil setIsLoading langsung di badan efek, yang memicu render
    // beruntun.
    let dibatalkan = false
    Promise.all([
      fetchPokja(),
      fetchProgramPokok(),
      fetchProgramUnggulan(),
      fetchProgramPrioritas(),
    ])
      .then(([p, pp, pu, ppr]) => {
        if (dibatalkan) return
        setData({ pokja: p, programPokok: pp, programUnggulan: pu, programPrioritas: ppr })
        setError(null)
      })
      .catch((err: unknown) => {
        // Tanpa ini Promise.all yang ditolak membuat data tetap null selamanya:
        // aplikasi menggantung di "Memuat…" atau, lebih buruk, tiap halaman
        // tampil kosong seolah-olah datanya memang tidak ada.
        if (dibatalkan) return
        setData({ pokja: [], programPokok: [], programUnggulan: [], programPrioritas: [] })
        setError(err instanceof Error ? err.message : 'Gagal memuat master data.')
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
        programUnggulan: data?.programUnggulan ?? [],
        programPrioritas: data?.programPrioritas ?? [],
        isLoading,
        error,
        reload,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
