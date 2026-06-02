import { useState, useMemo } from 'react'
import { Save, Upload, X, FileText, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuth } from '@/contexts/AuthContext'
import { mockKegiatan, mockPokja, mockProgramPokok, mockRealisasi, mockEvidence, BULAN_FULL, SCHED_KEYS } from '@/data/mockData'
import { toast } from 'sonner'

const CURRENT_YEAR = 2026

function StatusBadge({ status }: { status: string }) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200">✗ Tidak Terlaksana</Badge>
  return null
}

interface MockFile {
  id: number
  name: string
  size: number
  type: string
}

export default function RealisasiPage() {
  const { user } = useAuth()
  const [selectedKegiatan, setSelectedKegiatan] = useState('')
  const [tanggal, setTanggal] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('')
  const [catatan, setCatatan] = useState('')
  const [files, setFiles] = useState<MockFile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Bulan realisasi diturunkan otomatis dari tanggal yang dipilih
  const selectedBulan = tanggal ? tanggal.getMonth() + 1 : undefined

  const kegiatanList = useMemo(() => {
    if (user?.role === 'operator' && user.pokja_id) {
      return mockKegiatan.filter(k => k.pokja_id === user.pokja_id && k.tahun === CURRENT_YEAR)
    }
    return mockKegiatan.filter(k => k.tahun === CURRENT_YEAR)
  }, [user])

  const selectedKegiatanData = mockKegiatan.find(k => k.id === parseInt(selectedKegiatan))

  const scheduledMonths = useMemo(() => {
    if (!selectedKegiatanData) return []
    return SCHED_KEYS
      .map((key, idx) => selectedKegiatanData[key] ? idx + 1 : null)
      .filter(Boolean) as number[]
  }, [selectedKegiatanData])

  const existingRealisasi = selectedBulan
    ? mockRealisasi.find(
        r => r.kegiatan_id === parseInt(selectedKegiatan) && r.bulan === selectedBulan && r.tahun === CURRENT_YEAR
      )
    : undefined

  const isMonthScheduled = selectedBulan ? scheduledMonths.includes(selectedBulan) : true

  const riwayatRealisasi = mockRealisasi
    .filter(r => r.kegiatan_id === parseInt(selectedKegiatan) && r.tahun === CURRENT_YEAR)
    .sort((a, b) => a.bulan - b.bulan)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (files.length + selected.length > 5) {
      toast.error('Maksimum 5 file per input realisasi.')
      return
    }
    const tooLarge = selected.filter(f => f.size > 5 * 1024 * 1024)
    if (tooLarge.length > 0) {
      toast.error('Ukuran file maksimum 5 MB.')
      return
    }
    setFiles(prev => [
      ...prev,
      ...selected.map((f, i) => ({ id: Date.now() + i, name: f.name, size: f.size, type: f.type }))
    ])
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedKegiatan || !tanggal || !status) {
      toast.error('Kegiatan, tanggal realisasi, dan status wajib diisi.')
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('Realisasi berhasil disimpan.')
    setIsLoading(false)
    setStatus('')
    setTanggal(undefined)
    setCatatan('')
    setFiles([])
  }

  const getPokjaName = (pokjaId: number) => mockPokja.find(p => p.id === pokjaId)?.name ?? '-'
  const getProgramName = (progId: number) => mockProgramPokok.find(p => p.id === progId)?.name ?? '-'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">Input Realisasi Kegiatan</h1>
        <p className="text-sm text-gray-500 mt-1">Laporkan pelaksanaan kegiatan beserta bukti pendukung.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="border-[#d1e8d5]">
              <CardHeader>
                <CardTitle className="text-base text-[#1B6B35]">Data Realisasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Kegiatan */}
                <div className="space-y-1.5">
                  <Label>Kegiatan <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedKegiatan}
                    onValueChange={v => { if (v) { setSelectedKegiatan(v); setTanggal(undefined) } }}
                  >
                    <SelectTrigger className="border-[#d1e8d5] w-full">
                      <SelectValue placeholder="Pilih kegiatan..." />
                    </SelectTrigger>
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

                {/* Info kegiatan terpilih */}
                {selectedKegiatanData && (
                  <div className="bg-[#F6FBF7] rounded-lg p-3 text-xs text-gray-500 space-y-1 border border-[#EAF5EC]">
                    <p><span className="font-medium text-gray-600">Program:</span> {getProgramName(selectedKegiatanData.program_pokok_id)}</p>
                    <p><span className="font-medium text-gray-600">Sasaran:</span> {selectedKegiatanData.sasaran || '-'}</p>
                    <p>
                      <span className="font-medium text-gray-600">Jadwal bulan:</span>{' '}
                      {scheduledMonths.length > 0
                        ? scheduledMonths.map(m => BULAN_FULL[m - 1]).join(', ')
                        : 'Belum ditentukan'
                      }
                    </p>
                  </div>
                )}

                {/* Tanggal Realisasi */}
                <div className="space-y-1.5">
                  <Label>Tanggal Realisasi <span className="text-red-500">*</span></Label>
                  <DatePicker
                    value={tanggal}
                    onChange={setTanggal}
                    placeholder="Pilih tanggal pelaksanaan..."
                    disabled={!selectedKegiatan}
                    className="border-[#d1e8d5]"
                  />
                  {/* Tampilkan bulan yang terdeteksi */}
                  {tanggal && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Bulan realisasi: <span className="font-medium text-[#1B6B35]">{BULAN_FULL[tanggal.getMonth()]} {tanggal.getFullYear()}</span>
                      </span>
                      {selectedKegiatanData && !isMonthScheduled && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">Bulan tidak dijadwalkan</Badge>
                      )}
                      {selectedKegiatanData && isMonthScheduled && (
                        <Badge className="bg-[#EAF5EC] text-[#1B6B35] text-xs">✓ Sesuai jadwal</Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Peringatan data sudah ada */}
                {existingRealisasi && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    Data realisasi untuk bulan <strong>{tanggal ? BULAN_FULL[tanggal.getMonth()] : ''}</strong> sudah pernah diinput. Melanjutkan akan menimpa data lama.
                  </div>
                )}

                {/* Status */}
                <div className="space-y-1.5">
                  <Label>Status Realisasi <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'terlaksana', label: '✓ Terlaksana', base: 'border-green-300 text-green-700', active: 'bg-green-600 text-white border-green-600' },
                      { value: 'tidak_terlaksana', label: '✗ Tidak Terlaksana', base: 'border-red-300 text-red-700', active: 'bg-red-600 text-white border-red-600' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          status === opt.value ? opt.active : opt.base + ' hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan */}
                <div className="space-y-1.5">
                  <Label>Catatan Pelaksanaan</Label>
                  <Textarea
                    placeholder="Deskripsikan hasil pelaksanaan, kendala, atau hal penting lainnya..."
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                    className="border-[#d1e8d5] min-h-24"
                  />
                </div>

                <Separator className="bg-[#EAF5EC]" />

                {/* Upload Evidence */}
                <div className="space-y-2">
                  <Label>Upload Bukti Kegiatan</Label>
                  <p className="text-xs text-gray-400">Format: JPG, PNG, WEBP, PDF. Maks 5 MB/file. Maks 5 file.</p>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#52B788] rounded-xl cursor-pointer hover:bg-[#EAF5EC]/50 transition-colors">
                    <Upload className="w-6 h-6 text-[#52B788] mb-1" />
                    <span className="text-sm text-[#2E8B57] font-medium">Klik atau drag & drop file</span>
                    <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, PDF</span>
                    <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} />
                  </label>
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map(f => (
                        <div key={f.id} className="flex items-center gap-3 bg-[#F6FBF7] border border-[#d1e8d5] rounded-lg px-3 py-2">
                          {f.type.startsWith('image/')
                            ? <ImageIcon className="w-4 h-4 text-[#2E8B57] shrink-0" />
                            : <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          }
                          <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                          <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                          <button type="button" onClick={() => setFiles(prev => prev.filter(p => p.id !== f.id))} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
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

        {/* Riwayat */}
        <div>
          <Card className="border-[#d1e8d5]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#1B6B35]">Riwayat Realisasi</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {selectedKegiatanData ? selectedKegiatanData.nama_kegiatan : 'Pilih kegiatan untuk melihat riwayat'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedKegiatan && (
                <p className="text-sm text-gray-400 text-center py-6">Pilih kegiatan terlebih dahulu.</p>
              )}
              {selectedKegiatan && riwayatRealisasi.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Belum ada realisasi untuk kegiatan ini.</p>
              )}
              {riwayatRealisasi.map(r => {
                const evidences = mockEvidence.filter(e => e.realisasi_id === r.id)
                return (
                  <div key={r.id} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{BULAN_FULL[r.bulan - 1]} {r.tahun}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.tanggal_pelaksanaan && (
                      <p className="text-xs text-gray-400">
                        {new Date(r.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    {r.catatan && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.catatan}</p>}
                    {evidences.length > 0 && (
                      <p className="text-xs text-[#2E8B57] mt-1">{evidences.length} file bukti</p>
                    )}
                    <Separator className="mt-3 bg-[#EAF5EC]" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
