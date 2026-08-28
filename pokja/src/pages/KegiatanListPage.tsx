import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { fetchKegiatan, deleteKegiatan, fetchJadwal } from '@/lib/db'
import type { Kegiatan, JadwalKegiatan } from '@/types'

import { formatTanggalPendek } from '@/lib/utils'
import { toast } from 'sonner'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function KegiatanListPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterPokja, setFilterPokja] = useState<string>(
    user?.role === 'operator' && user.pokja_id ? String(user.pokja_id) : 'all'
  )
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()))
  const [allKegiatan, setAllKegiatan] = useState<Kegiatan[]>([])
  const [allJadwal, setAllJadwal] = useState<JadwalKegiatan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const opts = user?.role === 'operator' && user.pokja_id ? { pokjaId: user.pokja_id } : {}
    Promise.all([fetchKegiatan(opts), fetchJadwal({})])
      .then(([k, j]) => { setAllKegiatan(k); setAllJadwal(j) })
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
      .map(k => ({
        ...k,
        pokjaName: pokjaList.find(p => p.id === k.pokja_id)?.name ?? '-',
        programName: programPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-',
        jadwal: allJadwal.filter(j => j.kegiatan_id === k.id).map(j => formatTanggalPendek(j.tanggal)).join(', '),
      }))
  }, [allKegiatan, allJadwal, filterPokja, filterTahun, search, pokjaList, programPokok])

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
          <h1 className="text-2xl font-bold text-[#1B6B35]">Rencana Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-1">Plan of Action (POA) TP PKK Kaltim</p>
        </div>
        {canEdit && (
          <Link to="/kegiatan/tambah" className={cn(buttonVariants(), 'bg-[#1B6B35] hover:bg-[#134D26] text-white')}>
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
            className="pl-9 border-[#d1e8d5]"
          />
        </div>
        <Select value={filterTahun} onValueChange={v => v && setFilterTahun(v)}>
          <SelectTrigger className="w-28 border-[#d1e8d5]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
        {user?.role !== 'operator' && (
          <Select items={pokjaItems} value={filterPokja} onValueChange={v => v && setFilterPokja(v)}>
            <SelectTrigger className="w-40 border-[#d1e8d5]"><SelectValue placeholder="Filter Pokja" /></SelectTrigger>
            <SelectContent>
              {pokjaItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <p className="text-sm text-gray-500 font-normal">
            Menampilkan <span className="font-semibold text-[#1B6B35]">{data.length}</span> kegiatan
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#134D26] hover:bg-[#134D26] border-b-0">
                <TableHead className="text-white w-8">No</TableHead>
                <TableHead className="text-white hidden md:table-cell">Pokja</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Program Pokok</TableHead>
                <TableHead className="text-white">Nama Kegiatan</TableHead>
                <TableHead className="text-white hidden xl:table-cell">Sasaran</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Jadwal</TableHead>
                <TableHead className="text-white text-right hidden xl:table-cell">Anggaran</TableHead>
                <TableHead className="text-white text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((k, idx) => (
                <TableRow key={k.id} className={idx % 2 === 0 ? 'hover:bg-[#EAF5EC]/40' : 'bg-[#EAF5EC]/30 hover:bg-[#EAF5EC]/60'}>
                  <TableCell className="px-4 py-3 text-gray-400">{idx + 1}</TableCell>
                  <TableCell className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-xs">{k.pokjaName}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">{k.programName}</TableCell>
                  <TableCell className="px-4 py-3 font-medium text-gray-800 max-w-xs whitespace-normal"><p className="line-clamp-2">{k.nama_kegiatan}</p></TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">{k.sasaran}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-32"><p className="truncate">{k.jadwal || '-'}</p></TableCell>
                  <TableCell className="px-4 py-3 text-right text-gray-600 text-xs hidden xl:table-cell">{formatRupiah(k.anggaran)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" aria-label="Lihat detail" onClick={() => navigate(`/kegiatan/${k.id}`)} className="text-[#2E8B57] hover:bg-[#EAF5EC] hover:text-[#1B6B35]">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" aria-label="Ubah kegiatan" onClick={() => navigate(`/kegiatan/${k.id}/edit`)} className="text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger render={
                              <Button variant="ghost" size="icon" aria-label="Hapus kegiatan" className="text-red-500 hover:bg-red-50 hover:text-red-600">
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
