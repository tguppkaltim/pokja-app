import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useData } from '@/contexts/data-context'
import { createMitra, updateMitra, deleteMitra } from '@/lib/db'
import { LABEL_KATEGORI_MITRA, TINGKAT_MITRA, labelKategori } from '@/lib/mitra'
import type { Mitra } from '@/types'
import { toast } from 'sonner'

const formKosong = { nama: '', singkatan: '', kategori: '', tingkat: '', aktif: true }

// Base UI butuh `items` agar trigger menampilkan label, bukan nilai mentahnya.
const ITEM_KATEGORI = Object.entries(LABEL_KATEGORI_MITRA).map(([value, label]) => ({ value, label }))
const ITEM_TINGKAT = TINGKAT_MITRA.map(t => ({ value: t, label: t }))
// '—' dipakai sebagai nilai "belum ditentukan": Base UI memperlakukan string
// kosong sebagai tidak-ada-pilihan, sehingga opsinya tidak bisa dipilih ulang.
const KOSONG = '—'
const ITEM_KATEGORI_FORM = [{ value: KOSONG, label: 'Belum ditentukan' }, ...ITEM_KATEGORI]
const ITEM_TINGKAT_FORM = [{ value: KOSONG, label: 'Belum ditentukan' }, ...ITEM_TINGKAT]
const ITEM_FILTER = [{ value: 'all', label: 'Semua kategori' }, ...ITEM_KATEGORI]

