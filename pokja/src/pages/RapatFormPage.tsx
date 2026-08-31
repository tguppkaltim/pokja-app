import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuth } from '@/contexts/auth-context'
import { fetchRapatById, createRapat, updateRapat } from '@/lib/db'
import { toTanggalLokal, dariTanggalLokal } from '@/lib/utils'
import { toast } from 'sonner'

export default function RapatFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [tanggal, setTanggal] = useState<Date | undefined>(new Date())
  const [judul, setJudul] = useState('')
  const [peserta, setPeserta] = useState('')
  const [ringkasan, setRingkasan] = useState('')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    let dibatalkan = false
    fetchRapatById(parseInt(id)).then(r => {
      if (dibatalkan || !r) return
      setTanggal(dariTanggalLokal(r.tanggal))
      setJudul(r.judul)
      setPeserta(r.peserta)
      setRingkasan(r.ringkasan)
    }).finally(() => { if (!dibatalkan) setIsLoading(false) })
    return () => { dibatalkan = true }
  }, [isEdit, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tanggal || !judul.trim()) {
      toast.error('Tanggal dan judul rapat wajib diisi.')
      return
    }
    if (!user) return

    setIsSaving(true)
    try {
      const payload = {
        tanggal: toTanggalLokal(tanggal),
        judul: judul.trim(),
        peserta: peserta.trim(),
        ringkasan: ringkasan.trim(),
        created_by: user.id,
      }
      if (isEdit && id) {
        await updateRapat(parseInt(id), payload)
        toast.success('Notulensi berhasil diperbarui.')
        navigate(`/notulensi/${id}`)
      } else {
        const dibuat = await createRapat(payload)
        toast.success('Notulensi berhasil ditambahkan.')
        navigate(`/notulensi/${dibuat.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat data...</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">{isEdit ? 'Edit Notulensi' : 'Notulensi Rapat Baru'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Catat pokok rapat. Tindak lanjutnya ditambahkan setelah notulensi tersimpan.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-[#d1e8d5]">
          <CardHeader>
            <CardTitle className="text-base text-[#1B6B35]">Informasi Rapat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tanggal Rapat <span className="text-red-500">*</span></Label>
              <DatePicker value={tanggal} onChange={setTanggal} placeholder="Pilih tanggal rapat..." className="border-[#d1e8d5]" />
            </div>

            <div className="space-y-1.5">
              <Label>Judul Rapat <span className="text-red-500">*</span></Label>
              <Input
                placeholder="mis: Rapat Koordinasi Pokja Triwulan III"
                value={judul}
                onChange={e => setJudul(e.target.value)}
                className="border-[#d1e8d5]"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Peserta</Label>
              <Textarea
                placeholder="Nama atau unit yang hadir, dipisahkan koma..."
                value={peserta}
                onChange={e => setPeserta(e.target.value)}
                className="border-[#d1e8d5] min-h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ringkasan / Notulensi</Label>
              <Textarea
                placeholder="Pokok bahasan, keputusan, dan catatan penting rapat..."
                value={ringkasan}
                onChange={e => setRingkasan(e.target.value)}
                className="border-[#d1e8d5] min-h-40"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" disabled={isSaving} className="bg-[#1B6B35] hover:bg-[#134D26]">
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Notulensi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
