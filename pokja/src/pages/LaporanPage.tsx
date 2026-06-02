import { useState, useMemo } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { mockKegiatan, mockPokja, mockProgramPokok, mockRealisasi, BULAN_FULL, SCHED_KEYS } from '@/data/mockData'
import { toast } from 'sonner'

const CURRENT_YEAR = 2026

function StatusBadge({ status }: { status: string }) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">✗ Tidak Terlaksana</Badge>
  if (status === 'menunggu') return <Badge variant="outline" className="text-blue-500 border-blue-200 text-xs">⏳ Menunggu</Badge>
  return <Badge variant="outline" className="text-gray-300 text-xs">—</Badge>
}

export default function LaporanPage() {
  const { user } = useAuth()
  const [filterTahun, setFilterTahun] = useState('2026')
  const [filterPokja, setFilterPokja] = useState<string>(
    user?.role === 'operator' && user.pokja_id ? String(user.pokja_id) : 'all'
  )
  const [filterBulan, setFilterBulan] = useState('all')

  const pokjaList = user?.role === 'operator' && user.pokja_id
    ? mockPokja.filter(p => p.id === user.pokja_id)
    : mockPokja

  const kegiatan = useMemo(() => {
    return mockKegiatan.filter(k => {
      if (user?.role === 'operator' && user.pokja_id && k.pokja_id !== user.pokja_id) return false
      if (filterPokja !== 'all' && k.pokja_id !== parseInt(filterPokja)) return false
      if (k.tahun !== parseInt(filterTahun)) return false
      return true
    })
  }, [filterTahun, filterPokja, user])

  const pokjaProgress = useMemo(() => {
    const relevantPokja = filterPokja !== 'all'
      ? mockPokja.filter(p => p.id === parseInt(filterPokja))
      : (user?.role === 'operator' && user.pokja_id ? mockPokja.filter(p => p.id === user.pokja_id) : mockPokja)

    return relevantPokja.map(pokja => {
      const keg = kegiatan.filter(k => k.pokja_id === pokja.id)
      let totalSched = 0, totalReal = 0

      keg.forEach(k => {
        SCHED_KEYS.forEach((key, idx) => {
          if (k[key]) {
            totalSched++
            const r = mockRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === idx + 1 && r2.tahun === parseInt(filterTahun))
            if (r && r.status === 'terlaksana') totalReal++
          }
        })
      })

      const programs = mockProgramPokok.filter(p => p.pokja_id === pokja.id)
      const programData = programs.map(prog => {
        const progKeg = keg.filter(k => k.program_pokok_id === prog.id)
        let pSched = 0, pReal = 0
        progKeg.forEach(k => {
          SCHED_KEYS.forEach((key, idx) => {
            if (k[key]) {
              pSched++
              const r = mockRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === idx + 1 && r2.tahun === parseInt(filterTahun))
              if (r && r.status === 'terlaksana') pReal++
            }
          })
        })
        return { name: prog.name, kegiatan: progKeg.length, terlaksana: pReal, total: pSched }
      })

      return {
        pokja,
        kegiatan: keg.length,
        terlaksana: totalReal,
        total: totalSched,
        pct: totalSched > 0 ? Math.round((totalReal / totalSched) * 100) : 0,
        programs: programData,
      }
    })
  }, [kegiatan, filterTahun, filterPokja, user])

  const laporanBulanan = useMemo(() => {
    const months = filterBulan === 'all' ? Array.from({ length: 12 }, (_, i) => i + 1) : [parseInt(filterBulan)]

    return months.map(bulan => {
      const scheduled = kegiatan.filter(k => k[SCHED_KEYS[bulan - 1]])
      const withRealisasi = scheduled.map(k => {
        const r = mockRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === bulan && r2.tahun === parseInt(filterTahun))
        const pokjaName = mockPokja.find(p => p.id === k.pokja_id)?.name ?? '-'
        const progName = mockProgramPokok.find(p => p.id === k.program_pokok_id)?.name ?? '-'
        return { ...k, realisasi: r, pokjaName, progName }
      })
      return { bulan, label: BULAN_FULL[bulan - 1], items: withRealisasi }
    }).filter(m => m.items.length > 0)
  }, [kegiatan, filterTahun, filterBulan])

  function handleExport(type: 'pdf' | 'excel') {
    toast.success(`Laporan sedang disiapkan dalam format ${type.toUpperCase()}. Fitur ini akan aktif saat terhubung ke database.`)
  }

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
              {pokjaList.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="pokja">
        <TabsList className="bg-[#EAF5EC]">
          <TabsTrigger value="pokja" className="data-[state=active]:bg-[#1B6B35] data-[state=active]:text-white">
            Progres per Pokja
          </TabsTrigger>
          <TabsTrigger value="bulanan" className="data-[state=active]:bg-[#1B6B35] data-[state=active]:text-white">
            Laporan Bulanan
          </TabsTrigger>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EAF5EC]">
                      <th className="text-left py-2 text-gray-500 font-medium text-xs">Program Pokok</th>
                      <th className="text-center py-2 text-gray-500 font-medium text-xs">Kegiatan</th>
                      <th className="text-center py-2 text-gray-500 font-medium text-xs">Terlaksana</th>
                      <th className="text-center py-2 text-gray-500 font-medium text-xs">Total Sesi</th>
                      <th className="text-right py-2 text-gray-500 font-medium text-xs">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map(prog => (
                      <tr key={prog.name} className="border-b border-[#EAF5EC]/60 last:border-0">
                        <td className="py-2 text-gray-700">{prog.name}</td>
                        <td className="py-2 text-center text-gray-600">{prog.kegiatan}</td>
                        <td className="py-2 text-center text-green-600 font-medium">{prog.terlaksana}</td>
                        <td className="py-2 text-center text-gray-500">{prog.total}</td>
                        <td className="py-2 text-right font-medium text-[#1B6B35]">
                          {prog.total > 0 ? Math.round((prog.terlaksana / prog.total) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#EAF5EC]/50">
                      <td className="py-2 font-semibold text-gray-700">Total {pokja.name}</td>
                      <td className="py-2 text-center font-semibold text-gray-700">{jmlKeg}</td>
                      <td className="py-2 text-center font-semibold text-green-600">{terlaksana}</td>
                      <td className="py-2 text-center font-semibold text-gray-700">{total}</td>
                      <td className="py-2 text-right font-bold text-[#1B6B35]">{pct}%</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bulanan" className="mt-4 space-y-4">
          <div>
            <Select value={filterBulan} onValueChange={v => v && setFilterBulan(v)}>
              <SelectTrigger className="w-44 border-[#d1e8d5]">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {BULAN_FULL.map((b, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {laporanBulanan.map(({ bulan, label, items }) => (
            <Card key={bulan} className="border-[#d1e8d5]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-[#1B6B35]">{label} {filterTahun}</CardTitle>
                  <Badge className="bg-[#EAF5EC] text-[#1B6B35]">{items.length} kegiatan dijadwalkan</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F6FBF7] border-b border-[#EAF5EC]">
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Kegiatan</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs hidden md:table-cell">Pokja</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs hidden lg:table-cell">Program</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs">Status</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs hidden lg:table-cell">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EC]/20'}>
                          <td className="px-4 py-2.5 text-gray-800 max-w-xs">
                            <p className="line-clamp-1">{item.nama_kegiatan}</p>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-xs">{item.pokjaName}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs hidden lg:table-cell">{item.progName}</td>
                          <td className="px-4 py-2.5 text-center">
                            <StatusBadge status={item.realisasi?.status ?? 'menunggu'} />
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 hidden lg:table-cell">
                            {item.realisasi?.tanggal_pelaksanaan
                              ? new Date(item.realisasi.tanggal_pelaksanaan).toLocaleDateString('id-ID')
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {laporanBulanan.length === 0 && (
            <Card className="border-[#d1e8d5]">
              <CardContent className="py-12 text-center text-gray-400">
                Tidak ada kegiatan yang dijadwalkan untuk filter yang dipilih.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
