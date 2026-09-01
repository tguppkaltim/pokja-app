import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2, CalendarDays, Users, AlertTriangle, ImageIcon } from 'lucide-react'
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
  deleteTindakLanjut, deleteRapat, getFotoUrl, fetchProgres, tambahProgres,
} from '@/lib/db'
import { ProgresDialog } from '@/components/progres-dialog'
import { formatTanggalPanjang, toTanggalLokal, dariTanggalLokal } from '@/lib/utils'
import {
  STATUS_LABEL, STATUS_BADGE, terlambat, labelPic,
  picItems, picKeValue, valueKePic, bolehUbah, PIC_SEKRETARIAT,
} from '@/lib/tindak-lanjut'
import type { Rapat, TindakLanjut, ProgresTindakLanjut } from '@/types'
import { toast } from 'sonner'

// Status dan foto sengaja tidak ada di sini: keduanya hanya berubah lewat
// entri progres, supaya tidak ada perubahan status yang lolos tanpa riwayat.
const formKosong = {
  uraian: '',
  picValue: PIC_SEKRETARIAT,
  target: undefined as Date | undefined,
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
  const [isSaving, setIsSaving] = useState(false)
  const [progres, setProgres] = useState<ProgresTindakLanjut[]>([])
  const [progresUntuk, setProgresUntuk] = useState<TindakLanjut | null>(null)

  const bolehKelola = user?.role === 'super_admin' || user?.role === 'sekretariat'

  useEffect(() => {
    if (!id) return
    const rapatId = parseInt(id)
    let dibatalkan = false
    Promise.all([fetchRapatById(rapatId), fetchTindakLanjut({ rapatId }), fetchProgres()])
      .then(([r, t, p]) => { if (!dibatalkan) { setRapat(r); setDaftar(t); setProgres(p) } })
      .finally(() => { if (!dibatalkan) setIsLoading(false) })
    return () => { dibatalkan = true }
  }, [id])

  async function muatUlang() {
    if (!id) return
    const [t, p] = await Promise.all([fetchTindakLanjut({ rapatId: parseInt(id) }), fetchProgres()])
    setDaftar(t)
    setProgres(p)
  }

  function bukaTambah() {
    setEditing(null)
    setForm({ ...formKosong })
    setDialogTerbuka(true)
  }

  function bukaEdit(t: TindakLanjut) {
    setEditing(t)
    setForm({
      uraian: t.uraian,
      picValue: picKeValue(t),
      target: t.target_closed ? dariTanggalLokal(t.target_closed) : undefined,
      keterangan: t.keterangan,
    })
    setDialogTerbuka(true)
  }



  async function simpan() {
    if (!form.uraian.trim()) { toast.error('Uraian tindak lanjut wajib diisi.'); return }
    if (!id || !user) return

    setIsSaving(true)
    try {
      const definisi = {
        ...valueKePic(form.picValue),
        uraian: form.uraian.trim(),
        target_closed: form.target ? toTanggalLokal(form.target) : null,
        keterangan: form.keterangan.trim(),
      }

      if (editing) {
        await updateTindakLanjut(editing.id, definisi)
      } else {
        const dibuat = await createTindakLanjut({
          rapat_id: parseInt(id),
          open_date: toTanggalLokal(new Date()),
          status: 'open',
          closed_date: null,
          ...definisi,
        })
        // Entri pembuka supaya riwayatnya tidak kosong sejak awal.
        await tambahProgres({
          tindak_lanjut_id: dibuat.id,
          status_baru: 'open',
          catatan: 'Tindak lanjut dibuat.',
          foto_path: null,
          dibuat_oleh: user.id,
        })
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

                <RiwayatProgres
                  entri={progres.filter(p => p.tindak_lanjut_id === t.id)}
                  bolehTambah={dapatDiubah}
                  onTambah={() => setProgresUntuk(t)}
                />
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
              <Label>Keterangan</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={form.keterangan}
                onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))}
                className="border-[#d1e8d5] min-h-16"
              />
              <p className="text-xs text-gray-400">
                Status dan foto bukti diisi lewat Tambah Progress, supaya perubahannya tercatat di riwayat.
              </p>
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

      {progresUntuk && (
        <ProgresDialog
          key={progresUntuk.id}
          tindakLanjut={progresUntuk}
          userId={user?.id ?? ''}
          onTutup={() => setProgresUntuk(null)}
          onSaved={muatUlang}
        />
      )}
    </div>
  )
}

function RiwayatProgres({
  entri,
  bolehTambah,
  onTambah,
}: {
  entri: ProgresTindakLanjut[]
  bolehTambah: boolean
  onTambah: () => void
}) {
  return (
    <div className="border-t border-[#EAF5EC] pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">Riwayat Progress ({entri.length})</p>
        {bolehTambah && (
          <Button variant="ghost" size="xs" onClick={onTambah} className="text-[#1B6B35] hover:bg-[#EAF5EC]">
            <Plus className="w-3 h-3 mr-1" /> Tambah Progress
          </Button>
        )}
      </div>

      {entri.length === 0 && <p className="text-xs text-gray-400">Belum ada catatan progress.</p>}

      <ol className="space-y-2">
        {entri.map(e => (
          <li key={e.id} className="relative pl-4 text-xs">
            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-[#52B788]" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-400">
                {new Date(e.created_at).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <Badge className={`text-xs ${STATUS_BADGE[e.status_baru]}`}>{STATUS_LABEL[e.status_baru]}</Badge>
            </div>
            {e.catatan && <p className="text-gray-600 mt-0.5">{e.catatan}</p>}
            {e.foto_path && <TautanFoto path={e.foto_path} />}
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * URL bertanda tangan hanya bisa didapat secara asinkron, sedangkan popup
 * blocker menolak window.open yang dipanggil setelah await. Jadi tabnya dibuka
 * lebih dulu saat klik, baru diarahkan ketika URL-nya siap.
 */
function TautanFoto({ path }: { path: string }) {
  const [membuka, setMembuka] = useState(false)

  async function buka() {
    setMembuka(true)
    const tab = window.open('', '_blank')
    try {
      const url = await getFotoUrl(path)
      if (tab) tab.location.href = url
    } catch {
      tab?.close()
      toast.error('Gagal membuka foto.')
    } finally {
      setMembuka(false)
    }
  }

  return (
    <button
      type="button"
      onClick={buka}
      disabled={membuka}
      className="inline-flex items-center gap-1 text-[#2E8B57] hover:underline mt-0.5 disabled:opacity-50"
    >
      <ImageIcon className="w-3 h-3" /> {membuka ? 'Membuka...' : 'Lihat foto'}
    </button>
  )
}
