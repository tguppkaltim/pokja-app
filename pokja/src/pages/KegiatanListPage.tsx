import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { fetchKegiatan, deleteKegiatan, fetchJadwal, fetchKegiatanMitra } from '@/lib/db'
import type { Kegiatan, JadwalKegiatan, KegiatanMitra } from '@/types'

import { formatTanggalPendek } from '@/lib/utils'
import { jalurPrioritas } from '@/lib/master-program'
import { toast } from 'sonner'
import { BadgePeringatan } from '@/components/badge-status'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function KegiatanListPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok, programUnggulan, programPrioritas, mitra: daftarMitra } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterPokja, setFilterPokja] = useState<string>(
    user?.role === 'operator' && user.pokja_id ? String(user.pokja_id) : 'all'
  )
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()))
  const [allKegiatan, setAllKegiatan] = useState<Kegiatan[]>([])
  const [allJadwal, setAllJadwal] = useState<JadwalKegiatan[]>([])
  const [kaitanMitra, setKaitanMitra] = useState<KegiatanMitra[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const opts = user?.role === 'operator' && user.pokja_id ? { pokjaId: user.pokja_id } : {}
    Promise.all([fetchKegiatan(opts), fetchJadwal({}), fetchKegiatanMitra()])
      .then(([k, j, m]) => { setAllKegiatan(k); setAllJadwal(j); setKaitanMitra(m) })
      .finally(() => setIsLoading(false))
  }, [user])

  const pokjaForFilter = user?.role === 'operator' && user.pokja_id
    ? pokjaList.filter(p => p.id === user.pokja_id)
    : pokjaList

  const data = useMemo(() => {
    return allKegiatan
      .filter(k => {
        if (filterPokja !== 'all' && k.pokja_id !== parseInt(filterPokja)) return false
        if (k.tahun !== parseInt(filterTahun)) return false
        if (search && !k.nama_kegiatan.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .map(k => {
        // Unggulan dan Prioritas tidak disimpan di kegiatan — keduanya
        // ditelusuri naik dari program_prioritas_id lewat master program.
        const jalur = jalurPrioritas(k.program_prioritas_id, {
          pokja: pokjaList, programPokok, programUnggulan, programPrioritas,
        })
        const namaMitra = kaitanMitra
          .filter(km => km.kegiatan_id === k.id)
          .map(km => {
            const m = daftarMitra.find(x => x.id === km.mitra_id)
            return m ? (m.singkatan || m.nama) : null
          })
          .filter((n): n is string => n !== null)
        return {
          ...k,
          pokjaName: pokjaList.find(p => p.id === k.pokja_id)?.name ?? '-',
          programName: programPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-',
          unggulanName: jalur?.unggulan.name ?? null,
          prioritasName: jalur?.prioritas.name ?? null,
          belumDipetakan: k.program_prioritas_id === null,
          mitraNames: namaMitra,
          jadwal: allJadwal.filter(j => j.kegiatan_id === k.id).map(j => formatTanggalPendek(j.tanggal)).join(', '),
        }
      })
  }, [allKegiatan, allJadwal, kaitanMitra, daftarMitra, filterPokja, filterTahun, search,
      pokjaList, programPokok, programUnggulan, programPrioritas])

  // Base UI butuh `items` agar trigger menampilkan label, bukan nilai mentah.
  const pokjaItems = [{ value: 'all', label: 'Semua Pokja' }, ...pokjaForFilter.map(p => ({ value: String(p.id), label: p.name }))]

  async function handleDelete(id: number, nama: string) {
    try {
      await deleteKegiatan(id)
      setAllKegiatan(prev => prev.filter(k => k.id !== id))
      toast.success(`Kegiatan "${nama}" berhasil dihapus.`)
    } catch {
      toast.error('Gagal menghapus kegiatan.')
    }
  }

  const canEdit = user?.role === 'super_admin' || user?.role === 'operator'

  if (isLoading) {
    return <div className="py-20 text-center text-gray-400">Memuat data kegiatan...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pkk">Rencana Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-1">Plan of Action (POA) TP PKK Kalimantan Timur</p>
        </div>
        {canEdit && (
          <Link to="/kegiatan/tambah" className={cn(buttonVariants(), 'bg-pkk hover:bg-pkk-hover text-white')}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Kegiatan
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari nama kegiatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-pkk-border"
          />
        </div>
        <Select value={filterTahun} onValueChange={v => v && setFilterTahun(v)}>
          <SelectTrigger className="w-28 border-pkk-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
        {user?.role !== 'operator' && (
          <Select items={pokjaItems} value={filterPokja} onValueChange={v => v && setFilterPokja(v)}>
            <SelectTrigger className="w-40 border-pkk-border"><SelectValue placeholder="Filter Pokja" /></SelectTrigger>
            <SelectContent>
              {pokjaItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="border-pkk-border">
        <CardHeader className="pb-3">
          <p className="text-sm text-gray-500 font-normal">
            Menampilkan <span className="font-semibold text-pkk">{data.length}</span> kegiatan
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-pkk-hover hover:bg-pkk-hover border-b-0">
                <TableHead className="text-white w-8">No</TableHead>
                <TableHead className="text-white hidden md:table-cell">Pokja</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Program Pokok</TableHead>
                <TableHead className="text-white hidden 2xl:table-cell">Program Unggulan</TableHead>
                <TableHead className="text-white hidden 2xl:table-cell">Program Prioritas</TableHead>
                <TableHead className="text-white">Nama Kegiatan</TableHead>
                <TableHead className="text-white hidden xl:table-cell">Mitra / OPD</TableHead>
                <TableHead className="text-white hidden 2xl:table-cell">Sasaran</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Jadwal</TableHead>
                <TableHead className="text-white text-right hidden xl:table-cell">Anggaran</TableHead>
                <TableHead className="text-white text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((k, idx) => (
                <TableRow key={k.id} className={idx % 2 === 0 ? 'hover:bg-pkk-tint/40' : 'bg-pkk-tint/30 hover:bg-pkk-tint/60'}>
                  <TableCell className="px-4 py-3 text-gray-400">{idx + 1}</TableCell>
                  <TableCell className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className="border-pkk-soft text-pkk-accent text-xs">{k.pokjaName}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">{k.programName}</TableCell>
                  {/* Nama Unggulan dan Prioritas berupa kalimat panjang, jadi
                      dipangkas dua baris dengan teks penuhnya di tooltip. */}
                  <TableCell className="px-4 py-3 text-gray-600 text-xs hidden 2xl:table-cell max-w-40 whitespace-normal">
                    {k.unggulanName
                      ? <p className="line-clamp-2" title={k.unggulanName}>{k.unggulanName}</p>
                      : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 text-xs hidden 2xl:table-cell max-w-48 whitespace-normal">
                    {k.prioritasName
                      ? <p className="line-clamp-2" title={k.prioritasName}>{k.prioritasName}</p>
                      : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-gray-800 max-w-xs whitespace-normal">
                    <p className="line-clamp-2">{k.nama_kegiatan}</p>
                    {k.belumDipetakan && (
                      <BadgePeringatan
                        title="Kegiatan ini dibuat sebelum master program diadopsi. Buka Edit untuk memilih Program Prioritasnya."
                        className="mt-1 text-[11px]"
                      >
                        Belum dipetakan
                      </BadgePeringatan>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 hidden xl:table-cell max-w-40">
                    {k.mitraNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {k.mitraNames.map(n => (
                          <Badge key={n} variant="outline" className="border-pkk-border text-pkk text-[11px] font-normal">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-xs hidden 2xl:table-cell">{k.sasaran}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-32"><p className="truncate">{k.jadwal || '-'}</p></TableCell>
                  <TableCell className="px-4 py-3 text-right text-gray-600 text-xs hidden xl:table-cell">{formatRupiah(k.anggaran)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" aria-label="Lihat detail" onClick={() => navigate(`/kegiatan/${k.id}`)} className="text-pkk-accent hover:bg-pkk-tint hover:text-pkk">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" aria-label="Ubah kegiatan" onClick={() => navigate(`/kegiatan/${k.id}/edit`)} className="text-pkk transisi-warna hover:bg-pkk-tint hover:text-pkk-hover">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger render={
                              <Button variant="ghost" size="icon" aria-label="Hapus kegiatan" className="text-red-500 transisi-warna hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            } />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Kegiatan "<strong>{k.nama_kegiatan}</strong>" akan dihapus beserta seluruh data realisasinya.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(k.id, k.nama_kegiatan)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="px-4 py-10 text-center text-gray-400">Tidak ada kegiatan yang sesuai filter.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
