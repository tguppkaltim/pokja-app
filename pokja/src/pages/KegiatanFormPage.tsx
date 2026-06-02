import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { MonthYearPicker, type MonthYear } from '@/components/ui/month-year-picker'
import { useAuth } from '@/contexts/AuthContext'
import { mockKegiatan, mockPokja, mockProgramPokok, SCHED_KEYS } from '@/data/mockData'
import { toast } from 'sonner'

const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const emptyForm = {
  pokja_id: '',
  program_pokok_id: '',
  nama_kegiatan: '',
  sasaran: '',
  pelaksana: '',
  anggaran: '',
  jadwal: [] as MonthYear[], // array of {month, year}
}

function monthYearKey(my: MonthYear) {
  return `${my.year}-${String(my.month).padStart(2, '0')}`
}

function compareMonthYear(a: MonthYear, b: MonthYear) {
  return a.year !== b.year ? a.year - b.year : a.month - b.month
}

export default function KegiatanFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...emptyForm })
  const [pickerValue, setPickerValue] = useState<MonthYear | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      const existing = mockKegiatan.find(k => k.id === parseInt(id))
      if (existing) {
        const jadwal: MonthYear[] = SCHED_KEYS
          .map((key, idx) => existing[key] ? { month: idx + 1, year: existing.tahun } : null)
          .filter(Boolean) as MonthYear[]
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
    } else if (user?.role === 'operator' && user.pokja_id) {
      setForm(prev => ({ ...prev, pokja_id: String(user.pokja_id) }))
    }
  }, [isEdit, id, user])

  const filteredProgram = mockProgramPokok.filter(
    p => form.pokja_id ? p.pokja_id === parseInt(form.pokja_id) : true
  )

  const pokjaOptions = user?.role === 'operator' && user.pokja_id
    ? mockPokja.filter(p => p.id === user.pokja_id)
    : mockPokja

  function addJadwal(my: MonthYear | undefined) {
    if (!my) return
    const exists = form.jadwal.some(j => j.month === my.month && j.year === my.year)
    if (exists) {
      toast.info(`${BULAN_FULL[my.month - 1]} ${my.year} sudah ada dalam jadwal.`)
      setPickerValue(undefined)
      return
    }
    setForm(prev => ({
      ...prev,
      jadwal: [...prev.jadwal, my].sort(compareMonthYear),
    }))
    setPickerValue(undefined)
  }

  function removeJadwal(my: MonthYear) {
    setForm(prev => ({
      ...prev,
      jadwal: prev.jadwal.filter(j => !(j.month === my.month && j.year === my.year)),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pokja_id || !form.program_pokok_id || !form.nama_kegiatan) {
      toast.error('Pokja, Program Pokok, dan Nama Kegiatan wajib diisi.')
      return
    }
    if (form.jadwal.length === 0) {
      toast.error('Tambahkan minimal satu jadwal pelaksanaan.')
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success(isEdit ? 'Kegiatan berhasil diperbarui.' : 'Kegiatan berhasil ditambahkan.')
    setIsLoading(false)
    navigate('/kegiatan')
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">
          {isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? 'Perbarui data rencana kegiatan.' : 'Input rencana kegiatan ke dalam POA.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-[#d1e8d5]">
          <CardHeader>
            <CardTitle className="text-base text-[#1B6B35]">Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Pokja & Program Pokok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Pokja <span className="text-red-500">*</span></Label>
                <Select
                  value={form.pokja_id}
                  onValueChange={v => v && setForm(prev => ({ ...prev, pokja_id: v, program_pokok_id: '' }))}
                  disabled={user?.role === 'operator'}
                >
                  <SelectTrigger className="border-[#d1e8d5]">
                    <SelectValue placeholder="Pilih Pokja" />
                  </SelectTrigger>
                  <SelectContent>
                    {pokjaOptions.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Program Pokok <span className="text-red-500">*</span></Label>
                <Select
                  value={form.program_pokok_id}
                  onValueChange={v => v && setForm(prev => ({ ...prev, program_pokok_id: v }))}
                >
                  <SelectTrigger className="border-[#d1e8d5]">
                    <SelectValue placeholder="Pilih Program Pokok" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProgram.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nama Kegiatan */}
            <div className="space-y-1.5">
              <Label>Nama Kegiatan <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Deskripsikan kegiatan secara singkat dan jelas..."
                value={form.nama_kegiatan}
                onChange={e => setForm(prev => ({ ...prev, nama_kegiatan: e.target.value }))}
                className="border-[#d1e8d5] min-h-20"
              />
            </div>

            {/* Sasaran & Pelaksana */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sasaran</Label>
                <Input
                  placeholder="Target peserta/penerima manfaat"
                  value={form.sasaran}
                  onChange={e => setForm(prev => ({ ...prev, sasaran: e.target.value }))}
                  className="border-[#d1e8d5]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pelaksana</Label>
                <Input
                  placeholder="Penanggung jawab pelaksanaan"
                  value={form.pelaksana}
                  onChange={e => setForm(prev => ({ ...prev, pelaksana: e.target.value }))}
                  className="border-[#d1e8d5]"
                />
              </div>
            </div>

            {/* Anggaran */}
            <div className="space-y-1.5">
              <Label>Anggaran (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.anggaran}
                onChange={e => setForm(prev => ({ ...prev, anggaran: e.target.value }))}
                className="border-[#d1e8d5]"
                min={0}
              />
            </div>

            <Separator className="bg-[#EAF5EC]" />

            {/* Jadwal Pelaksanaan — Month+Year Picker */}
            <div className="space-y-3">
              <div>
                <Label>Jadwal Pelaksanaan <span className="text-red-500">*</span></Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pilih bulan dan tahun ketika kegiatan akan dilaksanakan. Bisa lebih dari satu.
                </p>
              </div>

              {/* Picker + tombol tambah */}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <MonthYearPicker
                    value={pickerValue}
                    onChange={setPickerValue}
                    placeholder="Pilih bulan & tahun..."
                    className="border-[#d1e8d5]"
                    minYear={2024}
                    maxYear={2030}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => addJadwal(pickerValue)}
                  disabled={!pickerValue}
                  variant="outline"
                  className="border-[#52B788] text-[#1B6B35] hover:bg-[#EAF5EC] shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </div>

              {/* Chips jadwal terpilih */}
              {form.jadwal.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.jadwal.map(my => (
                    <div
                      key={monthYearKey(my)}
                      className="flex items-center gap-1.5 bg-[#1B6B35] text-white text-sm pl-3 pr-2 py-1 rounded-full"
                    >
                      <span>{BULAN_FULL[my.month - 1]} {my.year}</span>
                      <button
                        type="button"
                        onClick={() => removeJadwal(my)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        title="Hapus jadwal ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#d1e8d5] rounded-lg py-4 text-center text-sm text-gray-400">
                  Belum ada jadwal. Pilih bulan & tahun lalu klik Tambah.
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-[#d1e8d5]">
            Batal
          </Button>
          <Button type="submit" className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : (
              <><Save className="w-4 h-4 mr-1" /> {isEdit ? 'Simpan Perubahan' : 'Tambahkan Kegiatan'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
