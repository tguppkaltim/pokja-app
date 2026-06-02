import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { mockKegiatan, mockPokja, mockProgramPokok, BULAN_LABELS, SCHED_KEYS } from '@/data/mockData'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function KegiatanListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterPokja, setFilterPokja] = useState<string>(
    user?.role === 'operator' && user.pokja_id ? String(user.pokja_id) : 'all'
  )
  const [filterTahun, setFilterTahun] = useState('2026')

  const pokjaForFilter = user?.role === 'operator' && user.pokja_id
    ? mockPokja.filter(p => p.id === user.pokja_id)
    : mockPokja

  const data = useMemo(() => {
    return mockKegiatan
      .filter(k => {
        if (user?.role === 'operator' && user.pokja_id && k.pokja_id !== user.pokja_id) return false
        if (filterPokja !== 'all' && k.pokja_id !== parseInt(filterPokja)) return false
        if (k.tahun !== parseInt(filterTahun)) return false
        if (search && !k.nama_kegiatan.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .map(k => ({
        ...k,
        pokjaName: mockPokja.find(p => p.id === k.pokja_id)?.name ?? '-',
        programName: mockProgramPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-',
        jadwal: SCHED_KEYS
          .map((key, idx) => k[key] ? BULAN_LABELS[idx] : null)
          .filter(Boolean)
          .join(', '),
      }))
  }, [filterPokja, filterTahun, search, user])

  const canEdit = user?.role === 'super_admin' || user?.role === 'operator'

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

      {/* Filters */}
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
          <SelectTrigger className="w-28 border-[#d1e8d5]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
        {user?.role !== 'operator' && (
          <Select value={filterPokja} onValueChange={v => v && setFilterPokja(v)}>
            <SelectTrigger className="w-40 border-[#d1e8d5]">
              <SelectValue placeholder="Filter Pokja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pokja</SelectItem>
              {pokjaForFilter.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#134D26] text-white">
                  <th className="text-left px-4 py-3 font-medium w-8">No</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Pokja</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Program Pokok</th>
                  <th className="text-left px-4 py-3 font-medium">Nama Kegiatan</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Sasaran</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Jadwal</th>
                  <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">Anggaran</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((k, idx) => (
                  <tr key={k.id} className={idx % 2 === 0 ? 'bg-white hover:bg-[#EAF5EC]/40' : 'bg-[#EAF5EC]/30 hover:bg-[#EAF5EC]/60'}>
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-xs">{k.pokjaName}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">{k.programName}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                      <p className="line-clamp-2">{k.nama_kegiatan}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">{k.sasaran}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-32">
                      <p className="truncate">{k.jadwal || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 text-xs hidden xl:table-cell whitespace-nowrap">
                      {formatRupiah(k.anggaran)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/kegiatan/${k.id}`)}
                          className="h-8 w-8 p-0 rounded-md flex items-center justify-center text-[#2E8B57] hover:bg-[#EAF5EC]"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => navigate(`/kegiatan/${k.id}/edit`)}
                              className="h-8 w-8 p-0 rounded-md flex items-center justify-center text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <button className="h-8 w-8 p-0 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                }
                              />
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Kegiatan "<strong>{k.nama_kegiatan}</strong>" akan dihapus. Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      Tidak ada kegiatan yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
