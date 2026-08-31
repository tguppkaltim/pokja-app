import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2, CalendarDays, Users, AlertTriangle, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import {
  fetchRapatById, fetchTindakLanjut, createTindakLanjut, updateTindakLanjut,
  deleteTindakLanjut, deleteRapat, uploadFotoTindakLanjut, getFotoUrl,
} from '@/lib/db'
import { formatTanggalPanjang, toTanggalLokal, dariTanggalLokal } from '@/lib/utils'
import {
  STATUS_LABEL, STATUS_BADGE, STATUS_ITEMS, terlambat, labelPic,
  picItems, picKeValue, valueKePic, bolehUbah, PIC_SEKRETARIAT,
} from '@/lib/tindak-lanjut'
import type { Rapat, TindakLanjut, StatusTindakLanjut } from '@/types'
import { toast } from 'sonner'

const MAKS_FOTO = 5 * 1024 * 1024
const TIPE_FOTO = ['.jpg', '.jpeg', '.png', '.webp']

const formKosong = {
  uraian: '',
  picValue: PIC_SEKRETARIAT,
  target: undefined as Date | undefined,
  status: 'open' as StatusTindakLanjut,
  keterangan: '',
}

export default function RapatDetailPage() {
  const { user } = useAuth()
  const { pokja: pokjaList } = useData()
  const navigate = useNavigate()
  const { id } = useParams()

  const [rapat, setRapat] = useState<Rapat | null>(null)
  const [daftar, setDaftar] = useState<TindakLanjut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogTerbuka, setDialogTerbuka] = useState(false)
  const [editing, setEditing] = useState<TindakLanjut | null>(null)
  const [form, setForm] = useState({ ...formKosong })
  const [foto, setFoto] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const bolehKelola = user?.role === 'super_admin' || user?.role === 'sekretariat'

  useEffect(() => {
    if (!id) return
    const rapatId = parseInt(id)
    let dibatalkan = false
    Promise.all([fetchRapatById(rapatId), fetchTindakLanjut({ rapatId })])
      .then(([r, t]) => { if (!dibatalkan) { setRapat(r); setDaftar(t) } })
      .finally(() => { if (!dibatalkan) setIsLoading(false) })
    return () => { dibatalkan = true }
  }, [id])

  async function muatUlang() {
    if (!id) return
    setDaftar(await fetchTindakLanjut({ rapatId: parseInt(id) }))
  }

  function bukaTambah() {
    setEditing(null)
    setForm({ ...formKosong })
    setFoto(null)
    setDialogTerbuka(true)
  }

  function bukaEdit(t: TindakLanjut) {
    setEditing(t)
    setForm({
      uraian: t.uraian,
      picValue: picKeValue(t),
      target: t.target_closed ? dariTanggalLokal(t.target_closed) : undefined,
      status: t.status,
      keterangan: t.keterangan,
    })
    setFoto(null)
    setDialogTerbuka(true)
  }

  function pilihFoto(f: File | null) {
    if (!f) { setFoto(null); return }
    const ekstensi = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!TIPE_FOTO.includes(ekstensi)) { toast.error('Format foto harus JPG, PNG, atau WEBP.'); return }
    if (f.size > MAKS_FOTO) { toast.error('Ukuran foto maksimum 5 MB.'); return }
    setFoto(f)
  }

  async function simpan() {
    if (!form.uraian.trim()) { toast.error('Uraian tindak lanjut wajib diisi.'); return }
    if (!id) return

    setIsSaving(true)
    try {
      const dasar = {
        ...valueKePic(form.picValue),
        uraian: form.uraian.trim(),
        target_closed: form.target ? toTanggalLokal(form.target) : null,
        status: form.status,
        keterangan: form.keterangan.trim(),
      }

      let tindakLanjutId: number
      if (editing) {
        await updateTindakLanjut(editing.id, dasar)
        tindakLanjutId = editing.id
      } else {
        const dibuat = await createTindakLanjut({
          rapat_id: parseInt(id),
          open_date: toTanggalLokal(new Date()),
          closed_date: null,
          foto_path: null,
          ...dasar,
        })
        tindakLanjutId = dibuat.id
      }

      // Foto diunggah setelah barisnya ada, karena path memuat id-nya.
      if (foto) {
        const path = await uploadFotoTindakLanjut(foto, tindakLanjutId)
        await updateTindakLanjut(tindakLanjutId, { foto_path: path })
      }

      toast.success(editing ? 'Tindak lanjut diperbarui.' : 'Tindak lanjut ditambahkan.')
      setDialogTerbuka(false)
      await muatUlang()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan tindak lanjut.')
    } finally {
      setIsSaving(false)
    }
  }

  async function hapus(t: TindakLanjut) {
    try {
      await deleteTindakLanjut(t.id)
      toast.success('Tindak lanjut dihapus.')
      await muatUlang()
    } catch {
      toast.error('Gagal menghapus tindak lanjut.')
    }
  }

  async function hapusRapat() {
    if (!id) return
    try {
      await deleteRapat(parseInt(id))
      toast.success('Notulensi dihapus.')
      navigate('/notulensi')
    } catch {
      toast.error('Gagal menghapus notulensi.')
    }
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat notulensi...</div>
  if (!rapat) return <div className="py-20 text-center text-gray-400">Notulensi tidak ditemukan.</div>

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/notulensi')} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        {bolehKelola && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/notulensi/${rapat.id}/edit`)} className="border-[#52B788] text-[#1B6B35] hover:bg-[#EAF5EC]">
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={
                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" /> Hapus
                </Button>
              } />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus notulensi ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{rapat.judul}" akan dihapus beserta <strong>{daftar.length} tindak lanjut</strong> di dalamnya.
                    Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={hapusRapat}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card className="border-[#d1e8d5]">
        <CardContent className="pt-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatTanggalPanjang(rapat.tanggal)}
            </div>
            <h1 className="text-xl font-bold text-gray-800">{rapat.judul}</h1>
          </div>

          {rapat.peserta && (
            <div className="flex items-start gap-2 text-sm">
              <Users className="w-4 h-4 text-[#2E8B57] mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Peserta</p>
                <p className="text-gray-700 whitespace-pre-wrap">{rapat.peserta}</p>
              </div>
            </div>
          )}

          {rapat.ringkasan && (
            <>
              <Separator className="bg-[#EAF5EC]" />
              <div>
                <p className="text-gray-400 text-xs mb-1">Ringkasan</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{rapat.ringkasan}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base text-[#1B6B35]">Tindak Lanjut ({daftar.length})</CardTitle>
            {bolehKelola && (
              <Button size="sm" onClick={bukaTambah} className="bg-[#1B6B35] hover:bg-[#134D26]">
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {daftar.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada tindak lanjut pada rapat ini.</p>
          )}

          {daftar.map(t => {
            const lewat = terlambat(t)
            const dapatDiubah = bolehUbah(t, user)
            return (
              <div key={t.id} className="border border-[#d1e8d5] rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 flex-1">{t.uraian}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={`text-xs ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</Badge>
                    {dapatDiubah && (
                      <Button variant="ghost" size="xs" onClick={() => bukaEdit(t)} className="text-[#1B6B35] hover:bg-[#EAF5EC]">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                    {bolehKelola && (
                      <AlertDialog>
                        <AlertDialogTrigger render={
                          <Button variant="ghost" size="xs" className="text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        } />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus tindak lanjut?</AlertDialogTitle>
                            <AlertDialogDescription>"{t.uraian}" akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(t)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="border-[#52B788] text-[#2E8B57]">{labelPic(t, pokjaList)}</Badge>
                  <span className="text-gray-400">Open {formatTanggalPanjang(t.open_date)}</span>
                  {t.target_closed && (
                    <span className={lewat ? 'text-red-600 font-medium' : 'text-gray-400'}>
                      Target {formatTanggalPanjang(t.target_closed)}
                    </span>
                  )}
                  {t.closed_date && <span className="text-green-600">Selesai {formatTanggalPanjang(t.closed_date)}</span>}
                  {lewat && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Terlambat
                    </Badge>
                  )}
                </div>

                {t.keterangan && <p className="text-xs text-gray-600 bg-[#F6FBF7] rounded px-3 py-2">{t.keterangan}</p>}

                {t.foto_path && (
                  <a href={getFotoUrl(t.foto_path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#2E8B57] hover:underline">
                    <ImageIcon className="w-3.5 h-3.5" /> Lihat foto bukti
                  </a>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={dialogTerbuka} onOpenChange={setDialogTerbuka}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1B6B35]">
              {editing ? 'Ubah Tindak Lanjut' : 'Tambah Tindak Lanjut'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Uraian <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Apa yang harus ditindaklanjuti..."
                value={form.uraian}
                onChange={e => setForm(p => ({ ...p, uraian: e.target.value }))}
                className="border-[#d1e8d5] min-h-20"
                disabled={!bolehKelola && editing !== null}
              />
              {!bolehKelola && editing && (
                <p className="text-xs text-gray-400">Uraian dan PIC hanya bisa diubah Sekretariat atau Super Admin.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>PIC <span className="text-red-500">*</span></Label>
                <Select
                  items={picItems(pokjaList)}
                  value={form.picValue}
                  onValueChange={v => v && setForm(p => ({ ...p, picValue: v }))}
                  disabled={!bolehKelola && editing !== null}
                >
                  <SelectTrigger className="border-[#d1e8d5]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {picItems(pokjaList).map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Target Closed</Label>
                <DatePicker
                  value={form.target}
                  onChange={d => setForm(p => ({ ...p, target: d }))}
                  placeholder="Opsional..."
                  className="border-[#d1e8d5]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select items={STATUS_ITEMS} value={form.status} onValueChange={v => v && setForm(p => ({ ...p, status: v as StatusTindakLanjut }))}>
                <SelectTrigger className="border-[#d1e8d5]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Tanggal selesai terisi otomatis saat status jadi Closed.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={form.keterangan}
                onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))}
                className="border-[#d1e8d5] min-h-16"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Foto Bukti <span className="text-xs font-normal text-gray-400">(opsional)</span></Label>
              {foto ? (
                <div className="flex items-center gap-3 bg-[#F6FBF7] border border-[#d1e8d5] rounded-lg px-3 py-2">
                  <ImageIcon className="w-4 h-4 text-[#2E8B57] shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{foto.name}</span>
                  <span className="text-xs text-gray-400">{(foto.size / 1024).toFixed(0)} KB</span>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Hapus foto" onClick={() => setFoto(null)} className="text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-[#52B788] rounded-lg cursor-pointer hover:bg-[#EAF5EC]/50 transition-colors">
                  <span className="text-sm text-[#2E8B57]">Pilih foto — JPG, PNG, WEBP. Maks 5 MB.</span>
                  <input
                    type="file"
                    className="hidden"
                    accept={TIPE_FOTO.join(',')}
                    onChange={e => { pilihFoto(e.target.files?.[0] ?? null); e.target.value = '' }}
                  />
                </label>
              )}
              {editing?.foto_path && !foto && (
                <p className="text-xs text-gray-400">
                  Sudah ada foto tersimpan. Memilih foto baru akan menambahkannya, tidak menimpa yang lama.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTerbuka(false)}>Batal</Button>
            <Button onClick={simpan} disabled={isSaving} className="bg-[#1B6B35] hover:bg-[#134D26]">
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