export default function MasterMitraPage() {
  const { mitra, reload } = useData()
  const [cari, setCari] = useState('')
  const [filterKategori, setFilterKategori] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<Mitra | null>(null)
  const [form, setForm] = useState({ ...formKosong })
  const [isSaving, setIsSaving] = useState(false)

  const terlihat = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return mitra.filter(m => {
      if (filterKategori !== 'all' && m.kategori !== filterKategori) return false
      if (!q) return true
      return m.nama.toLowerCase().includes(q) || m.singkatan.toLowerCase().includes(q)
    })
  }, [mitra, cari, filterKategori])

  const jumlahAktif = mitra.filter(m => m.aktif).length

  function bukaTambah() {
    setEditItem(null)
    setForm({ ...formKosong })
    setIsOpen(true)
  }

  function bukaUbah(m: Mitra) {
    setEditItem(m)
    setForm({
      nama: m.nama,
      singkatan: m.singkatan,
      kategori: m.kategori || KOSONG,
      tingkat: m.tingkat || KOSONG,
      aktif: m.aktif,
    })
    setIsOpen(true)
  }

  async function simpan() {
    if (!form.nama.trim()) {
      toast.error('Nama mitra wajib diisi.')
      return
    }
    setIsSaving(true)
    try {
      const data = {
        nama: form.nama.trim(),
        singkatan: form.singkatan.trim(),
        // KOSONG hanya penanda di antarmuka; yang disimpan tetap string kosong.
        kategori: form.kategori === KOSONG ? '' : form.kategori,
        tingkat: form.tingkat === KOSONG ? '' : form.tingkat,
        aktif: form.aktif,
      }
      if (editItem) await updateMitra(editItem.id, data)
      else await createMitra(data)
      toast.success(`Mitra ${editItem ? 'diperbarui' : 'ditambahkan'}.`)
      setIsOpen(false)
      reload()
    } catch (err) {
      // Nama dibuat unique di basis data; bentrok punya pesan sendiri karena
      // "gagal menyimpan" tidak memberi tahu apa yang harus diperbaiki.
      const pesan = err instanceof Error && err.message.includes('duplicate key')
        ? `"${form.nama.trim()}" sudah ada di daftar mitra.`
        : 'Gagal menyimpan. Coba lagi.'
      toast.error(pesan)
    } finally {
      setIsSaving(false)
    }
  }

  async function hapus(m: Mitra) {
    try {
      await deleteMitra(m.id)
      toast.success(`"${m.nama}" dihapus.`)
      reload()
    } catch {
      // Kaitan ke kegiatan memakai on delete restrict, jadi ini jalur yang
      // wajar ditempuh — bukan galat tak terduga. Sarankan menonaktifkan.
      toast.error(
        `"${m.nama}" masih dipakai oleh kegiatan, jadi tidak bisa dihapus. ` +
        'Nonaktifkan saja lewat Edit agar tidak lagi muncul sebagai pilihan.',
      )
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-pkk">Master Mitra / OPD</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar OPD dan mitra yang menggandeng kegiatan TP PKK.
          </p>
        </div>
        <Button onClick={bukaTambah} className="bg-pkk transisi-warna hover:bg-pkk-hover">
          <Plus className="mr-1 h-4 w-4" /> Tambah Mitra
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={cari}
            onChange={e => setCari(e.target.value)}
            placeholder="Cari nama atau singkatan..."
            className="border-pkk-border pl-9"
          />
        </div>
        <Select items={ITEM_FILTER} value={filterKategori} onValueChange={v => v && setFilterKategori(v)}>
          <SelectTrigger className="border-pkk-border sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ITEM_FILTER.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-pkk-border">
        <CardContent className="p-0">
          {mitra.length === 0 ? (
            // Sejak migrasi 020 daftar ini terisi 102 mitra dari Rencana Program
            // TP PKK Kaltim, jadi keadaan kosong berarti migrasinya belum
            // dijalankan. Halaman kosong tanpa penjelasan terbaca seperti
            // kerusakan, jadi keadaannya dinyatakan.
            <div className="px-6 py-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-pkk-soft" />
              <p className="mt-3 font-medium text-gray-700">Daftar mitra masih kosong</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                Daftar resmi mitra TP PKK Kaltim biasanya sudah terisi dari awal. Kalau
                halaman ini kosong, migrasi 020 belum dijalankan — tambahkan manual di
                bawah ini bila memang perlu.
              </p>
              <Button onClick={bukaTambah} className="mt-4 bg-pkk transisi-warna hover:bg-pkk-hover">
                <Plus className="mr-1 h-4 w-4" /> Tambah Mitra Pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 text-sm text-gray-500">
                Menampilkan <span className="font-semibold text-pkk">{terlihat.length}</span> mitra
                {jumlahAktif < mitra.length && ` — ${mitra.length - jumlahAktif} nonaktif`}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-pkk-tint bg-pkk hover:bg-pkk">
                    <TableHead className="px-4 text-xs text-white">Nama Mitra / OPD</TableHead>
                    <TableHead className="px-4 text-xs text-white">Singkatan</TableHead>
                    <TableHead className="px-4 text-xs text-white">Kategori</TableHead>
                    <TableHead className="px-4 text-xs text-white">Tingkat</TableHead>
                    <TableHead className="px-4 text-center text-xs text-white">Status</TableHead>
                    <TableHead className="px-4 text-center text-xs text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terlihat.map(m => (
                    <TableRow key={m.id} className="border-pkk-tint">
                      <TableCell className="px-4 py-3 font-medium text-gray-800">{m.nama}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500">{m.singkatan || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500">{labelKategori(m.kategori)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500">{m.tingkat || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {m.aktif
                          ? <Badge className="bg-status-success-tint text-status-success">Aktif</Badge>
                          : <Badge className="bg-gray-100 text-gray-500">Nonaktif</Badge>}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost" size="icon" aria-label={`Ubah ${m.nama}`}
                            onClick={() => bukaUbah(m)}
                            className="text-pkk transisi-warna hover:bg-pkk-tint hover:text-pkk-hover"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger render={
                              <Button variant="ghost" size="icon" aria-label={`Hapus ${m.nama}`} className="text-red-500 transisi-warna hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            } />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus {m.nama}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Mitra yang sudah dipakai kegiatan tidak bisa dihapus. Kalau hanya
                                  ingin menghentikan kerja sama, nonaktifkan lewat Edit — kegiatan
                                  lama tetap menyebut namanya.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(m)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {terlihat.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                        Tidak ada mitra yang cocok dengan penyaringan ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-pkk">{editItem ? 'Edit Mitra' : 'Tambah Mitra'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Mitra / OPD <span className="text-red-500">*</span></Label>
              <Input
                value={form.nama}
                onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
                placeholder="mis: Dinas Kesehatan Provinsi Kalimantan Timur"
                className="border-pkk-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Singkatan</Label>
              <Input
                value={form.singkatan}
                onChange={e => setForm(p => ({ ...p, singkatan: e.target.value }))}
                placeholder="mis: Dinkes Kaltim"
                className="border-pkk-border"
              />
              <p className="text-xs text-gray-400">
                Dipakai di tabel yang sempit. Nama panjangnya tetap tersimpan utuh untuk laporan.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select
                  items={ITEM_KATEGORI_FORM}
                  value={form.kategori || KOSONG}
                  onValueChange={v => v && setForm(p => ({ ...p, kategori: v }))}
                >
                  <SelectTrigger className="border-pkk-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_KATEGORI_FORM.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tingkat</Label>
                <Select
                  items={ITEM_TINGKAT_FORM}
                  value={form.tingkat || KOSONG}
                  onValueChange={v => v && setForm(p => ({ ...p, tingkat: v }))}
                >
                  <SelectTrigger className="border-pkk-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_TINGKAT_FORM.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-start gap-2.5 rounded-lg border border-pkk-border bg-pkk-surface px-3 py-2.5">
              <Checkbox
                checked={form.aktif}
                onCheckedChange={v => setForm(p => ({ ...p, aktif: v === true }))}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium text-gray-700">Aktif</span>
                <span className="block text-xs text-gray-500">
                  Hanya mitra aktif yang muncul sebagai pilihan pada kegiatan baru.
                  Kaitan yang sudah ada tidak terpengaruh.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-pkk-border">Batal</Button>
            <Button onClick={simpan} className="bg-pkk transisi-warna hover:bg-pkk-hover" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
