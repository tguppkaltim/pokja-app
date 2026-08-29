import { createContext, useContext } from 'react'
import type { Pokja, ProgramPokok } from '@/types'

// Dipisahkan dari DataProvider: fast refresh React berhenti bekerja untuk
// seluruh berkas kalau ada ekspor non-komponen di dalamnya.
export interface DataContextValue {
  pokja: Pokja[]
  programPokok: ProgramPokok[]
  isLoading: boolean
  reload: () => void
}

export const DataContext = createContext<DataContextValue>({
  pokja: [],
  programPokok: [],
  isLoading: true,
  reload: () => {},
})

export function useData() {
  return useContext(DataContext)
}
