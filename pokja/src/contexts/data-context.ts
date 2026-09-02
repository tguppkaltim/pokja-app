import { createContext, useContext } from 'react'
import type { Pokja, ProgramPokok, ProgramUnggulan, ProgramPrioritas } from '@/types'

// Dipisahkan dari DataProvider: fast refresh React berhenti bekerja untuk
// seluruh berkas kalau ada ekspor non-komponen di dalamnya.
export interface DataContextValue {
  pokja: Pokja[]
  programPokok: ProgramPokok[]
  programUnggulan: ProgramUnggulan[]
  programPrioritas: ProgramPrioritas[]
  isLoading: boolean
  /** Pesan galat saat memuat master data; null bila sehat. */
  error: string | null
  reload: () => void
}

export const DataContext = createContext<DataContextValue>({
  pokja: [],
  programPokok: [],
  programUnggulan: [],
  programPrioritas: [],
  isLoading: true,
  error: null,
  reload: () => {},
})

export function useData() {
  return useContext(DataContext)
}
