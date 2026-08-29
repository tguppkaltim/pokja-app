import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { fetchKegiatanById, createKegiatan, updateKegiatan, fetchJadwal, setJadwalKegiatan } from '@/lib/db'
import { toTanggalLokal, formatTanggalPanjang } from '@/lib/utils'
import { toast } from 'sonner'


const emptyForm = {
  pokja_id: '',
  program_pokok_id: '',
  nama_kegiatan: '',
  sasaran: '',
  pelaksana: '',
  anggaran: '',
  jadwal: [] as string[], // YYYY-MM-DD
}

export default function KegiatanFormPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok } = useData()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ ...emptyForm })
  const [pickerValue, setPickerValue] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      Promise.all([
        fetchKegiatanById(parseInt(id)),
        fetchJadwal({ kegiatanId: parseInt(id) }),
      ]).then(([existing, jadwalRows]) => {
        if (existing) {
          const jadwal = jadwalRows.map(j => j.tanggal)
          setForm({
            pokja_id: String(existing.pokja_id),
            program_pokok_id: String(existing.program_pokok_id),
            nama_kegiatan: existing.nama_kegiatan,
            sasaran: existing.sasaran,
            pelaksana: existing.pelaksana,
            anggaran: String(existing.anggaran),
            jadwal,
          })
        }
      }).finally(() => setIsLoading(false))
    }
  }, [isEdit, id])

  // Operator terkunci ke pokjanya sendiri. Diturunkan, bukan disalin ke state
  // lewat efek: menyalinnya berarti setState sinkron di badan efek, dan nilainya
  // bisa tertinggal saat user berubah.
  const pokjaTerkunci = user?.role === 'operator' && user.pokja_id ? String(user.pokja_id) : ''
  const pokjaAktif = form.pokja_id || pokjaTerkunci

  const filteredProgram = programPokok.filter(p => pokjaAktif ? p.pokja_id === parseInt(pokjaAktif) : true)
  const pokjaOptions = user?.role === 'operator' && user.pokja_id
    ? pokjaList.filter(p => p.id === user.pokja_id)
    : pokjaList

  // Base UI menampilkan nilai mentah di trigger kalau `items` tidak dikirim ke
  // Select.Root, sehingga yang tampil id-nya (angka) dan bukan namanya.
  const pokjaItems = pokjaOptions.map(p => ({ value: String(p.id), label: p.name }))
  const programItems = filteredProgram.map(p => ({ value: String(p.id), label: p.name }))

  function addJadwal(d: Date | undefined) {
    if (!d) return
    const tanggal = toTanggalLokal(d)
    if (form.jadwal.includes(tanggal)) {
      toast.info(`${formatTanggalPanjang(tanggal)} sudah ada dalam jadwal.`)
      setPickerValue(undefined)
      return
    }
    setForm(prev => ({ ...prev, jadwal: [...prev.jadwal, tanggal].sort() }))
    setPickerValue(undefined)
  }

  function removeJadwal(tanggal: string) {
    setForm(prev => ({ ...prev, jadwal: prev.jadwal.filter(t => t !== tanggal) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pokjaAktif || !form.program_pokok_id || !form.nama_kegiatan) {
      toast.error('Pokja, Program Pokok, dan Nama Kegiatan wajib diisi.')
      return
    }
    if (form.jadwal.length === 0) {
      toast.error('Tambahkan minimal satu jadwal pelaksanaan.')
      return
    }
    if (!user) return

    const tahun = parseInt(form.jadwal[0].slice(0, 4))

    setIsSaving(true)
    try {
      const payload = {
        pokja_id: parseInt(pokjaAktif),
        program_pokok_id: parseInt(form.program_pokok_id),
        nama_kegiatan: form.nama_kegiatan,
        sasaran: form.sasaran,
        pelaksana: form.pelaksana,
        anggaran: parseInt(form.anggaran) || 0,
        tahun,
        created_by: user.id,
      }

      if (isEdit && id) {
        await updateKegiatan(parseInt(id), payload)
        await setJadwalKegiatan(parseInt(id), form.jadwal)
        toast.success('Kegiatan berhasil diperbarui.')
      } else {
        const dibuat = await createKegiatan(payload as Parameters<typeof createKegiatan>[0])
        await setJadwalKegiatan(dibuat.id, form.jadwal)
        toast.success('Kegiatan berhasil ditambahkan.')
      }
      navigate('/kegiatan')
    } catch (err) {
      // setJadwalKegiatan menolak membuang tanggal yang sudah punya realisasi;
      // pesannya ditujukan ke pengguna, jadi jangan ditelan.
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat data...</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">{isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</h1>
        <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Perbarui data rencana kegiatan.' : 'Input rencana kegiatan ke dalam POA.'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-[#d1e8d5]">
          <CardHeader>
            <CardTitle className="text-base text-[#1B6B35]">Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Pokja <span className="text-red-500">*</span></Label>
                <Select items={pokjaItems} value={pokjaAktif} onValueChange={v => v && setForm(prev => ({ ...prev, pokja_id: v, program_pokok_id: '' }))} disabled={user?.role === 'operator'}>
                  <SelectTrigger className="border-[#d1e8d5]"><SelectValue placeholder="Pilih Pokja" /></SelectTrigger>
                  <SelectContent>
                    {pokjaItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Program Pokok <span className="text-red-500">*</span></Label>
                <Select items={programItems} value={form.program_pokok_id} onValueChange={v => v && setForm(prev => ({ ...prev, program_pokok_id: v }))}>
                  <SelectTrigger className="border-[#d1e8d5]"><SelectValue placeholder="Pilih Program Pokok" /></SelectTrigger>
                  <SelectContent>
                    {programItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nama Kegiatan <span className="text-red-500">*</span></Label>
              <Textarea placeholder="Deskripsikan kegiatan secara singkat dan jelas..." value={form.nama_kegiatan} onChange={e => setForm(prev => ({ ...prev, nama_kegiatan: e.target.value }))} className="border-[#d1e8d5] min-h-20" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sasaran</Label>
                <Input placeholder="Target peserta/penerima manfaat" value={form.sasaran} onChange={e => setForm(prev => ({ ...prev, sasaran: e.target.value }))} className="border-[#d1e8d5]" />
              </div>
              <div className="space-y-1.5">
                <Label>Pelaksana</Label>
                <Input placeholder="Penanggung jawab pelaksanaan" value={form.pelaksana} onChange={e => setForm(prev => ({ ...prev, pelaksana: e.target.value }))} className="border-[#d1e8d5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Anggaran (Rp)</Label>
              <Input type="number" placeholder="0" value={form.anggaran} onChange={e => setForm(prev => ({ ...prev, anggaran: e.target.value }))} className="border-[#d1e8d5]" min={0} />
            </div>

            <Separator className="bg-[#EAF5EC]" />

            <div className="space-y-3">
              <div>
                <Label>Jadwal Pelaksanaan <span className="text-red-500">*</span></Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pilih tanggal pelaksanaan. Boleh lebih dari satu tanggal, termasuk dalam bulan yang sama.
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <DatePicker value={pickerValue} onChange={setPickerValue} placeholder="Pilih tanggal..." className="border-[#d1e8d5]" />
                </div>
                <Button type="button" onClick={() => addJadwal(pickerValue)} disabled={!pickerValue} variant="outline" className="border-[#52B788] text-[#1B6B35] hover:bg-[#EAF5EC] shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </div>
              {form.jadwal.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.jadwal.map(tanggal => (
                    <Badge key={tanggal} className="gap-1.5 rounded-full bg-[#1B6B35] pl-3 pr-1.5 py-1 text-sm text-white [a&]:hover:bg-[#1B6B35]">
                      <span>{formatTanggalPanjang(tanggal)}</span>
                      <button
                        type="button"
                        aria-label={`Hapus jadwal ${formatTanggalPanjang(tanggal)}`}
                        onClick={() => removeJadwal(tanggal)}
                        className="rounded-full p-0.5 transition-colors hover:bg-white/20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#d1e8d5] rounded-lg py-4 text-center text-sm text-gray-400">
                  Belum ada jadwal. Pilih tanggal lalu klik Tambah.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-[#d1e8d5]">Batal</Button>
          <Button type="submit" className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-1" /> {isEdit ? 'Simpan Perubahan' : 'Tambahkan Kegiatan'}</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
