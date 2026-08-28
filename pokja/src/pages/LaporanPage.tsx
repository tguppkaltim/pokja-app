import { useState, useMemo, useEffect } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { fetchKegiatan, fetchRealisasi } from '@/lib/db'
import type { Kegiatan, RealisasiKegiatan } from '@/types'
import { BULAN_FULL, SCHED_KEYS } from '@/data/mockData'
import { toast } from 'sonner'

function StatusBadge({ status }: { status: string }) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">✗ Tidak Terlaksana</Badge>
  if (status === 'menunggu') return <Badge variant="outline" className="text-blue-500 border-blue-200 text-xs">⏳ Menunggu</Badge>
  return <Badge variant="outline" className="text-gray-300 text-xs">—</Badge>
}

export default function LaporanPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok } = useData()
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()))
  const [filterPokja, setFilterPokja] = useState<string>(
    user?.role === 'operator' && user.pokja_id ? String(user.pokja_id) : 'all'
  )
  const [filterBulan, setFilterBulan] = useState('all')
  const [allKegiatan, setAllKegiatan] = useState<Kegiatan[]>([])
  const [allRealisasi, setAllRealisasi] = useState<RealisasiKegiatan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const opts = user?.role === 'operator' && user.pokja_id ? { pokjaId: user.pokja_id } : {}
    Promise.all([fetchKegiatan(opts), fetchRealisasi({ tahun: parseInt(filterTahun) })])
      .then(([k, r]) => { setAllKegiatan(k); setAllRealisasi(r) })
      .finally(() => setIsLoading(false))
  }, [user, filterTahun])

  const pokjaListFiltered = user?.role === 'operator' && user.pokja_id
    ? pokjaList.filter(p => p.id === user.pokja_id)
    : pokjaList

  const kegiatan = useMemo(() => {
    return allKegiatan.filter(k => {
      if (filterPokja !== 'all' && k.pokja_id !== parseInt(filterPokja)) return false
      if (k.tahun !== parseInt(filterTahun)) return false
      return true
    })
  }, [allKegiatan, filterTahun, filterPokja])

  const pokjaProgress = useMemo(() => {
    const relevantPokja = filterPokja !== 'all'
      ? pokjaList.filter(p => p.id === parseInt(filterPokja))
      : pokjaListFiltered

    return relevantPokja.map(pokja => {
      const keg = kegiatan.filter(k => k.pokja_id === pokja.id)
      let totalSched = 0, totalReal = 0
      keg.forEach(k => {
        SCHED_KEYS.forEach((key, idx) => {
          if (k[key]) {
            totalSched++
            const r = allRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === idx + 1)
            if (r && r.status === 'terlaksana') totalReal++
          }
        })
      })
      const programs = programPokok.filter(p => p.pokja_id === pokja.id)
      const programData = programs.map(prog => {
        const progKeg = keg.filter(k => k.program_pokok_id === prog.id)
        let pSched = 0, pReal = 0
        progKeg.forEach(k => {
          SCHED_KEYS.forEach((key, idx) => {
            if (k[key]) {
              pSched++
              const r = allRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === idx + 1)
              if (r && r.status === 'terlaksana') pReal++
            }
          })
        })
        return { name: prog.name, kegiatan: progKeg.length, terlaksana: pReal, total: pSched }
      })
      return { pokja, kegiatan: keg.length, terlaksana: totalReal, total: totalSched, pct: totalSched > 0 ? Math.round((totalReal / totalSched) * 100) : 0, programs: programData }
    })
  }, [kegiatan, allRealisasi, filterPokja, pokjaList, pokjaListFiltered, programPokok])

  const laporanBulanan = useMemo(() => {
    const months = filterBulan === 'all' ? Array.from({ length: 12 }, (_, i) => i + 1) : [parseInt(filterBulan)]
    return months.map(bulan => {
      const scheduled = kegiatan.filter(k => k[SCHED_KEYS[bulan - 1]])
      const withRealisasi = scheduled.map(k => {
        const r = allRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === bulan)
        return {
          ...k,
          realisasi: r,
          pokjaName: pokjaList.find(p => p.id === k.pokja_id)?.name ?? '-',
          progName: programPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-',
        }
      })
      return { bulan, label: BULAN_FULL[bulan - 1], items: withRealisasi }
    }).filter(m => m.items.length > 0)
  }, [kegiatan, allRealisasi, filterBulan, pokjaList, programPokok])

  // Base UI butuh `items` agar trigger menampilkan label, bukan nilai mentah.
  const pokjaItems = [{ value: 'all', label: 'Semua Pokja' }, ...pokjaListFiltered.map(p => ({ value: String(p.id), label: p.name }))]
  const bulanItems = [{ value: 'all', label: 'Semua Bulan' }, ...BULAN_FULL.map((b, i) => ({ value: String(i + 1), label: b }))]

  function handleExport(type: 'pdf' | 'excel') {
    toast.success(`Laporan sedang disiapkan dalam format ${type.toUpperCase()}.`)
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat data laporan...</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B6B35]">Laporan Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-1">Rekapitulasi progres dan realisasi kegiatan TP PKK Kaltim</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')} className="border-[#52B788] text-[#1B6B35] hover:bg-[#EAF5EC]">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="border-[#52B788] text-[#1B6B35] hover:bg-[#EAF5EC]">
            <FileText className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
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

      <Tabs defaultValue="pokja">
        <TabsList className="bg-[#EAF5EC]">
          <TabsTrigger value="pokja" className="data-[state=active]:bg-[#1B6B35] data-[state=active]:text-white">Progres per Pokja</TabsTrigger>
          <TabsTrigger value="bulanan" className="data-[state=active]:bg-[#1B6B35] data-[state=active]:text-white">Laporan Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="pokja" className="mt-4 space-y-4">
          {pokjaProgress.map(({ pokja, kegiatan: jmlKeg, terlaksana, total, pct, programs }) => (
            <Card key={pokja.id} className="border-[#d1e8d5]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-[#1B6B35]">{pokja.name}</CardTitle>
                    <CardDescription className="text-xs">{pokja.description}</CardDescription>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-[#1B6B35]">{pct}%</p>
                    <p className="text-xs text-gray-400">{terlaksana}/{total} sesi</p>
                  </div>
                </div>
                <Progress value={pct} className="h-2.5 [&>div]:bg-[#1B6B35] mt-2" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#EAF5EC] hover:bg-transparent">
                      <TableHead className="text-gray-500 text-xs">Program Pokok</TableHead>
                      <TableHead className="text-gray-500 text-xs text-center">Kegiatan</TableHead>
                      <TableHead className="text-gray-500 text-xs text-center">Terlaksana</TableHead>
                      <TableHead className="text-gray-500 text-xs text-center">Total Sesi</TableHead>
                      <TableHead className="text-gray-500 text-xs text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map(prog => (
                      <TableRow key={prog.name} className="border-[#EAF5EC]/60">
                        <TableCell className="py-2 text-gray-700 whitespace-normal">{prog.name}</TableCell>
                        <TableCell className="py-2 text-center text-gray-600">{prog.kegiatan}</TableCell>
                        <TableCell className="py-2 text-center text-green-600 font-medium">{prog.terlaksana}</TableCell>
                        <TableCell className="py-2 text-center text-gray-500">{prog.total}</TableCell>
                        <TableCell className="py-2 text-right font-medium text-[#1B6B35]">{prog.total > 0 ? Math.round((prog.terlaksana / prog.total) * 100) : 0}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-[#EAF5EC]/50">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="py-2 font-semibold text-gray-700 whitespace-normal">Total {pokja.name}</TableCell>
                      <TableCell className="py-2 text-center font-semibold text-gray-700">{jmlKeg}</TableCell>
                      <TableCell className="py-2 text-center font-semibold text-green-600">{terlaksana}</TableCell>
                      <TableCell className="py-2 text-center font-semibold text-gray-700">{total}</TableCell>
                      <TableCell className="py-2 text-right font-bold text-[#1B6B35]">{pct}%</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bulanan" className="mt-4 space-y-4">
          <Select items={bulanItems} value={filterBulan} onValueChange={v => v && setFilterBulan(v)}>
            <SelectTrigger className="w-44 border-[#d1e8d5]"><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
            <SelectContent>
              {bulanItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {laporanBulanan.map(({ bulan, label, items }) => (
            <Card key={bulan} className="border-[#d1e8d5]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-[#1B6B35]">{label} {filterTahun}</CardTitle>
                  <Badge className="bg-[#EAF5EC] text-[#1B6B35]">{items.length} kegiatan dijadwalkan</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F6FBF7] hover:bg-[#F6FBF7] border-[#EAF5EC]">
                      <TableHead className="px-4 text-gray-500 text-xs">Kegiatan</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs hidden md:table-cell">Pokja</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs hidden lg:table-cell">Program</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs text-center">Status</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs hidden lg:table-cell">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id} className={idx % 2 === 0 ? '' : 'bg-[#EAF5EC]/20'}>
                        <TableCell className="px-4 py-2.5 text-gray-800 max-w-xs whitespace-normal"><p className="line-clamp-1">{item.nama_kegiatan}</p></TableCell>
                        <TableCell className="px-4 py-2.5 hidden md:table-cell">
                          <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-xs">{item.pokjaName}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-gray-500 text-xs hidden lg:table-cell">{item.progName}</TableCell>
                        <TableCell className="px-4 py-2.5 text-center"><StatusBadge status={item.realisasi?.status ?? 'menunggu'} /></TableCell>
                        <TableCell className="px-4 py-2.5 text-xs text-gray-500 hidden lg:table-cell">
                          {item.realisasi?.tanggal_pelaksanaan ? new Date(item.realisasi.tanggal_pelaksanaan).toLocaleDateString('id-ID') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {laporanBulanan.length === 0 && (
            <Card className="border-[#d1e8d5]">
              <CardContent className="py-12 text-center text-gray-400">Tidak ada kegiatan yang dijadwalkan untuk filter yang dipilih.</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
