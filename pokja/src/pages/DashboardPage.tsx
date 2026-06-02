import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle, ChevronRight, Wallet, BadgeDollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { mockKegiatan, mockRealisasi, mockPokja, mockProgramPokok, BULAN_LABELS, SCHED_KEYS } from '@/data/mockData'

const CURRENT_MONTH = 6
const CURRENT_YEAR = 2026

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatJuta(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} rb`
  return String(n)
}

function getStatusBadge(status: string | null) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200">✗ Belum Terlaksana</Badge>
  return <Badge variant="outline" className="text-gray-400 border-gray-200">⏳ Menunggu</Badge>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [filterPokja, setFilterPokja] = useState<string>('all')

  const kegiatan = useMemo(() => {
    if (user?.role === 'operator' && user.pokja_id) {
      return mockKegiatan.filter(k => k.pokja_id === user.pokja_id && k.tahun === CURRENT_YEAR)
    }
    return mockKegiatan.filter(k => k.tahun === CURRENT_YEAR)
  }, [user])

  const filteredKegiatan = useMemo(() => {
    if (filterPokja === 'all') return kegiatan
    return kegiatan.filter(k => k.pokja_id === parseInt(filterPokja))
  }, [kegiatan, filterPokja])

  // KPI kegiatan
  const allScheduled = useMemo(() => {
    let scheduled = 0, terlaksana = 0, belum = 0
    kegiatan.forEach(k => {
      SCHED_KEYS.forEach((key, idx) => {
        const bulan = idx + 1
        if (k[key]) {
          scheduled++
          const realisasi = mockRealisasi.find(r => r.kegiatan_id === k.id && r.bulan === bulan && r.tahun === CURRENT_YEAR)
          if (realisasi) {
            if (realisasi.status === 'terlaksana') terlaksana++
          } else if (bulan < CURRENT_MONTH) {
            belum++
          }
        }
      })
    })
    return { scheduled, terlaksana, belum }
  }, [kegiatan])

  const pctRealisasi = allScheduled.scheduled > 0
    ? Math.round((allScheduled.terlaksana / allScheduled.scheduled) * 100)
    : 0

  // Bar chart — realisasi per pokja
  const pokjaChartData = useMemo(() => {
    const pokjaToShow = user?.role === 'operator' && user.pokja_id
      ? mockPokja.filter(p => p.id === user.pokja_id)
      : mockPokja

    return pokjaToShow.map(pokja => {
      const keg = kegiatan.filter(k => k.pokja_id === pokja.id)
      let sched = 0, real = 0
      keg.forEach(k => {
        SCHED_KEYS.forEach((key, idx) => {
          if (k[key]) {
            sched++
            const r = mockRealisasi.find(r2 => r2.kegiatan_id === k.id && r2.bulan === idx + 1 && r2.tahun === CURRENT_YEAR)
            if (r && r.status === 'terlaksana') real++
          }
        })
      })
      return {
        name: pokja.name,
        pct: sched > 0 ? Math.round((real / sched) * 100) : 0,
        terlaksana: real,
        total: sched,
      }
    })
  }, [kegiatan, user])

  // Line chart — tren bulanan
  const lineData = useMemo(() => {
    return BULAN_LABELS.slice(0, CURRENT_MONTH).map((bulan, idx) => {
      const bulanNum = idx + 1
      const scheduledThisMonth = kegiatan.filter(k => k[SCHED_KEYS[idx]]).length
      const realizedThisMonth = mockRealisasi.filter(
        r => r.bulan === bulanNum && r.tahun === CURRENT_YEAR &&
          r.status === 'terlaksana' &&
          kegiatan.find(k => k.id === r.kegiatan_id)
      ).length
      return { bulan, dijadwalkan: scheduledThisMonth, terlaksana: realizedThisMonth }
    })
  }, [kegiatan])

  // Pie chart
  const pieData = [
    { name: 'Terlaksana', value: allScheduled.terlaksana, color: '#1B6B35' },
    { name: 'Belum', value: allScheduled.belum, color: '#ef4444' },
    { name: 'Akan Datang', value: allScheduled.scheduled - allScheduled.terlaksana - allScheduled.belum, color: '#93c5fd' },
  ]

  // Chart anggaran — rencana vs realisasi per pokja
  const anggaranChartData = useMemo(() => {
    const pokjaToShow = user?.role === 'operator' && user.pokja_id
      ? mockPokja.filter(p => p.id === user.pokja_id)
      : mockPokja

    return pokjaToShow.map(pokja => {
      const keg = kegiatan.filter(k => k.pokja_id === pokja.id)

      const rencana = keg.reduce((sum, k) => sum + k.anggaran, 0)

      // Realisasi anggaran dihitung proporsional:
      // anggaran_per_sesi = anggaran / total_sesi_dijadwalkan
      // realisasi = jumlah_sesi_terlaksana × anggaran_per_sesi
      const realisasiAnggaran = keg.reduce((sum, k) => {
        const totalSesi = SCHED_KEYS.filter(key => k[key]).length
        if (totalSesi === 0) return sum
        const anggaranPerSesi = k.anggaran / totalSesi
        const sesiTerlaksana = mockRealisasi.filter(
          r => r.kegiatan_id === k.id && r.tahun === CURRENT_YEAR && r.status === 'terlaksana'
        ).length
        return sum + sesiTerlaksana * anggaranPerSesi
      }, 0)

      return {
        name: pokja.name,
        rencana,
        realisasi: Math.round(realisasiAnggaran),
        pct: rencana > 0 ? Math.round((realisasiAnggaran / rencana) * 100) : 0,
      }
    })
  }, [kegiatan, user])

  // KPI anggaran total
  const totalRencana = anggaranChartData.reduce((s, d) => s + d.rencana, 0)
  const totalRealisasi = anggaranChartData.reduce((s, d) => s + d.realisasi, 0)
  const pctSerapan = totalRencana > 0 ? Math.round((totalRealisasi / totalRencana) * 100) : 0

  // Tabel ringkasan
  const tableData = filteredKegiatan.map(k => {
    const prog = mockProgramPokok.find(p => p.id === k.program_pokok_id)
    const pokja = mockPokja.find(p => p.id === k.pokja_id)
    const realisasi = mockRealisasi.find(r => r.kegiatan_id === k.id && r.bulan === CURRENT_MONTH && r.tahun === CURRENT_YEAR)
    const scheduledThisMonth = k[SCHED_KEYS[CURRENT_MONTH - 1]]
    const isLate = scheduledThisMonth && !realisasi

    return {
      ...k,
      programName: prog?.name ?? '-',
      pokjaName: pokja?.name ?? '-',
      statusBulanIni: realisasi?.status ?? (scheduledThisMonth ? 'menunggu' : 'tidak_dijadwalkan'),
      isLate,
    }
  })

  const pokjaForFilter = user?.role === 'operator' && user.pokja_id
    ? mockPokja.filter(p => p.id === user.pokja_id)
    : mockPokja

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">Dashboard Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tahun {CURRENT_YEAR} — Data per {BULAN_LABELS[CURRENT_MONTH - 1]} {CURRENT_YEAR}
        </p>
      </div>

      {/* KPI Kegiatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Kegiatan</p>
                <p className="text-3xl font-bold text-[#1B6B35] mt-1">{kegiatan.length}</p>
                <p className="text-xs text-gray-400 mt-1">{allScheduled.scheduled} sesi dijadwalkan</p>
              </div>
              <div className="w-10 h-10 bg-[#EAF5EC] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1B6B35]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Terlaksana</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{allScheduled.terlaksana}</p>
                <p className="text-xs text-gray-400 mt-1">dari {allScheduled.scheduled} sesi</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Belum Terlaksana</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{allScheduled.belum}</p>
                <p className="text-xs text-gray-400 mt-1">sesi terlambat</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Persentase Realisasi</p>
                <p className="text-3xl font-bold text-[#2E8B57] mt-1">{pctRealisasi}%</p>
                <Progress value={pctRealisasi} className="mt-2 h-2 [&>div]:bg-[#1B6B35]" />
              </div>
              <div className="w-10 h-10 bg-[#EAF5EC] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#2E8B57]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Anggaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Rencana Anggaran</p>
                <p className="text-2xl font-bold text-[#1B6B35] mt-1">{formatRupiah(totalRencana)}</p>
                <p className="text-xs text-gray-400 mt-1">seluruh kegiatan tahun {CURRENT_YEAR}</p>
              </div>
              <div className="w-10 h-10 bg-[#EAF5EC] rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#1B6B35]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Estimasi Realisasi Anggaran</p>
                <p className="text-2xl font-bold text-[#2E8B57] mt-1">{formatRupiah(totalRealisasi)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={pctSerapan} className="h-2 flex-1 [&>div]:bg-[#2E8B57]" />
                  <span className="text-xs font-semibold text-[#2E8B57] shrink-0">{pctSerapan}%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-[#EAF5EC] rounded-lg flex items-center justify-center">
                <BadgeDollarSign className="w-5 h-5 text-[#2E8B57]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row — realisasi per pokja + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-[#d1e8d5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1B6B35]">Realisasi per Pokja</CardTitle>
            <CardDescription>Persentase sesi terlaksana per Kelompok Kerja</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pokjaChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF5EC" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(val, _name, props) =>
                    [`${val}% (${props.payload.terlaksana}/${props.payload.total})`, 'Realisasi']
                  }
                  contentStyle={{ borderColor: '#d1e8d5', borderRadius: 8 }}
                />
                <Bar dataKey="pct" fill="#1B6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#d1e8d5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1B6B35]">Komposisi Status</CardTitle>
            <CardDescription>Semua sesi terencana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderColor: '#d1e8d5', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Line chart — tren realisasi bulanan */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B6B35]">Tren Realisasi Bulanan</CardTitle>
          <CardDescription>Perbandingan sesi dijadwalkan vs terlaksana (Jan–{BULAN_LABELS[CURRENT_MONTH - 1]} {CURRENT_YEAR})</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF5EC" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderColor: '#d1e8d5', borderRadius: 8 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="dijadwalkan" stroke="#52B788" strokeWidth={2} dot={{ r: 4 }} name="Dijadwalkan" />
              <Line type="monotone" dataKey="terlaksana" stroke="#1B6B35" strokeWidth={2} dot={{ r: 4 }} name="Terlaksana" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart anggaran — rencana vs realisasi per pokja */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B6B35]">Rencana vs Realisasi Anggaran per Pokja</CardTitle>
          <CardDescription>
            Estimasi penyerapan anggaran berdasarkan kegiatan yang terlaksana — dalam jutaan Rupiah
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={anggaranChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF5EC" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatJuta}
                width={48}
              />
              <Tooltip
                formatter={(val, name) => [
                  formatRupiah(Number(val)),
                  name === 'rencana' ? 'Rencana Anggaran' : 'Realisasi Anggaran',
                ]}
                contentStyle={{ borderColor: '#d1e8d5', borderRadius: 8 }}
              />
              <Legend
                formatter={name => name === 'rencana' ? 'Rencana' : 'Realisasi'}
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="rencana" fill="#52B788" radius={[4, 4, 0, 0]} name="rencana" />
              <Bar dataKey="realisasi" fill="#1B6B35" radius={[4, 4, 0, 0]} name="realisasi" />
            </BarChart>
          </ResponsiveContainer>

          {/* Tabel ringkasan serapan per pokja */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EAF5EC]">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Pokja</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Rencana Anggaran</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Realisasi Anggaran</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">% Serapan</th>
                </tr>
              </thead>
              <tbody>
                {anggaranChartData.map((d, idx) => (
                  <tr key={d.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EC]/30'}>
                    <td className="py-2 px-3 font-medium text-gray-700">{d.name}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatRupiah(d.rencana)}</td>
                    <td className="py-2 px-3 text-right text-[#1B6B35] font-medium">{formatRupiah(d.realisasi)}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.pct >= 70 ? 'bg-green-100 text-green-700' :
                        d.pct >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {d.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#EAF5EC]/60 border-t border-[#d1e8d5]">
                  <td className="py-2 px-3 font-semibold text-gray-700">Total</td>
                  <td className="py-2 px-3 text-right font-semibold text-gray-700">{formatRupiah(totalRencana)}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#1B6B35]">{formatRupiah(totalRealisasi)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      pctSerapan >= 70 ? 'bg-green-100 text-green-700' :
                      pctSerapan >= 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {pctSerapan}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabel ringkasan kegiatan */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-[#1B6B35]">Ringkasan Kegiatan</CardTitle>
              <CardDescription>Status kegiatan bulan {BULAN_LABELS[CURRENT_MONTH - 1]}</CardDescription>
            </div>
            {user?.role !== 'operator' && (
              <Select value={filterPokja} onValueChange={v => v && setFilterPokja(v)}>
                <SelectTrigger className="w-44 border-[#d1e8d5] text-sm">
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#134D26] text-white">
                  <th className="text-left px-4 py-3 font-medium">Kegiatan</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Program Pokok</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Pokja</th>
                  <th className="text-left px-4 py-3 font-medium">Status Bulan Ini</th>
                  <th className="text-left px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((k, idx) => (
                  <tr key={k.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EC]/40'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {k.isLate && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                        <span className="font-medium text-gray-800 line-clamp-1">{k.nama_kegiatan}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{k.programName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-xs">{k.pokjaName}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {k.statusBulanIni === 'tidak_dijadwalkan'
                        ? <Badge variant="outline" className="text-gray-400 text-xs">— Tidak Dijadwalkan</Badge>
                        : getStatusBadge(k.statusBulanIni === 'menunggu' ? null : k.statusBulanIni)
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/kegiatan/${k.id}`} className="text-[#1B6B35] hover:text-[#134D26] flex items-center gap-1 text-xs">
                        Detail <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data kegiatan.</td>
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
