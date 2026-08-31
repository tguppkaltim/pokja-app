import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, CalendarDays, ChevronRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { fetchRapat, fetchTindakLanjut } from '@/lib/db'
import { ProgresDialog } from '@/components/progres-dialog'
import { formatTanggalPanjang, formatTanggalPendek } from '@/lib/utils'
import {
  STATUS_LABEL, STATUS_BADGE, STATUS_ITEMS, terlambat, labelPic, picItems, picKeValue, bolehUbah,
} from '@/lib/tindak-lanjut'
import type { Rapat, TindakLanjut, StatusTindakLanjut } from '@/types'

export default function NotulensiPage() {
  const { user } = useAuth()
  const { pokja: pokjaList } = useData()
  const navigate = useNavigate()
  const [rapat, setRapat] = useState<Rapat[]>([])
  const [tindakLanjut, setTindakLanjut] = useState<TindakLanjut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cari, setCari] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPic, setFilterPic] = useState('all')
  // Ubah status selalu lewat dialog progres: tidak boleh ada jalur yang
  // mengubah status tanpa meninggalkan riwayat.
  const [progresUntuk, setProgresUntuk] = useState<TindakLanjut | null>(null)
  const [statusDipilih, setStatusDipilih] = useState<StatusTindakLanjut | undefined>(undefined)

  const bolehKelola = user?.role === 'super_admin' || user?.role === 'sekretariat'

  useEffect(() => {
    Promise.all([fetchRapat(), fetchTindakLanjut()])
      .then(([r, t]) => { setRapat(r); setTindakLanjut(t) })
      .finally(() => setIsLoading(false))
  }, [])

  const statusItems = [{ value: 'all', label: 'Semua Status' }, ...STATUS_ITEMS]
  const picFilterItems = [{ value: 'all', label: 'Semua PIC' }, ...picItems(pokjaList)]

  const rapatTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return rapat
    return rapat.filter(r => r.judul.toLowerCase().includes(q) || r.ringkasan.toLowerCase().includes(q))
  }, [rapat, cari])

  const monitoring = useMemo(() => {
    return tindakLanjut
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => filterPic === 'all' || picKeValue(t) === filterPic)
      .map(t => ({ ...t, rapat: rapat.find(r => r.id === t.rapat_id) }))
      .sort((a, b) => (b.rapat?.tanggal ?? '').localeCompare(a.rapat?.tanggal ?? '') || a.id - b.id)
  }, [tindakLanjut, rapat, filterStatus, filterPic])

  const ringkasan = useMemo(() => ({
    total: tindakLanjut.length,
    open: tindakLanjut.filter(t => t.status === 'open').length,
    onProgress: tindakLanjut.filter(t => t.status === 'on_progress').length,
    closed: tindakLanjut.filter(t => t.status === 'closed').length,
    terlambat: tindakLanjut.filter(t => terlambat(t)).length,
  }), [tindakLanjut])

  function bukaProgres(t: TindakLanjut, status: StatusTindakLanjut) {
    setStatusDipilih(status)
    setProgresUntuk(t)
  }

  async function muatUlang() {
    setTindakLanjut(await fetchTindakLanjut())
  }

  function hitungRapat(rapatId: number) {
    const milik = tindakLanjut.filter(t => t.rapat_id === rapatId)
    return {
      total: milik.length,
      belum: milik.filter(t => t.status === 'open' || t.status === 'on_progress').length,
      terlambat: milik.filter(t => terlambat(t)).length,
    }
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat notulensi...</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B6B35]">Notulensi Rapat</h1>
          <p className="text-sm text-gray-500 mt-1">Catatan rapat dan pemantauan tindak lanjutnya.</p>
        </div>
        {bolehKelola && (
          <Button onClick={() => navigate('/notulensi/tambah')} className="bg-[#1B6B35] hover:bg-[#134D26]">
            <Plus className="w-4 h-4 mr-1" /> Tambah Rapat
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <RingkasanKartu label="Total Tindak Lanjut" nilai={ringkasan.total} />
        <RingkasanKartu label="Open" nilai={ringkasan.open} warna="text-red-600" />
        <RingkasanKartu label="On Progress" nilai={ringkasan.onProgress} warna="text-amber-600" />
        <RingkasanKartu label="Terlambat" nilai={ringkasan.terlambat} warna="text-red-600" />
      </div>

      <Tabs defaultValue="rapat">
        <TabsList>
          <TabsTrigger value="rapat">Daftar Rapat</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring Tindak Lanjut</TabsTrigger>
        </TabsList>

        <TabsContent value="rapat" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Cari judul atau ringkasan..." value={cari} onChange={e => setCari(e.target.value)} className="pl-9 border-[#d1e8d5]" />
          </div>

          {rapatTersaring.length === 0 && (
            <Card className="border-[#d1e8d5]">
              <CardContent className="py-12 text-center text-gray-400">
                {rapat.length === 0 ? 'Belum ada notulensi rapat.' : 'Tidak ada rapat yang sesuai pencarian.'}
              </CardContent>
            </Card>
          )}

          {rapatTersaring.map(r => {
            const h = hitungRapat(r.id)
            return (
              <Link key={r.id} to={`/notulensi/${r.id}`} className="block">
                <Card className="border-[#d1e8d5] transition-colors hover:bg-[#F6FBF7]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatTanggalPanjang(r.tanggal)}
                        </div>
                        <CardTitle className="text-base text-[#1B6B35]">{r.judul}</CardTitle>
                        {r.ringkasan && <CardDescription className="line-clamp-2 mt-1">{r.ringkasan}</CardDescription>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs border-[#52B788] text-[#2E8B57]">
                      {h.total} tindak lanjut
                    </Badge>
                    {h.belum > 0 && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                        {h.belum} belum selesai
                      </Badge>
                    )}
                    {h.terlambat > 0 && (
                      <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-1" /> {h.terlambat} terlambat
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </TabsContent>

        <TabsContent value="monitoring" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select items={statusItems} value={filterStatus} onValueChange={v => v && setFilterStatus(v)}>
              <SelectTrigger className="w-44 border-[#d1e8d5] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select items={picFilterItems} value={filterPic} onValueChange={v => v && setFilterPic(v)}>
              <SelectTrigger className="w-44 border-[#d1e8d5] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {picFilterItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-[#d1e8d5]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#134D26] hover:bg-[#134D26] border-b-0">
                    <TableHead className="text-white w-10">No</TableHead>
                    <TableHead className="text-white hidden lg:table-cell">Tgl. Rapat</TableHead>
                    <TableHead className="text-white">Uraian Tindak Lanjut</TableHead>
                    <TableHead className="text-white hidden md:table-cell">PIC</TableHead>
                    <TableHead className="text-white hidden xl:table-cell">Open</TableHead>
                    <TableHead className="text-white hidden xl:table-cell">Target</TableHead>
                    <TableHead className="text-white hidden xl:table-cell">Closed</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white hidden lg:table-cell">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoring.map((t, idx) => {
                    const lewat = terlambat(t)
                    const dapatDiubah = bolehUbah(t, user)
                    return (
                      <TableRow key={t.id} className={idx % 2 === 0 ? '' : 'bg-[#EAF5EC]/30'}>
                        <TableCell className="px-4 py-3 text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                          {t.rapat ? formatTanggalPendek(t.rapat.tanggal) : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 max-w-sm whitespace-normal">
                          <Link to={`/notulensi/${t.rapat_id}`} className="text-gray-800 hover:text-[#1B6B35]">
                            {t.uraian}
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs border-[#52B788] text-[#2E8B57]">
                            {labelPic(t, pokjaList)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">{formatTanggalPendek(t.open_date)}</TableCell>
                        <TableCell className={`px-4 py-3 text-xs hidden xl:table-cell ${lewat ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {t.target_closed ? formatTanggalPendek(t.target_closed) : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">
                          {t.closed_date ? formatTanggalPendek(t.closed_date) : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {dapatDiubah ? (
                              <Select items={STATUS_ITEMS} value={t.status} onValueChange={v => v && bukaProgres(t, v as StatusTindakLanjut)}>
                                <SelectTrigger size="sm" className="w-32 border-[#d1e8d5]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {STATUS_ITEMS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={`text-xs ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</Badge>
                            )}
                            {lewat && (
                              <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Terlambat
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell max-w-xs whitespace-normal">
                          {t.keterangan || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {monitoring.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="px-4 py-10 text-center text-gray-400">
                        Tidak ada tindak lanjut yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {progresUntuk && (
        <ProgresDialog
          key={`${progresUntuk.id}-${statusDipilih ?? ''}`}
          tindakLanjut={progresUntuk}
          statusAwal={statusDipilih}
          userId={user?.id ?? ''}
          onTutup={() => setProgresUntuk(null)}
          onSaved={muatUlang}
        />
      )}
    </div>
  )
}

function RingkasanKartu({ label, nilai, warna = 'text-[#1B6B35]' }: { label: string; nilai: number; warna?: string }) {
  return (
    <Card className="border-[#d1e8d5]">
      <CardContent className="pt-5">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${warna}`}>{nilai}</p>
      </CardContent>
    </Card>
  )
}
