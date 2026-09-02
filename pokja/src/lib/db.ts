import { supabase } from './supabase'
import type { Rapat, TindakLanjut, ProgresTindakLanjut, JadwalKegiatan, Kegiatan, Pokja, ProgramPokok, ProgramUnggulan, ProgramPrioritas, RealisasiKegiatan, EvidenceFile, User } from '@/types'
import { formatTanggalPanjang } from '@/lib/utils'

// ─── Pokja ───────────────────────────────────────────────────────────────────

export async function fetchPokja(): Promise<Pokja[]> {
  const { data, error } = await supabase.from('pokja').select('*').order('id')
  if (error) throw error
  return data ?? []
}

export async function createPokja(data: Pick<Pokja, 'name' | 'description'> & Partial<Pick<Pokja, 'nama_lengkap'>>): Promise<Pokja> {
  const { data: result, error } = await supabase.from('pokja').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updatePokja(id: number, data: Partial<Pick<Pokja, 'name' | 'description' | 'nama_lengkap'>>): Promise<void> {
  const { error } = await supabase.from('pokja').update(data).eq('id', id)
  if (error) throw error
}

export async function deletePokja(id: number): Promise<void> {
  const { error } = await supabase.from('pokja').delete().eq('id', id)
  if (error) throw error
}

// ─── Program Pokok ───────────────────────────────────────────────────────────

/** Bidang yang tidak punya program pokok pun tetap perlu tampil di master. */
type ProgramPokokBaru = Pick<ProgramPokok, 'pokja_id' | 'name'> &
  Partial<Pick<ProgramPokok, 'indikator' | 'sasaran' | 'urutan'>>

export async function fetchProgramPokok(pokjaId?: number): Promise<ProgramPokok[]> {
  // urutan mengikuti nomor baku 10 Program Pokok PKK; id jadi pemecah seri
  // untuk baris di luar daftar baku (urutan 0).
  let q = supabase.from('program_pokok').select('*').order('urutan').order('id')
  if (pokjaId) q = q.eq('pokja_id', pokjaId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createProgramPokok(data: ProgramPokokBaru): Promise<ProgramPokok> {
  const { data: result, error } = await supabase.from('program_pokok').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateProgramPokok(id: number, data: Partial<ProgramPokokBaru>): Promise<void> {
  const { error } = await supabase.from('program_pokok').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteProgramPokok(id: number): Promise<void> {
  const { error } = await supabase.from('program_pokok').delete().eq('id', id)
  if (error) throw error
}

// ─── Program Unggulan ────────────────────────────────────────────────────────

type ProgramUnggulanBaru = Pick<ProgramUnggulan, 'program_pokok_id' | 'name'> &
  Partial<Pick<ProgramUnggulan, 'asal' | 'urutan'>>

export async function fetchProgramUnggulan(programPokokId?: number): Promise<ProgramUnggulan[]> {
  let q = supabase.from('program_unggulan').select('*').order('urutan').order('id')
  if (programPokokId) q = q.eq('program_pokok_id', programPokokId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createProgramUnggulan(data: ProgramUnggulanBaru): Promise<ProgramUnggulan> {
  const { data: result, error } = await supabase.from('program_unggulan').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateProgramUnggulan(id: number, data: Partial<ProgramUnggulanBaru>): Promise<void> {
  const { error } = await supabase.from('program_unggulan').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteProgramUnggulan(id: number): Promise<void> {
  const { error } = await supabase.from('program_unggulan').delete().eq('id', id)
  if (error) throw error
}

// ─── Program Prioritas ───────────────────────────────────────────────────────

type ProgramPrioritasBaru = Pick<ProgramPrioritas, 'program_unggulan_id' | 'name'> &
  Partial<Pick<ProgramPrioritas, 'contoh_kegiatan' | 'urutan'>>

export async function fetchProgramPrioritas(programUnggulanId?: number): Promise<ProgramPrioritas[]> {
  let q = supabase.from('program_prioritas').select('*').order('urutan').order('id')
  if (programUnggulanId) q = q.eq('program_unggulan_id', programUnggulanId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createProgramPrioritas(data: ProgramPrioritasBaru): Promise<ProgramPrioritas> {
  const { data: result, error } = await supabase.from('program_prioritas').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateProgramPrioritas(id: number, data: Partial<ProgramPrioritasBaru>): Promise<void> {
  const { error } = await supabase.from('program_prioritas').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteProgramPrioritas(id: number): Promise<void> {
  const { error } = await supabase.from('program_prioritas').delete().eq('id', id)
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
        `Tanggal ${tanggalTerkunci.map(formatTanggalPanjang).join(', ')} sudah punya realisasi dan tidak bisa dihapus. ` +
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

// ─── Notulensi rapat ──────────────────────────────────────────────────────────

export async function fetchRapat(): Promise<Rapat[]> {
  const { data, error } = await supabase.from('rapat').select('*').order('tanggal', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchRapatById(id: number): Promise<Rapat | null> {
  const { data, error } = await supabase.from('rapat').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function createRapat(data: Omit<Rapat, 'id' | 'created_at'>): Promise<Rapat> {
  const { data: hasil, error } = await supabase.from('rapat').insert(data).select().single()
  if (error) throw error
  return hasil
}

export async function updateRapat(id: number, data: Partial<Omit<Rapat, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('rapat').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteRapat(id: number): Promise<void> {
  const { error } = await supabase.from('rapat').delete().eq('id', id)
  if (error) throw error
}

// ─── Tindak lanjut ────────────────────────────────────────────────────────────

export async function fetchTindakLanjut(opts?: { rapatId?: number }): Promise<TindakLanjut[]> {
  let q = supabase.from('tindak_lanjut').select('*').order('id')
  if (opts?.rapatId) q = q.eq('rapat_id', opts.rapatId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

type TindakLanjutBaru = Omit<TindakLanjut, 'id' | 'created_at' | 'updated_at'>

/**
 * Definisi tindak lanjut — tanpa status dan closed_date.
 *
 * Keduanya hanya boleh berubah lewat tambahProgres(), supaya tidak ada
 * perubahan status yang lolos tanpa tercatat di riwayat. Riwayat yang bocor
 * lebih berbahaya daripada tidak ada riwayat, karena terlihat seolah lengkap.
 */
type DefinisiTindakLanjut = Omit<TindakLanjutBaru, 'status' | 'closed_date'>

export async function createTindakLanjut(data: TindakLanjutBaru): Promise<TindakLanjut> {
  const { data: hasil, error } = await supabase
    .from('tindak_lanjut')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return hasil
}

export async function updateTindakLanjut(
  id: number,
  data: Partial<DefinisiTindakLanjut>
): Promise<void> {
  const { error } = await supabase
    .from('tindak_lanjut')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTindakLanjut(id: number): Promise<void> {
  const { error } = await supabase.from('tindak_lanjut').delete().eq('id', id)
  if (error) throw error
}


// ─── Riwayat progress ─────────────────────────────────────────────────────────

export async function fetchProgres(opts?: { tindakLanjutId?: number }): Promise<ProgresTindakLanjut[]> {
  let q = supabase.from('progres_tindak_lanjut').select('*').order('created_at')
  if (opts?.tindakLanjutId) q = q.eq('tindak_lanjut_id', opts.tindakLanjutId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/**
 * Satu-satunya jalur yang mengubah status tindak lanjut.
 *
 * Trigger `trg_sync_status_dari_progres` di database menyalin status_baru ke
 * tindak_lanjut dan mengurus closed_date, jadi keduanya tidak mungkin melenceng
 * dari riwayatnya.
 */
export async function tambahProgres(data: {
  tindak_lanjut_id: number
  status_baru: TindakLanjut['status']
  catatan: string
  foto_path: string | null
  dibuat_oleh: string
}): Promise<ProgresTindakLanjut> {
  const { data: hasil, error } = await supabase
    .from('progres_tindak_lanjut')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return hasil
}

export async function deleteProgres(id: number): Promise<void> {
  const { error } = await supabase.from('progres_tindak_lanjut').delete().eq('id', id)
  if (error) throw error
}

// ─── Foto tindak lanjut ───────────────────────────────────────────────────────

export async function uploadFotoTindakLanjut(file: File, tindakLanjutId: number): Promise<string> {
  const path = `tindak-lanjut/${tindakLanjutId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('evidence').upload(path, file)
  if (error) throw error
  return path
}

/**
 * Bucket `evidence` bersifat private, jadi getPublicUrl() mengembalikan 400.
 * URL bertanda tangan berlaku sementara dan hanya bisa dibuat oleh sesi yang
 * berhak, sehingga foto bukti tidak bisa diakses tanpa login.
 */
export async function getFotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('evidence').createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
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
