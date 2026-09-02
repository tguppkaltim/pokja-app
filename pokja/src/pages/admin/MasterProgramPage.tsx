import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useData } from '@/contexts/data-context'
import {
  createProgramPokok, updateProgramPokok, deleteProgramPokok,
  createProgramUnggulan, updateProgramUnggulan, deleteProgramUnggulan,
  createProgramPrioritas, updateProgramPrioritas, deleteProgramPrioritas,
} from '@/lib/db'
import type { ProgramPokok, ProgramUnggulan, ProgramPrioritas } from '@/types'
import { toast } from 'sonner'

/**
 * Master program mengikuti format resmi TP PKK:
 *
 *   Bidang > Program Pokok > Program Unggulan > Program Prioritas
 *
 * Halaman ini menampilkan keempat lapis sekaligus karena isinya tidak banyak
 * (belasan program pokok, puluhan prioritas) dan pengurus perlu melihat
 * kaitannya, bukan tiap lapis secara terpisah.
 */

/** Dialog yang sedang terbuka. null berarti tertutup. */
type Editor =
  | { kind: 'pokok'; item: ProgramPokok | null; pokjaId: number }
  | { kind: 'unggulan'; item: ProgramUnggulan | null; pokokId: number }
  | { kind: 'prioritas'; item: ProgramPrioritas | null; unggulanId: number }

const JUDUL: Record<Editor['kind'], string> = {
  pokok: 'Program Pokok',
  unggulan: 'Program Unggulan',
  prioritas: 'Program Prioritas',
}

const ASAL_ITEMS = [
  { value: 'Pusat', label: 'Pusat' },
  { value: 'Daerah', label: 'Daerah' },
]

const formKosong = { name: '', indikator: '', sasaran: '', asal: 'Pusat', contoh_kegiatan: '' }

