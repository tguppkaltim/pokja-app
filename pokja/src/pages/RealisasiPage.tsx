import { useState, useMemo, useEffect } from 'react'
import { Save, Upload, X, FileText, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { fetchKegiatan, fetchRealisasi, upsertRealisasi, uploadEvidence } from '@/lib/db'
import type { Kegiatan, RealisasiKegiatan } from '@/types'
import { BULAN_FULL, SCHED_KEYS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CURRENT_YEAR = new Date().getFullYear()

// toISOString() mengonversi ke UTC. Di WITA (UTC+8) tanggal 1 Oktober pukul
// 00:00 lokal menjadi 30 September UTC, sehingga tanggal tersimpan mundur satu
// hari dan tidak cocok dengan `bulan` yang diambil dari waktu lokal.
// Rakit tanggalnya dari komponen lokal supaya keduanya konsisten.
function toTanggalLokal(d: Date) {
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const hari = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${bulan}-${hari}`
}

const MAKS_FILE = 5
const MAKS_UKURAN = 5 * 1024 * 1024
const TIPE_DIIZINKAN = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200">✗ Tidak Terlaksana</Badge>
  return null
}

export default function RealisasiPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok } = useData()
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([])
  const [riwayat, setRiwayat] = useState<RealisasiKegiatan[]>([])
  const [selectedKegiatan, setSelectedKegiatan] = useState('')
  const [tanggal, setTanggal] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('')
  const [catatan, setCatatan] = useState('')
  const [anggaranAktual, setAnggaranAktual] = useState('')
  const [sedangSeret, setSedangSeret] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)

  useEffect(() => {
    const opts = user?.role === 'operator' && user.pokja_id
      ? { pokjaId: user.pokja_id, tahun: CURRENT_YEAR }
      : { tahun: CURRENT_YEAR }
    fetchKegiatan(opts).then(setKegiatanList).finally(() => setIsDataLoading(false))
  }, [user])

  useEffect(() => {
    if (!selectedKegiatan) { setRiwayat([]); return }
    fetchRealisasi({ kegiatanId: parseInt(selectedKegiatan), tahun: CURRENT_YEAR })
      .then(r => setRiwayat(r.sort((a, b) => a.bulan - b.bulan)))
  }, [selectedKegiatan])

  const selectedBulan = tanggal ? tanggal.getMonth() + 1 : undefined
  const selectedKegiatanData = kegiatanList.find(k => k.id === parseInt(selectedKegiatan))

  const scheduledMonths = useMemo(() => {
    if (!selectedKegiatanData) return []
    return SCHED_KEYS.map((key, idx) => selectedKegiatanData[key] ? idx + 1 : null).filter(Boolean) as number[]
  }, [selectedKegiatanData])

  const existingRealisasi = selectedBulan
    ? riwayat.find(r => r.bulan === selectedBulan)
    : undefined

  const isMonthScheduled = selectedBulan ? scheduledMonths.includes(selectedBulan) : true

  // Pembanding untuk operator: porsi rencana anggaran untuk satu sesi.
  const rencanaPerSesi = selectedKegiatanData && scheduledMonths.length > 0
    ? Math.round(selectedKegiatanData.anggaran / scheduledMonths.length)
    : null

  function getPokjaName(pokjaId: number) { return pokjaList.find(p => p.id === pokjaId)?.name ?? '-' }
  function getProgramName(progId: number) { return programPokok.find(p => p.id === progId)?.name ?? '-' }

  // Item punya isi JSX; `items` memberi Base UI label teks untuk ditampilkan di trigger.
  const kegiatanItems = kegiatanList.map(k => ({ value: String(k.id), label: k.nama_kegiatan }))

  // Menerima sebagian: file yang lolos tetap masuk, yang bermasalah dilewati
  // dan dilaporkan. Versi lama membuang seluruh batch begitu ada satu yang
  // melanggar, sehingga memilih 6 file sekaligus berujung nol file masuk.
  //
  // Seluruh perhitungan dilakukan di luar setFiles. Updater harus murni:
  // StrictMode memanggilnya dua kali di mode dev, jadi efek samping di
  // dalamnya (toast, push ke array) akan terjadi dobel.
  function tambahFile(masuk: File[]) {
    if (masuk.length === 0) return

    const diterima: File[] = []
    const ditolakTipe: string[] = []
    const ditolakUkuran: string[] = []
    const duplikat: string[] = []
    let kelebihan = 0
    let sisaSlot = MAKS_FILE - files.length

    for (const f of masuk) {
      const ekstensi = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
      if (!TIPE_DIIZINKAN.includes(ekstensi)) { ditolakTipe.push(f.name); continue }
      if (f.size > MAKS_UKURAN) { ditolakUkuran.push(f.name); continue }
      if ([...files, ...diterima].some(x => x.name === f.name && x.size === f.size)) {
        duplikat.push(f.name); continue
      }
      if (sisaSlot <= 0) { kelebihan++; continue }
      diterima.push(f)
      sisaSlot--
    }

    if (diterima.length > 0) {
      setFiles(prev => [...prev, ...diterima])
      toast.success(`${diterima.length} file ditambahkan.`)
    }
    if (ditolakTipe.length > 0) toast.error(`Format tidak didukung: ${ditolakTipe.join(', ')}`)
    if (ditolakUkuran.length > 0) toast.error(`Melebihi 5 MB: ${ditolakUkuran.join(', ')}`)
    if (duplikat.length > 0) toast.info(`Sudah ada di daftar: ${duplikat.join(', ')}`)
    if (kelebihan > 0) toast.error(`${kelebihan} file tidak masuk. Maksimum ${MAKS_FILE} file per realisasi.`)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    tambahFile(Array.from(e.target.files ?? []))
    e.target.value = '' // supaya memilih file yang sama lagi tetap memicu change
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setSedangSeret(false)
    tambahFile(Array.from(e.dataTransfer.files))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedKegiatan || !tanggal || !status) {
      toast.error('Kegiatan, tanggal realisasi, dan status wajib diisi.')
      return
    }
    if (status === 'terlaksana' && anggaranAktual.trim() === '') {
      toast.error('Anggaran aktual wajib diisi untuk kegiatan yang terlaksana. Isi 0 bila tanpa biaya.')
      return
    }
    const nominalAktual = status === 'terlaksana' ? Number(anggaranAktual) : 0
    if (!Number.isFinite(nominalAktual) || nominalAktual < 0) {
      toast.error('Anggaran aktual harus berupa angka dan tidak boleh negatif.')
      return
    }
    if (!user) return
    setIsLoading(true)
    try {
      const saved = await upsertRealisasi({
        kegiatan_id: parseInt(selectedKegiatan),
        bulan: tanggal.getMonth() + 1,
        tahun: tanggal.getFullYear(),
        status: status as 'terlaksana' | 'tidak_terlaksana',
        tanggal_pelaksanaan: toTanggalLokal(tanggal),
        catatan,
        anggaran_aktual: nominalAktual,
        created_by: user.id,
      })

      if (files.length > 0) {
        await Promise.all(files.map(f => uploadEvidence(f, saved.id, user.id)))
      }

      toast.success('Realisasi berhasil disimpan.')
      setStatus('')
      setTanggal(undefined)
      setCatatan('')
      setAnggaranAktual('')
      setFiles([])
      const updated = await fetchRealisasi({ kegiatanId: parseInt(selectedKegiatan), tahun: CURRENT_YEAR })
      setRiwayat(updated.sort((a, b) => a.bulan - b.bulan))
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan realisasi. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isDataLoading) return <div className="py-20 text-center text-gray-400">Memuat data...</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">Input Realisasi Kegiatan</h1>
        <p className="text-sm text-gray-500 mt-1">Laporkan pelaksanaan kegiatan beserta bukti pendukung.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="border-[#d1e8d5]">
              <CardHeader>
                <CardTitle className="text-base text-[#1B6B35]">Data Realisasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Kegiatan <span className="text-red-500">*</span></Label>
                  <Select items={kegiatanItems} value={selectedKegiatan} onValueChange={v => { if (v) { setSelectedKegiatan(v); setTanggal(undefined) } }}>
                    <SelectTrigger className="border-[#d1e8d5] w-full"><SelectValue placeholder="Pilih kegiatan..." /></SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="w-[min(600px,90vw)]">
                      {kegiatanList.map(k => (
                        <SelectItem key={k.id} value={String(k.id)} className="py-2.5">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-400 shrink-0 mt-0.5">[{getPokjaName(k.pokja_id)}]</span>
                            <span className="text-sm text-gray-800 leading-snug whitespace-normal">{k.nama_kegiatan}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedKegiatanData && (
                  <div className="bg-[#F6FBF7] rounded-lg p-3 text-xs text-gray-500 space-y-1 border border-[#EAF5EC]">
                    <p><span className="font-medium text-gray-600">Program:</span> {getProgramName(selectedKegiatanData.program_pokok_id)}</p>
                    <p><span className="font-medium text-gray-600">Sasaran:</span> {selectedKegiatanData.sasaran || '-'}</p>
                    <p><span className="font-medium text-gray-600">Jadwal bulan:</span> {scheduledMonths.length > 0 ? scheduledMonths.map(m => BULAN_FULL[m - 1]).join(', ') : 'Belum ditentukan'}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Tanggal Realisasi <span className="text-red-500">*</span></Label>
                  <DatePicker value={tanggal} onChange={setTanggal} placeholder="Pilih tanggal pelaksanaan..." disabled={!selectedKegiatan} className="border-[#d1e8d5]" />
                  {tanggal && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Bulan realisasi: <span className="font-medium text-[#1B6B35]">{BULAN_FULL[tanggal.getMonth()]} {tanggal.getFullYear()}</span>
                      </span>
                      {selectedKegiatanData && !isMonthScheduled && <Badge className="bg-amber-100 text-amber-700 text-xs">Bulan tidak dijadwalkan</Badge>}
                      {selectedKegiatanData && isMonthScheduled && <Badge className="bg-[#EAF5EC] text-[#1B6B35] text-xs">✓ Sesuai jadwal</Badge>}
                    </div>
                  )}
                </div>

                {existingRealisasi && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    Data realisasi untuk bulan <strong>{tanggal ? BULAN_FULL[tanggal.getMonth()] : ''}</strong> sudah pernah diinput. Melanjutkan akan menimpa data lama.
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Status Realisasi <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'terlaksana', label: '✓ Terlaksana', base: 'border-green-300 text-green-700', active: 'bg-green-600 text-white border-green-600' },
                      { value: 'tidak_terlaksana', label: '✗ Tidak Terlaksana', base: 'border-red-300 text-red-700', active: 'bg-red-600 text-white border-red-600' },
                    ].map(opt => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant="outline"
                        size="lg"
                        aria-pressed={status === opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={`px-4 ${status === opt.value ? opt.active : `${opt.base} hover:bg-gray-50`}`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {status === 'terlaksana' && (
                  <div className="space-y-1.5">
                    <Label>Anggaran Aktual (Rp) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="0"
                      value={anggaranAktual}
                      onChange={e => setAnggaranAktual(e.target.value)}
                      className="border-[#d1e8d5]"
                    />
                    <p className="text-xs text-gray-400">
                      {rencanaPerSesi !== null
                        ? `Rencana per sesi: ${formatRupiah(rencanaPerSesi)}. Isi 0 bila kegiatan tanpa biaya.`
                        : 'Isi 0 bila kegiatan tanpa biaya.'}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Catatan Pelaksanaan</Label>
                  <Textarea placeholder="Deskripsikan hasil pelaksanaan, kendala, atau hal penting lainnya..." value={catatan} onChange={e => setCatatan(e.target.value)} className="border-[#d1e8d5] min-h-24" />
                </div>

                <Separator className="bg-[#EAF5EC]" />

                <div className="space-y-2">
                  <Label>Upload Bukti Kegiatan</Label>
                  <p className="text-xs text-gray-400">
                    Format: JPG, PNG, WEBP, PDF. Maks 5 MB/file. Maks {MAKS_FILE} file — bisa dipilih sekaligus.
                  </p>
                  <label
                    onDragOver={e => { e.preventDefault(); setSedangSeret(true) }}
                    onDragLeave={() => setSedangSeret(false)}
                    onDrop={handleDrop}
                    className={cn(
                      'flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                      sedangSeret
                        ? 'border-[#1B6B35] bg-[#EAF5EC]'
                        : 'border-[#52B788] hover:bg-[#EAF5EC]/50'
                    )}
                  >
                    <Upload className="w-6 h-6 text-[#52B788] mb-1" />
                    <span className="text-sm text-[#2E8B57] font-medium">
                      {sedangSeret ? 'Lepaskan file di sini' : 'Klik atau seret file ke sini'}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      Bisa pilih beberapa file sekaligus · sisa {MAKS_FILE - files.length} slot
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept={TIPE_DIIZINKAN.join(',')}
                      onChange={handleFileChange}
                      disabled={files.length >= MAKS_FILE}
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#F6FBF7] border border-[#d1e8d5] rounded-lg px-3 py-2">
                          {f.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-[#2E8B57] shrink-0" /> : <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                          <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                          <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Hapus file ${f.name}`} onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-1" /> Simpan Realisasi</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div>
          <Card className="border-[#d1e8d5]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#1B6B35]">Riwayat Realisasi</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {selectedKegiatanData ? selectedKegiatanData.nama_kegiatan : 'Pilih kegiatan untuk melihat riwayat'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedKegiatan && <p className="text-sm text-gray-400 text-center py-6">Pilih kegiatan terlebih dahulu.</p>}
              {selectedKegiatan && riwayat.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Belum ada realisasi untuk kegiatan ini.</p>}
              {riwayat.map(r => (
                <div key={r.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{BULAN_FULL[r.bulan - 1]} {r.tahun}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.tanggal_pelaksanaan && (
                    <p className="text-xs text-gray-400">{new Date(r.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  )}
                  {r.status === 'terlaksana' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Anggaran aktual: <span className="font-medium text-[#1B6B35]">{formatRupiah(r.anggaran_aktual)}</span>
                    </p>
                  )}
                  {r.catatan && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.catatan}</p>}
                  <Separator className="mt-3 bg-[#EAF5EC]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
