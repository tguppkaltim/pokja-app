import type { Pokja, ProgramPokok, ProgramUnggulan, ProgramPrioritas } from '@/types'

/**
 * Master program berbentuk empat lapis:
 *
 *   Bidang (pokja) > Program Pokok > Program Unggulan > Program Prioritas
 *
 * Kegiatan menunjuk ke Program Prioritas. Penolong di berkas ini menelusuri
 * rantai itu dua arah supaya tiap halaman tidak menyusun ulang logikanya.
 */

export interface MasterProgram {
  pokja: Pokja[]
  programPokok: ProgramPokok[]
  programUnggulan: ProgramUnggulan[]
  programPrioritas: ProgramPrioritas[]
}

export interface JalurPrioritas {
  prioritas: ProgramPrioritas
  unggulan: ProgramUnggulan
  pokok: ProgramPokok
  pokja: Pokja | null
}

/** Telusuri satu Program Prioritas sampai ke bidangnya. */
export function jalurPrioritas(
  prioritasId: number | null,
  master: MasterProgram,
): JalurPrioritas | null {
  if (prioritasId === null) return null
  const prioritas = master.programPrioritas.find(p => p.id === prioritasId)
  if (!prioritas) return null
  const unggulan = master.programUnggulan.find(u => u.id === prioritas.program_unggulan_id)
  if (!unggulan) return null
  const pokok = master.programPokok.find(p => p.id === unggulan.program_pokok_id)
  if (!pokok) return null
  return { prioritas, unggulan, pokok, pokja: master.pokja.find(p => p.id === pokok.pokja_id) ?? null }
}

/** "Pangan › Gerakan Pangan Bergizi › Pemanfaatan pekarangan" */
export function labelJalur(jalur: JalurPrioritas): string {
  return `${jalur.pokok.name} › ${jalur.unggulan.name} › ${jalur.prioritas.name}`
}

/**
 * Program Prioritas yang boleh dipilih untuk satu bidang, sudah diurutkan
 * mengikuti urutan pokok lalu unggulan.
 */
export function prioritasPerPokja(pokjaId: number | null, master: MasterProgram): JalurPrioritas[] {
  const pokok = master.programPokok
    .filter(p => pokjaId === null || p.pokja_id === pokjaId)
    .sort((a, b) => a.urutan - b.urutan || a.id - b.id)

  const hasil: JalurPrioritas[] = []
  for (const pp of pokok) {
    const unggulan = master.programUnggulan
      .filter(u => u.program_pokok_id === pp.id)
      .sort((a, b) => a.urutan - b.urutan || a.id - b.id)
    for (const u of unggulan) {
      const prioritas = master.programPrioritas
        .filter(p => p.program_unggulan_id === u.id)
        .sort((a, b) => a.urutan - b.urutan || a.id - b.id)
      for (const p of prioritas) {
        hasil.push({ prioritas: p, unggulan: u, pokok: pp, pokja: master.pokja.find(x => x.id === pp.pokja_id) ?? null })
      }
    }
  }
  return hasil
}

/**
 * Program Pokok yang belum punya satu pun Program Prioritas. Bukan galat —
 * master resmi memang belum merinci sebagiannya — tapi kegiatan di bawahnya
 * jadi tidak punya pilihan, jadi perlu diberitahukan.
 */
export function pokokTanpaPrioritas(pokjaId: number | null, master: MasterProgram): ProgramPokok[] {
  const punya = new Set(
    master.programUnggulan
      .filter(u => master.programPrioritas.some(p => p.program_unggulan_id === u.id))
      .map(u => u.program_pokok_id),
  )
  return master.programPokok
    .filter(p => (pokjaId === null || p.pokja_id === pokjaId) && !punya.has(p.id))
    .sort((a, b) => a.urutan - b.urutan || a.id - b.id)
}
