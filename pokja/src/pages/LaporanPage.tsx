import { useState, useMemo, useEffect } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { fetchKegiatan, fetchRealisasi, fetchJadwal } from '@/lib/db'
import type { Kegiatan, RealisasiKegiatan, JadwalKegiatan } from '@/types'
import { BULAN_FULL } from '@/lib/kalender'
import { toast } from 'sonner'
import { BadgeStatus } from '@/components/badge-status'

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
  const [allJadwal, setAllJadwal] = useState<JadwalKegiatan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const opts = user?.role === 'operator' && user.pokja_id ? { pokjaId: user.pokja_id } : {}
    Promise.all([
      fetchKegiatan(opts),
      fetchRealisasi({ tahun: parseInt(filterTahun) }),
      fetchJadwal({ tahun: parseInt(filterTahun) }),
    ])
      .then(([k, r, j]) => { setAllKegiatan(k); setAllRealisasi(r); setAllJadwal(j) })
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
      const hitung = (daftarKegiatan: Kegiatan[]) => {
        const idKeg = new Set(daftarKegiatan.map(k => k.id))
        const sesi = allJadwal.filter(j => idKeg.has(j.kegiatan_id))
        const real = sesi.filter(j =>
          allRealisasi.some(r => r.jadwal_id === j.id && r.status === 'terlaksana')
        ).length
        return { sched: sesi.length, real }
      }
      const { sched: totalSched, real: totalReal } = hitung(keg)
      const programs = programPokok.filter(p => p.pokja_id === pokja.id)
      const programData = programs.map(prog => {
        const progKeg = keg.filter(k => k.program_pokok_id === prog.id)
        const { sched: pSched, real: pReal } = hitung(progKeg)
        return { name: prog.name, kegiatan: progKeg.length, terlaksana: pReal, total: pSched }
      })
      return { pokja, kegiatan: keg.length, terlaksana: totalReal, total: totalSched, pct: totalSched > 0 ? Math.round((totalReal / totalSched) * 100) : 0, programs: programData }
    })
  }, [kegiatan, allRealisasi, allJadwal, filterPokja, pokjaList, pokjaListFiltered, programPokok])

  const laporanBulanan = useMemo(() => {
    const months = filterBulan === 'all' ? Array.from({ length: 12 }, (_, i) => i + 1) : [parseInt(filterBulan)]
    return months.map(bulan => {
      const idKeg = new Set(kegiatan.map(k => k.id))
      const sesiBulanIni = allJadwal.filter(j =>
        idKeg.has(j.kegiatan_id) && parseInt(j.tanggal.slice(5, 7)) === bulan
      )
      // Satu baris per sesi: bulan yang sama bisa punya beberapa sesi.
      const withRealisasi = sesiBulanIni.map(j => {
        const k = kegiatan.find(x => x.id === j.kegiatan_id)!
        const r = allRealisasi.find(r2 => r2.jadwal_id === j.id)
        return {
          ...k,
          id: j.id,
          tanggalSesi: j.tanggal,
          realisasi: r,
          pokjaName: pokjaList.find(p => p.id === k.pokja_id)?.name ?? '-',
          progName: programPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-',
        }
      })
      return { bulan, label: BULAN_FULL[bulan - 1], items: withRealisasi }
    }).filter(m => m.items.length > 0)
  }, [kegiatan, allRealisasi, allJadwal, filterBulan, pokjaList, programPokok])

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
          <h1 className="text-2xl font-bold text-pkk">Laporan Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-1">Rekapitulasi progres dan realisasi kegiatan TP PKK Kalimantan Timur</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')} className="border-pkk-soft text-pkk hover:bg-pkk-tint">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="border-pkk-soft text-pkk hover:bg-pkk-tint">
            <FileText className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
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

      <Tabs defaultValue="pokja">
        <TabsList className="bg-pkk-tint">
          <TabsTrigger value="pokja" className="data-[state=active]:bg-pkk data-[state=active]:text-white">Progres per Pokja</TabsTrigger>
          <TabsTrigger value="bulanan" className="data-[state=active]:bg-pkk data-[state=active]:text-white">Laporan Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="pokja" className="mt-4 space-y-4">
          {pokjaProgress.map(({ pokja, kegiatan: jmlKeg, terlaksana, total, pct, programs }) => (
            <Card key={pokja.id} className="border-pkk-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-pkk">{pokja.name}</CardTitle>
                    <CardDescription className="text-xs">{pokja.description}</CardDescription>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-pkk">{pct}%</p>
                    <p className="text-xs text-gray-400">{terlaksana}/{total} sesi</p>
                  </div>
                </div>
                <Progress value={pct} className="h-2.5 [&>div]:bg-pkk mt-2" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-pkk-tint hover:bg-transparent">
                      <TableHead className="text-gray-500 text-xs">Program Pokok</TableHead>
                      <TableHead className="text-gray-500 text-xs text-center">Kegiatan</TableHead>
                      <TableHead className="text-gray-500 text-xs text-center">Terlaksana</TableHead>
                      <TableHead className="text-gray-500 text-xs text-center">Total Sesi</TableHead>
                      <TableHead className="text-gray-500 text-xs text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map(prog => (
                      <TableRow key={prog.name} className="border-pkk-tint/60">
                        <TableCell className="py-2 text-gray-700 whitespace-normal">{prog.name}</TableCell>
                        <TableCell className="py-2 text-center text-gray-600">{prog.kegiatan}</TableCell>
                        <TableCell className="py-2 text-center font-medium text-status-success">{prog.terlaksana}</TableCell>
                        <TableCell className="py-2 text-center text-gray-500">{prog.total}</TableCell>
                        <TableCell className="py-2 text-right font-medium text-pkk">{prog.total > 0 ? Math.round((prog.terlaksana / prog.total) * 100) : 0}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-pkk-tint/50">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="py-2 font-semibold text-gray-700 whitespace-normal">Total {pokja.name}</TableCell>
                      <TableCell className="py-2 text-center font-semibold text-gray-700">{jmlKeg}</TableCell>
                      <TableCell className="py-2 text-center font-semibold text-status-success">{terlaksana}</TableCell>
                      <TableCell className="py-2 text-center font-semibold text-gray-700">{total}</TableCell>
                      <TableCell className="py-2 text-right font-bold text-pkk">{pct}%</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bulanan" className="mt-4 space-y-4">
          <Select items={bulanItems} value={filterBulan} onValueChange={v => v && setFilterBulan(v)}>
            <SelectTrigger className="w-44 border-pkk-border"><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
            <SelectContent>
              {bulanItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {laporanBulanan.map(({ bulan, label, items }) => (
            <Card key={bulan} className="border-pkk-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-pkk">{label} {filterTahun}</CardTitle>
                  <Badge className="bg-pkk-tint text-pkk">{items.length} kegiatan dijadwalkan</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pkk-surface hover:bg-pkk-surface border-pkk-tint">
                      <TableHead className="px-4 text-gray-500 text-xs">Kegiatan</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs hidden md:table-cell">Pokja</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs hidden lg:table-cell">Program</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs text-center">Status</TableHead>
                      <TableHead className="px-4 text-gray-500 text-xs hidden lg:table-cell">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id} className={idx % 2 === 0 ? '' : 'bg-pkk-tint/20'}>
                        <TableCell className="px-4 py-2.5 text-gray-800 max-w-xs whitespace-normal"><p className="line-clamp-1">{item.nama_kegiatan}</p></TableCell>
                        <TableCell className="px-4 py-2.5 hidden md:table-cell">
                          <Badge variant="outline" className="border-pkk-soft text-pkk-accent text-xs">{item.pokjaName}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-gray-500 text-xs hidden lg:table-cell">{item.progName}</TableCell>
                        <TableCell className="px-4 py-2.5 text-center"><BadgeStatus status={item.realisasi?.status ?? 'menunggu'} className="text-xs" /></TableCell>
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
            <Card className="border-pkk-border">
              <CardContent className="py-12 text-center text-gray-400">Tidak ada kegiatan yang dijadwalkan untuk filter yang dipilih.</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