export default function MasterProgramPage() {
  const { pokja: pokjaList, programPokok, programUnggulan, programPrioritas, reload } = useData()
  const [filterPokja, setFilterPokja] = useState('all')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [form, setForm] = useState({ ...formKosong })
  const [isSaving, setIsSaving] = useState(false)

  const pokjaItems = pokjaList.map(p => ({ value: String(p.id), label: p.name }))
  const pokjaFilterItems = [{ value: 'all', label: 'Semua Bidang' }, ...pokjaItems]
  const bidangTampil = pokjaList.filter(p => filterPokja === 'all' || p.id === parseInt(filterPokja))

  const urut = <T extends { urutan: number; id: number }>(a: T, b: T) => a.urutan - b.urutan || a.id - b.id

  function buka(e: Editor) {
    if (e.item) {
      setForm({
        ...formKosong,
        name: e.item.name,
        ...(e.kind === 'pokok' ? { indikator: e.item.indikator, sasaran: e.item.sasaran } : {}),
        ...(e.kind === 'unggulan' ? { asal: e.item.asal } : {}),
        ...(e.kind === 'prioritas' ? { contoh_kegiatan: e.item.contoh_kegiatan } : {}),
      })
    } else {
      setForm({ ...formKosong })
    }
    setEditor(e)
  }

  async function simpan() {
    if (!editor) return
    if (!form.name.trim()) {
      toast.error(`Nama ${JUDUL[editor.kind]} wajib diisi.`)
      return
    }
    setIsSaving(true)
    try {
      if (editor.kind === 'pokok') {
        const data = { name: form.name.trim(), indikator: form.indikator, sasaran: form.sasaran }
        if (editor.item) await updateProgramPokok(editor.item.id, data)
        else await createProgramPokok({ ...data, pokja_id: editor.pokjaId })
      } else if (editor.kind === 'unggulan') {
        const data = { name: form.name.trim(), asal: form.asal }
        if (editor.item) await updateProgramUnggulan(editor.item.id, data)
        else await createProgramUnggulan({ ...data, program_pokok_id: editor.pokokId })
      } else {
        const data = { name: form.name.trim(), contoh_kegiatan: form.contoh_kegiatan }
        if (editor.item) await updateProgramPrioritas(editor.item.id, data)
        else await createProgramPrioritas({ ...data, program_unggulan_id: editor.unggulanId })
      }
      toast.success(`${JUDUL[editor.kind]} ${editor.item ? 'diperbarui' : 'ditambahkan'}.`)
      setEditor(null)
      reload()
    } catch {
      toast.error('Gagal menyimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function hapus(kind: Editor['kind'], id: number) {
    try {
      if (kind === 'pokok') await deleteProgramPokok(id)
      else if (kind === 'unggulan') await deleteProgramUnggulan(id)
      else await deleteProgramPrioritas(id)
      toast.success(`${JUDUL[kind]} dihapus.`)
      reload()
    } catch {
      toast.error(
        kind === 'pokok'
          ? 'Gagal menghapus. Pastikan tidak ada kegiatan yang memakai program ini.'
          : 'Gagal menghapus. Coba lagi.',
      )
    }
  }

  function TombolHapus({ kind, id, nama, ikutan }: { kind: Editor['kind']; id: number; nama: string; ikutan?: string }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger render={
          <Button variant="ghost" size="icon" aria-label={`Hapus ${JUDUL[kind]}`} className="size-7 text-red-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {JUDUL[kind]}?</AlertDialogTitle>
            <AlertDialogDescription>
              "{nama}" akan dihapus permanen{ikutan ? `, ${ikutan}` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(kind, id)}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">Master Program</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bidang › Program Pokok › Program Unggulan › Program Prioritas, mengikuti master TP PKK Kalimantan Timur.
        </p>
      </div>

      <Select items={pokjaFilterItems} value={filterPokja} onValueChange={v => v && setFilterPokja(v)}>
        <SelectTrigger className="w-52 border-[#d1e8d5]"><SelectValue placeholder="Filter Bidang" /></SelectTrigger>
        <SelectContent>
          {pokjaFilterItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-4">
        {bidangTampil.map(bidang => {
          const daftarPokok = programPokok.filter(p => p.pokja_id === bidang.id).sort(urut)
          return (
            <Card key={bidang.id} className="border-[#d1e8d5]">
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#1B6B35] text-white">{bidang.name}</Badge>
                    {bidang.nama_lengkap && bidang.nama_lengkap !== bidang.name && (
                      <span className="text-xs text-gray-500">{bidang.nama_lengkap}</span>
                    )}
                    <span className="text-xs text-gray-400">{daftarPokok.length} program pokok</span>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => buka({ kind: 'pokok', item: null, pokjaId: bidang.id })}
                    className="border-[#52B788] text-[#1B6B35] hover:bg-[#EAF5EC]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Program Pokok
                  </Button>
                </div>

                {daftarPokok.length === 0 && (
                  <p className="text-sm text-gray-400 py-3 text-center">Belum ada program pokok.</p>
                )}

                {daftarPokok.map(pokok => {
                  const daftarUnggulan = programUnggulan.filter(u => u.program_pokok_id === pokok.id).sort(urut)
                  return (
                    <div key={pokok.id} className="rounded-lg border border-[#EAF5EC] bg-[#F6FBF7] p-3 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2">
                          <span className="text-xs text-gray-400 pt-0.5 w-5 shrink-0 text-center">
                            {pokok.urutan || '–'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{pokok.name}</p>
                            {pokok.di_luar_master && (
                              <Badge
                                variant="outline"
                                title="Tidak ada di master resmi, tapi masih dipakai kegiatan lama."
                                className="mt-1 gap-1 border-amber-300 bg-amber-50 text-amber-700 text-[11px] font-normal"
                              >
                                <AlertTriangle className="w-3 h-3" /> Di luar master
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" aria-label="Ubah Program Pokok" onClick={() => buka({ kind: 'pokok', item: pokok, pokjaId: bidang.id })} className="size-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <TombolHapus kind="pokok" id={pokok.id} nama={pokok.name} ikutan="beserta seluruh program unggulan dan prioritas di bawahnya" />
                        </div>
                      </div>

                      {(pokok.indikator || pokok.sasaran) && (
                        <details className="text-xs text-gray-600 pl-7">
                          <summary className="cursor-pointer text-[#1B6B35]">Indikator &amp; sasaran</summary>
                          <div className="grid gap-3 pt-2 sm:grid-cols-2">
                            {pokok.indikator && (
                              <div>
                                <p className="font-medium text-gray-700">Indikator</p>
                                <p className="whitespace-pre-line text-gray-600">{pokok.indikator}</p>
                              </div>
                            )}
                            {pokok.sasaran && (
                              <div>
                                <p className="font-medium text-gray-700">Sasaran</p>
                                <p className="whitespace-pre-line text-gray-600">{pokok.sasaran}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      )}

                      <div className="pl-7 space-y-2">
                        {daftarUnggulan.map(unggulan => {
                          const daftarPrioritas = programPrioritas.filter(p => p.program_unggulan_id === unggulan.id).sort(urut)
                          return (
                            <div key={unggulan.id} className="rounded-md border border-[#d1e8d5] bg-white p-2.5 space-y-1.5">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex items-center gap-2">
                                  <p className="text-sm text-gray-700">{unggulan.name}</p>
                                  <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-[11px] font-normal">
                                    {unggulan.asal}
                                  </Badge>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <Button variant="ghost" size="icon" aria-label="Tambah Program Prioritas" onClick={() => buka({ kind: 'prioritas', item: null, unggulanId: unggulan.id })} className="size-7 text-[#1B6B35] hover:bg-[#EAF5EC]">
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" aria-label="Ubah Program Unggulan" onClick={() => buka({ kind: 'unggulan', item: unggulan, pokokId: pokok.id })} className="size-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <TombolHapus kind="unggulan" id={unggulan.id} nama={unggulan.name} ikutan="beserta seluruh program prioritas di bawahnya" />
                                </div>
                              </div>

                              {daftarPrioritas.length === 0 ? (
                                <p className="text-xs text-gray-400">Belum ada program prioritas.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {daftarPrioritas.map(prioritas => (
                                    <li key={prioritas.id} className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex items-start gap-1.5">
                                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-300 mt-0.5" />
                                        <div className="min-w-0">
                                          <p className="text-xs text-gray-700">{prioritas.name}</p>
                                          {prioritas.contoh_kegiatan && (
                                            <details className="text-[11px] text-gray-500">
                                              <summary className="cursor-pointer text-[#1B6B35]">Contoh kegiatan</summary>
                                              <p className="whitespace-pre-line pt-0.5">{prioritas.contoh_kegiatan}</p>
                                            </details>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 gap-1">
                                        <Button variant="ghost" size="icon" aria-label="Ubah Program Prioritas" onClick={() => buka({ kind: 'prioritas', item: prioritas, unggulanId: unggulan.id })} className="size-6 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        <TombolHapus kind="prioritas" id={prioritas.id} nama={prioritas.name} />
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}

                        <Button
                          variant="ghost" size="sm"
                          onClick={() => buka({ kind: 'unggulan', item: null, pokokId: pokok.id })}
                          className="h-7 text-xs text-[#1B6B35] hover:bg-[#EAF5EC]"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Program Unggulan
                        </Button>
                        {daftarUnggulan.length === 0 && (
                          <p className="text-xs text-amber-700">
                            Belum ada Program Unggulan, sehingga kegiatan di bawah program pokok ini
                            tidak punya Program Prioritas untuk dipilih.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={editor !== null} onOpenChange={terbuka => !terbuka && setEditor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1B6B35]">
              {editor?.item ? `Edit ${JUDUL[editor.kind]}` : `Tambah ${editor ? JUDUL[editor.kind] : ''}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="border-[#d1e8d5] min-h-16"
              />
            </div>

            {editor?.kind === 'pokok' && (
              <>
                <div className="space-y-1.5">
                  <Label>Indikator</Label>
                  <Textarea
                    value={form.indikator}
                    onChange={e => setForm(p => ({ ...p, indikator: e.target.value }))}
                    placeholder={'- Jumlah Kegiatan\n- Persentase Capaian'}
                    className="border-[#d1e8d5] min-h-24"
                  />
                  <p className="text-xs text-gray-400">Satu butir per baris. Baris dipertahankan saat ditampilkan.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Sasaran</Label>
                  <Textarea
                    value={form.sasaran}
                    onChange={e => setForm(p => ({ ...p, sasaran: e.target.value }))}
                    placeholder={'- Keluarga\n- Kader PKK'}
                    className="border-[#d1e8d5] min-h-24"
                  />
                </div>
              </>
            )}

            {editor?.kind === 'unggulan' && (
              <div className="space-y-1.5">
                <Label>Program Pusat / Daerah</Label>
                <Select items={ASAL_ITEMS} value={form.asal} onValueChange={v => v && setForm(p => ({ ...p, asal: v }))}>
                  <SelectTrigger className="border-[#d1e8d5]"><SelectValue placeholder="Pilih asal program" /></SelectTrigger>
                  <SelectContent>
                    {ASAL_ITEMS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editor?.kind === 'prioritas' && (
              <div className="space-y-1.5">
                <Label>Contoh Kegiatan</Label>
                <Textarea
                  value={form.contoh_kegiatan}
                  onChange={e => setForm(p => ({ ...p, contoh_kegiatan: e.target.value }))}
                  className="border-[#d1e8d5] min-h-24"
                />
                <p className="text-xs text-gray-400">
                  Acuan dari master, bukan kegiatan yang direncanakan. Rencana kegiatan tetap diisi lewat menu Rencana Kegiatan.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)} className="border-[#d1e8d5]">Batal</Button>
            <Button onClick={simpan} className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : editor?.item ? 'Simpan' : 'Tambahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
