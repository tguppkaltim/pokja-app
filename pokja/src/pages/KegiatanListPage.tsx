import { Fragment, useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2, Star } from 'lucide-react'
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
import { bolehKelolaKegiatan, pokjaTerikat, saringPokja } from '@/lib/hak-akses'
import { useData } from '@/contexts/data-context'
import { fetchKegiatan, deleteKegiatan, fetchJadwal, fetchKegiatanMitra, fetchKegiatanWilayah, fetchRealisasi } from '@/lib/db'
import type { Kegiatan, JadwalKegiatan, KegiatanMitra, KegiatanWilayah, RealisasiKegiatan } from '@/types'

import { formatTanggalPendek } from '@/lib/utils'
import { jalurPrioritas } from '@/lib/master-program'
import { menurutInduk } from '@/lib/urutkan'
import { toast } from 'sonner'
import { BadgePeringatan } from '@/components/badge-status'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function KegiatanListPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok, programUnggulan, programPrioritas, mitra: daftarMitra, wilayah: daftarWilayah } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterPokja, setFilterPokja] = useState<string>(
    pokjaTerikat(user) !== null ? String(pokjaTerikat(user)) : 'all'
  )
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()))
  const [allKegiatan, setAllKegiatan] = useState<Kegiatan[]>([])
  const [allJadwal, setAllJadwal] = useState<JadwalKegiatan[]>([])
  const [kaitanMitra, setKaitanMitra] = useState<KegiatanMitra[]>([])
  const [realisasi, setRealisasi] = useState<RealisasiKegiatan[]>([])
  const [kaitanWilayah, setKaitanWilayah] = useState<KegiatanWilayah[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const terikat = pokjaTerikat(user)
    const opts = terikat !== null ? { pokjaId: terikat } : {}
    // Realisasi hanya dipakai untuk tahu kegiatan mana yang belum tersentuh,
    // bukan untuk ditampilkan; yang dibaca cuma ada-tidaknya barisnya.
    Promise.all([fetchKegiatan(opts), fetchJadwal({}), fetchKegiatanMitra(), fetchRealisasi({}), fetchKegiatanWilayah()])
      .then(([k, j, m, r, w]) => { setAllKegiatan(k); setAllJadwal(j); setKaitanMitra(m); setRealisasi(r); setKaitanWilayah(w) })
      .finally(() => setIsLoading(false))
  }, [user])

  const pokjaForFilter = saringPokja(user, pokjaList)

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
        const namaLokus = menurutInduk(
          daftarWilayah,
          kaitanWilayah.filter(kw => kw.kegiatan_id === k.id).map(kw => kw.wilayah_id),
        )
          // "Kabupaten Kutai Kartanegara" terlalu panjang untuk sel tabel;
          // awalannya dibuang karena jenisnya sudah jelas dari namanya.
          .map(w => w.nama.replace(/^(Kabupaten|Kota)\s+/, ''))
        const namaMitra = menurutInduk(
          daftarMitra,
          kaitanMitra.filter(km => km.kegiatan_id === k.id).map(km => km.mitra_id),
        ).map(m => m.singkatan || m.nama)
        // "Belum ada realisasi" berarti belum satu pun sesi dilaporkan.
        // Kegiatan yang sudah punya satu laporan turun ke urutan biasa —
        // penandanya berarti "belum tersentuh", bukan "belum selesai".
        const belumAdaRealisasi = !realisasi.some(r => r.kegiatan_id === k.id)
        return {
          ...k,
          belumAdaRealisasi,
          disorot: k.isu_strategis && belumAdaRealisasi,
          pokjaName: pokjaList.find(p => p.id === k.pokja_id)?.name ?? '-',
          programName: programPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-',
          unggulanName: jalur?.unggulan.name ?? null,
          prioritasName: jalur?.prioritas.name ?? null,
          belumDipetakan: k.program_prioritas_id === null,
          mitraNames: namaMitra,
          lokusNames: namaLokus,
          jadwal: allJadwal.filter(j => j.kegiatan_id === k.id).map(j => formatTanggalPendek(j.tanggal)).join(', '),
        }
      })
      // Isu strategis yang belum tersentuh naik ke atas; sisanya tetap urut id
      // seperti sebelumnya. sort() mengubah array di tempat, tapi array ini
      // baru dibuat oleh map() di atas jadi tidak ada yang ikut berubah.
      .sort((a, b) => Number(b.disorot) - Number(a.disorot) || a.id - b.id)
  }, [allKegiatan, allJadwal, kaitanMitra, daftarMitra, kaitanWilayah, daftarWilayah, realisasi, filterPokja, filterTahun, search,
      pokjaList, programPokok, programUnggulan, programPrioritas])

  // Pemisah hanya ditampilkan kalau kedua kelompok memang berisi. Judul
  // kelompok di atas daftar yang seluruhnya satu jenis cuma menambah bising.
  const jumlahDisorot = data.filter(k => k.disorot).length
  const pakaiPemisah = jumlahDisorot > 0 && jumlahDisorot < data.length

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

  const canEdit = bolehKelolaKegiatan(user)

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
        {pokjaTerikat(user) === null && (
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
                <TableHead className="text-white hidden 2xl:table-cell">Lokus</TableHead>
                <TableHead className="text-white hidden xl:table-cell">Mitra / OPD</TableHead>
                <TableHead className="text-white hidden 2xl:table-cell">Sasaran</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Jadwal</TableHead>
                <TableHead className="text-white text-right hidden xl:table-cell">Anggaran</TableHead>
                <TableHead className="text-white text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((k, idx) => (
                <Fragment key={k.id}>
                  {pakaiPemisah && idx === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={12} className="bg-pkk-tint/60 px-4 py-1.5 text-xs font-medium text-pkk">
                        <span className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-pkk text-pkk" />
                          Isu strategis, belum ada realisasi
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                  {pakaiPemisah && idx === jumlahDisorot && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={12} className="bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-500">
                        Kegiatan lainnya
                      </TableCell>
                    </TableRow>
                  )}
                <TableRow className={idx % 2 === 0 ? 'hover:bg-pkk-tint/40' : 'bg-pkk-tint/30 hover:bg-pkk-tint/60'}>
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
                    <p className="line-clamp-2">
                      {k.isu_strategis && (
                        <Star
                          aria-label="Isu strategis"
                          className="mr-1 -mt-0.5 inline h-3.5 w-3.5 fill-pkk text-pkk"
                        />
                      )}
                      {k.nama_kegiatan}
                    </p>
                    {k.belumDipetakan && (
                      <BadgePeringatan
                        title="Kegiatan ini dibuat sebelum master program diadopsi. Buka Edit untuk memilih Program Prioritasnya."
                        className="mt-1 text-[11px]"
                      >
                        Belum dipetakan
                      </BadgePeringatan>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 hidden 2xl:table-cell max-w-40">
                    {k.lokusNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {k.lokusNames.map(n => (
                          <Badge key={n} variant="outline" className="border-pkk-border text-pkk text-[11px] font-normal">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
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
                </Fragment>
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
