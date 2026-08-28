import { supabase } from './supabase'
import type { JadwalKegiatan, Kegiatan, Pokja, ProgramPokok, RealisasiKegiatan, EvidenceFile, User } from '@/types'

// ─── Pokja ───────────────────────────────────────────────────────────────────

export async function fetchPokja(): Promise<Pokja[]> {
  const { data, error } = await supabase.from('pokja').select('*').order('id')
  if (error) throw error
  return data ?? []
}

export async function createPokja(data: Pick<Pokja, 'name' | 'description'>): Promise<Pokja> {
  const { data: result, error } = await supabase.from('pokja').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updatePokja(id: number, data: Pick<Pokja, 'name' | 'description'>): Promise<void> {
  const { error } = await supabase.from('pokja').update(data).eq('id', id)
  if (error) throw error
}

export async function deletePokja(id: number): Promise<void> {
  const { error } = await supabase.from('pokja').delete().eq('id', id)
  if (error) throw error
}

// ─── Program Pokok ───────────────────────────────────────────────────────────

export async function fetchProgramPokok(pokjaId?: number): Promise<ProgramPokok[]> {
  let q = supabase.from('program_pokok').select('*').order('id')
  if (pokjaId) q = q.eq('pokja_id', pokjaId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createProgramPokok(data: Pick<ProgramPokok, 'pokja_id' | 'name'>): Promise<ProgramPokok> {
  const { data: result, error } = await supabase.from('program_pokok').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateProgramPokok(id: number, data: Pick<ProgramPokok, 'pokja_id' | 'name'>): Promise<void> {
  const { error } = await supabase.from('program_pokok').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteProgramPokok(id: number): Promise<void> {
  const { error } = await supabase.from('program_pokok').delete().eq('id', id)
  if (error) throw error
}

// ─── Kegiatan ─────────────────────────────────────────────────────────────────

export async function fetchKegiatan(opts?: { pokjaId?: number; tahun?: number }): Promise<Kegiatan[]> {
  let q = supabase.from('kegiatan').select('*').order('id')
  if (opts?.pokjaId) q = q.eq('pokja_id', opts.pokjaId)
  if (opts?.tahun) q = q.eq('tahun', opts.tahun)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function fetchKegiatanById(id: number): Promise<Kegiatan | null> {
  const { data, error } = await supabase.from('kegiatan').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function createKegiatan(data: Omit<Kegiatan, 'id' | 'created_at'>): Promise<Kegiatan> {
  const { data: result, error } = await supabase.from('kegiatan').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateKegiatan(id: number, data: Partial<Omit<Kegiatan, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('kegiatan').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteKegiatan(id: number): Promise<void> {
  const { error } = await supabase.from('kegiatan').delete().eq('id', id)
  if (error) throw error
}

// ─── Jadwal ───────────────────────────────────────────────────────────────────

export async function fetchJadwal(opts?: { kegiatanId?: number; tahun?: number }): Promise<JadwalKegiatan[]> {
  let q = supabase.from('jadwal_kegiatan').select('*').order('tanggal')
  if (opts?.kegiatanId) q = q.eq('kegiatan_id', opts.kegiatanId)
  if (opts?.tahun) {
    q = q.gte('tanggal', `${opts.tahun}-01-01`).lte('tanggal', `${opts.tahun}-12-31`)
  }
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/**
 * Menyelaraskan jadwal sebuah kegiatan dengan daftar tanggal yang diberikan.
 *
 * Menolak membuang tanggal yang sudah punya realisasi. `realisasi_kegiatan`
 * merujuk jadwal dengan `on delete cascade`, jadi menghapus barisnya di sini
 * akan ikut menghapus realisasinya tanpa peringatan — kehilangan data karena
 * sekadar menyunting rencana. Pemanggil menangkap Error ini dan menampilkannya.
 */
export async function setJadwalKegiatan(kegiatanId: number, tanggalBaru: string[]): Promise<void> {
  const sekarang = await fetchJadwal({ kegiatanId })
  const diinginkan = new Set(tanggalBaru)

  const akanDihapus = sekarang.filter(j => !diinginkan.has(j.tanggal))
  if (akanDihapus.length > 0) {
    const { data: terpakai, error: errCek } = await supabase
      .from('realisasi_kegiatan')
      .select('jadwal_id')
      .in('jadwal_id', akanDihapus.map(j => j.id))
    if (errCek) throw errCek

    if (terpakai && terpakai.length > 0) {
      const idTerpakai = new Set(terpakai.map(r => r.jadwal_id))
      const tanggalTerkunci = akanDihapus.filter(j => idTerpakai.has(j.id)).map(j => j.tanggal)
      throw new Error(
        `Tanggal ${tanggalTerkunci.join(', ')} sudah punya realisasi dan tidak bisa dihapus. ` +
        'Hapus realisasinya lebih dulu bila memang perlu diubah.'
      )
    }

    const { error } = await supabase
      .from('jadwal_kegiatan')
      .delete()
      .in('id', akanDihapus.map(j => j.id))
    if (error) throw error
  }

  const sudahAda = new Set(sekarang.map(j => j.tanggal))
  const akanDitambah = tanggalBaru.filter(t => !sudahAda.has(t))
  if (akanDitambah.length > 0) {
    const { error } = await supabase
      .from('jadwal_kegiatan')
      .insert(akanDitambah.map(tanggal => ({ kegiatan_id: kegiatanId, tanggal })))
    if (error) throw error
  }
}

// ─── Realisasi ────────────────────────────────────────────────────────────────

export async function fetchRealisasi(opts?: { kegiatanId?: number; tahun?: number }): Promise<RealisasiKegiatan[]> {
  let q = supabase.from('realisasi_kegiatan').select('*').order('bulan')
  if (opts?.kegiatanId) q = q.eq('kegiatan_id', opts.kegiatanId)
  if (opts?.tahun) q = q.eq('tahun', opts.tahun)
  const { data, error } = await q
  if (error) throw error
  // Migrasi 005 menambahkan anggaran_aktual. Kalau aplikasi dimuat sebelum
  // migrasi itu dijalankan kolomnya belum ada, dan nilai undefined membuat
  // penjumlahan serapan di Dashboard jadi NaN. Normalkan di titik masuk ini.
  return (data ?? []).map(r => ({ ...r, anggaran_aktual: r.anggaran_aktual ?? 0 }))
}

export async function upsertRealisasi(data: {
  kegiatan_id: number
  jadwal_id: number
  bulan: number
  tahun: number
  status: 'terlaksana' | 'tidak_terlaksana'
  tanggal_pelaksanaan: string | null
  catatan: string
  anggaran_aktual: number
  created_by: string
}): Promise<RealisasiKegiatan> {
  const { data: result, error } = await supabase
    .from('realisasi_kegiatan')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'jadwal_id' })
    .select()
    .single()
  if (error) throw error
  return result
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export async function fetchEvidence(realisasiId: number): Promise<EvidenceFile[]> {
  const { data, error } = await supabase.from('evidence_files').select('*').eq('realisasi_id', realisasiId)
  if (error) throw error
  return data ?? []
}

export async function uploadEvidence(
  file: File,
  realisasiId: number,
  uploadedBy: string
): Promise<EvidenceFile> {
  const path = `evidence/${realisasiId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage.from('evidence').upload(path, file)
  if (uploadError) throw uploadError

  const { data: result, error } = await supabase
    .from('evidence_files')
    .insert({
      realisasi_id: realisasiId,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()
  if (error) throw error
  return result
}

export async function deleteEvidence(id: number, filePath: string): Promise<void> {
  await supabase.storage.from('evidence').remove([filePath])
  const { error } = await supabase.from('evidence_files').delete().eq('id', id)
  if (error) throw error
}

export function getEvidenceUrl(filePath: string): string {
  const { data } = supabase.storage.from('evidence').getPublicUrl(filePath)
  return data.publicUrl
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data ?? []
}

export async function updateProfile(id: string, data: Partial<Pick<User, 'full_name' | 'is_active' | 'role' | 'pokja_id'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update(data).eq('id', id)
  if (error) throw error
}
