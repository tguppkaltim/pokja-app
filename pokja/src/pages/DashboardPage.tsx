import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle, ChevronRight, Wallet, BadgeDollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { fetchKegiatan, fetchRealisasi, fetchJadwal } from '@/lib/db'
import type { Kegiatan, RealisasiKegiatan, JadwalKegiatan } from '@/types'
import { BULAN_LABELS } from '@/lib/kalender'

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatJuta(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} rb`
  return String(n)
}

// null = serapan tak terdefinisi karena rencana anggarannya 0.
// Menampilkan "0%" untuk kasus itu menyesatkan: pembaginya nol, bukan hasilnya nol.
function serapanBadgeClass(pct: number | null) {
  if (pct === null) return 'bg-gray-100 text-gray-500'
  if (pct >= 70) return 'bg-green-100 text-green-700'
  if (pct >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

function formatPct(pct: number | null) {
  return pct === null ? '—' : `${pct}%`
}

function getStatusBadge(status: string | null) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200">✗ Belum Terlaksana</Badge>
  return <Badge variant="outline" className="text-gray-400 border-gray-200">⏳ Menunggu</Badge>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok } = useData()
  const [filterTahun, setFilterTahun] = useState(String(CURRENT_YEAR))
  const [dariBulan, setDariBulan] = useState('1')
  const [sampaiBulan, setSampaiBulan] = useState('12')
  const [filterPokja, setFilterPokja] = useState<string>('all')
  const [filterProgram, setFilterProgram] = useState<string>('all')
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([])
  const [realisasi, setRealisasi] = useState<RealisasiKegiatan[]>([])
  const [jadwal, setJadwal] = useState<JadwalKegiatan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const tahun = parseInt(filterTahun)
  // Jendela tampilan: rentang bulan [dari, sampai] di dalam tahun terpilih.
  const dari = parseInt(dariBulan)
  const sampai = parseInt(sampaiBulan)
  // Sesi baru bisa disebut terlambat kalau bulannya sudah benar-benar lewat.
  // Tanpa ini, rentang yang mencakup bulan depan akan menuduhnya terlambat.
  const bulanSudahLewat = tahun < CURRENT_YEAR ? 12 : tahun > CURRENT_YEAR ? 0 : CURRENT_MONTH
  const batasTerlambat = Math.min(sampai, bulanSudahLewat)

  useEffect(() => {
    const opts = user?.role === 'operator' && user.pokja_id
      ? { pokjaId: user.pokja_id, tahun }
      : { tahun }
    Promise.all([fetchKegiatan(opts), fetchRealisasi({ tahun }), fetchJadwal({ tahun })])
      .then(([k, r, j]) => { setKegiatan(k); setRealisasi(r); setJadwal(j) })
      .finally(() => setIsLoading(false))
  }, [user, tahun])

  // Satu sumber kebenaran: seluruh kartu, grafik, dan tabel memakai ini
  // supaya filter berlaku untuk seluruh halaman, bukan sebagian.
  const scopedKegiatan = useMemo(() => kegiatan.filter(k => {
    if (filterPokja !== 'all' && k.pokja_id !== parseInt(filterPokja)) return false
    if (filterProgram !== 'all' && k.program_pokok_id !== parseInt(filterProgram)) return false
    return true
  }), [kegiatan, filterPokja, filterProgram])

  // Pokja yang muncul di grafik & tabel serapan: dibatasi pokja milik operator,
  // lalu dipersempit lagi oleh filter Pokja.
  const pokjaTampil = useMemo(() => {
    const base = user?.role === 'operator' && user.pokja_id
      ? pokjaList.filter(p => p.id === user.pokja_id)
      : pokjaList
    return filterPokja === 'all' ? base : base.filter(p => p.id === parseInt(filterPokja))
  }, [pokjaList, user, filterPokja])

  // Sesi kini per tanggal, jadi satu bulan bisa punya beberapa sesi. Dihitung
  // dari tabel jadwal, bukan dari kolom sched_* yang hanya satu boleh per bulan.
  const sesiDalamLingkup = useMemo(() => {
    const idKegiatan = new Set(scopedKegiatan.map(k => k.id))
    return jadwal.filter(j => {
      if (!idKegiatan.has(j.kegiatan_id)) return false
      const bulan = parseInt(j.tanggal.slice(5, 7))
      return bulan >= dari && bulan <= sampai
    })
  }, [jadwal, scopedKegiatan, dari, sampai])

  const allScheduled = useMemo(() => {
    let terlaksana = 0, belum = 0
    sesiDalamLingkup.forEach(j => {
      const r = realisasi.find(r => r.jadwal_id === j.id)
      if (r) {
        if (r.status === 'terlaksana') terlaksana++
      } else if (parseInt(j.tanggal.slice(5, 7)) < batasTerlambat) {
        belum++
      }
    })
    return { scheduled: sesiDalamLingkup.length, terlaksana, belum }
  }, [sesiDalamLingkup, realisasi, batasTerlambat])

  const pctRealisasi = allScheduled.scheduled > 0
    ? Math.round((allScheduled.terlaksana / allScheduled.scheduled) * 100)
    : 0

  const pokjaChartData = useMemo(() => {
    return pokjaTampil.map(pokja => {
      const idKeg = new Set(scopedKegiatan.filter(k => k.pokja_id === pokja.id).map(k => k.id))
      const sesi = sesiDalamLingkup.filter(j => idKeg.has(j.kegiatan_id))
      const real = sesi.filter(j =>
        realisasi.some(r => r.jadwal_id === j.id && r.status === 'terlaksana')
      ).length
      const sched = sesi.length
      return { name: pokja.name, pct: sched > 0 ? Math.round((real / sched) * 100) : 0, terlaksana: real, total: sched }
    })
  }, [scopedKegiatan, sesiDalamLingkup, realisasi, pokjaTampil])

  const lineData = useMemo(() => {
    return BULAN_LABELS.slice(dari - 1, sampai).map((bulan, offset) => {
      const idx = dari - 1 + offset
      const bulanNum = idx + 1
      const sesiBulanIni = sesiDalamLingkup.filter(j => parseInt(j.tanggal.slice(5, 7)) === bulanNum)
      const realizedThisMonth = sesiBulanIni.filter(j =>
        realisasi.some(r => r.jadwal_id === j.id && r.status === 'terlaksana')
      ).length
      return { bulan, dijadwalkan: sesiBulanIni.length, terlaksana: realizedThisMonth }
    })
  }, [sesiDalamLingkup, realisasi, dari, sampai])

  const pieData = [
    { name: 'Terlaksana', value: allScheduled.terlaksana, color: '#1B6B35' },
    { name: 'Belum', value: allScheduled.belum, color: '#ef4444' },
    { name: 'Akan Datang', value: allScheduled.scheduled - allScheduled.terlaksana - allScheduled.belum, color: '#93c5fd' },
  ]

  const anggaranChartData = useMemo(() => {
    return pokjaTampil.map(pokja => {
      const keg = scopedKegiatan.filter(k => k.pokja_id === pokja.id)
      const rencana = keg.reduce((sum, k) => sum + k.anggaran, 0)
      // Serapan nyata: jumlah anggaran aktual yang diinput operator per sesi.
      const realisasiAnggaran = keg.reduce((sum, k) => sum + realisasi
        .filter(r => r.kegiatan_id === k.id && r.tahun === tahun && r.bulan >= dari && r.bulan <= sampai && r.status === 'terlaksana')
        .reduce((acc, r) => acc + r.anggaran_aktual, 0), 0)
      return { name: pokja.name, rencana, realisasi: realisasiAnggaran, pct: rencana > 0 ? Math.round((realisasiAnggaran / rencana) * 100) : null }
    })
  }, [scopedKegiatan, realisasi, pokjaTampil, tahun, dari, sampai])

  const totalRencana = anggaranChartData.reduce((s, d) => s + d.rencana, 0)
  const totalRealisasi = anggaranChartData.reduce((s, d) => s + d.realisasi, 0)
  const pctSerapan = totalRencana > 0 ? Math.round((totalRealisasi / totalRencana) * 100) : null

  // Dihitung dari kegiatan dalam lingkup filter agar angkanya konsisten dengan
  // sisa halaman. Viewer tidak bisa menindaklanjuti, jadi tidak perlu diberi tahu.
  const belumDipetakan = scopedKegiatan.filter(k => k.program_prioritas_id === null).length
  const bolehMemetakan = user?.role === 'super_admin' || user?.role === 'operator'

  const tableData = scopedKegiatan.map(k => {
    const prog = programPokok.find(p => p.id === k.program_pokok_id)
    const pokja = pokjaList.find(p => p.id === k.pokja_id)
    // Kolom status menampilkan satu bulan; pakai bulan akhir rentang sebagai acuan.
    const sesiBulanAkhir = jadwal.filter(j =>
      j.kegiatan_id === k.id && parseInt(j.tanggal.slice(5, 7)) === sampai
    )
    const r = realisasi.find(x => sesiBulanAkhir.some(j => j.id === x.jadwal_id))
    const scheduledThisMonth = sesiBulanAkhir.length > 0
    return {
      ...k,
      programName: prog?.name ?? '-',
      pokjaName: pokja?.name ?? '-',
      statusBulanIni: r?.status ?? (scheduledThisMonth ? 'menunggu' : 'tidak_dijadwalkan'),
      isLate: scheduledThisMonth && !r && sampai <= bulanSudahLewat,
    }
  })

  const pokjaForFilter = user?.role === 'operator' && user.pokja_id
    ? pokjaList.filter(p => p.id === user.pokja_id)
    : pokjaList

  // Base UI butuh `items` agar trigger menampilkan label, bukan nilai mentah.
  const pokjaFilterItems = [{ value: 'all', label: 'Semua Pokja' }, ...pokjaForFilter.map(p => ({ value: String(p.id), label: p.name }))]
  const tahunItems = [{ value: '2026', label: '2026' }, { value: '2025', label: '2025' }]
  const bulanItems = BULAN_LABELS.map((b, i) => ({ value: String(i + 1), label: b }))

  // Jaga agar rentangnya tetap masuk akal: ujung yang lain ikut bergeser
  // kalau pengguna memilih bulan awal yang melewati bulan akhir, atau sebaliknya.
  function gantiDari(v: string) {
    setDariBulan(v)
    if (parseInt(v) > sampai) setSampaiBulan(v)
  }
  function gantiSampai(v: string) {
    setSampaiBulan(v)
    if (parseInt(v) < dari) setDariBulan(v)
  }
  // Program menyesuaikan Pokja yang sedang dipilih.
  const programItems = [
    { value: 'all', label: 'Semua Program' },
    ...programPokok
      .filter(pr => filterPokja === 'all'
        ? pokjaForFilter.some(p => p.id === pr.pokja_id)
        : pr.pokja_id === parseInt(filterPokja))
      .map(pr => ({ value: String(pr.id), label: pr.name })),
  ]

  function gantiPokja(v: string) {
    setFilterPokja(v)
    setFilterProgram('all') // daftar program berubah, pilihan lama bisa tak berlaku
  }

  if (isLoading) {
    return <div className="py-20 text-center text-gray-400">Memuat data dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B6B35]">Dashboard Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tahun {tahun} — {dari === sampai
              ? `Bulan ${BULAN_LABELS[dari - 1]}`
              : `${BULAN_LABELS[dari - 1]} s/d ${BULAN_LABELS[sampai - 1]}`} {tahun}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select items={tahunItems} value={filterTahun} onValueChange={v => v && setFilterTahun(v)}>
            <SelectTrigger className="w-28 border-[#d1e8d5] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tahunItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Select items={bulanItems} value={dariBulan} onValueChange={v => v && gantiDari(v)}>
              <SelectTrigger className="w-24 border-[#d1e8d5] text-sm" aria-label="Bulan awal"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bulanItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-400 shrink-0">s/d</span>
            <Select items={bulanItems} value={sampaiBulan} onValueChange={v => v && gantiSampai(v)}>
              <SelectTrigger className="w-24 border-[#d1e8d5] text-sm" aria-label="Bulan akhir"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bulanItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {user?.role !== 'operator' && (
            <Select items={pokjaFilterItems} value={filterPokja} onValueChange={v => v && gantiPokja(v)}>
              <SelectTrigger className="w-40 border-[#d1e8d5] text-sm"><SelectValue placeholder="Filter Pokja" /></SelectTrigger>
              <SelectContent>
                {pokjaFilterItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select items={programItems} value={filterProgram} onValueChange={v => v && setFilterProgram(v)}>
            <SelectTrigger className="w-52 border-[#d1e8d5] text-sm"><SelectValue placeholder="Filter Program" /></SelectTrigger>
            <SelectContent>
              {programItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {belumDipetakan > 0 && bolehMemetakan && (
        <Link
          to="/kegiatan"
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-900">
              {belumDipetakan} kegiatan belum dipetakan ke Program Prioritas
            </p>
            <p className="text-xs text-amber-700">
              Kegiatan ini dibuat sebelum master program diadopsi. Buka Rencana Kegiatan lalu Edit untuk melengkapinya.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-amber-600" />
        </Link>
      )}

      {/* KPI Kegiatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#d1e8d5]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Kegiatan</p>
                <p className="text-3xl font-bold text-[#1B6B35] mt-1">{scopedKegiatan.length}</p>
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
                <p className="text-xs text-gray-400 mt-1">seluruh kegiatan tahun {tahun}</p>
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
                <p className="text-sm text-gray-500">Realisasi Anggaran</p>
                <p className="text-2xl font-bold text-[#2E8B57] mt-1">{formatRupiah(totalRealisasi)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={pctSerapan ?? 0} className="h-2 flex-1 [&>div]:bg-[#2E8B57]" />
                  <span className="text-xs font-semibold text-[#2E8B57] shrink-0">{formatPct(pctSerapan)}</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-[#EAF5EC] rounded-lg flex items-center justify-center">
                <BadgeDollarSign className="w-5 h-5 text-[#2E8B57]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
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
                  formatter={(val, _name, props) => [`${val}% (${props.payload.terlaksana}/${props.payload.total})`, 'Realisasi']}
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
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderColor: '#d1e8d5', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Line chart */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B6B35]">Tren Realisasi Bulanan</CardTitle>
          <CardDescription>Perbandingan sesi dijadwalkan vs terlaksana ({BULAN_LABELS[dari - 1]}–{BULAN_LABELS[sampai - 1]} {tahun})</CardDescription>
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

      {/* Anggaran chart */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B6B35]">Rencana vs Realisasi Anggaran per Pokja</CardTitle>
          <CardDescription>Estimasi penyerapan anggaran berdasarkan kegiatan yang terlaksana — dalam jutaan Rupiah</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={anggaranChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF5EC" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatJuta} width={48} />
              <Tooltip
                formatter={(val, name) => [formatRupiah(Number(val)), name === 'rencana' ? 'Rencana Anggaran' : 'Realisasi Anggaran']}
                contentStyle={{ borderColor: '#d1e8d5', borderRadius: 8 }}
              />
              <Legend formatter={name => name === 'rencana' ? 'Rencana' : 'Realisasi'} iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rencana" fill="#52B788" radius={[4, 4, 0, 0]} name="rencana" />
              <Bar dataKey="realisasi" fill="#1B6B35" radius={[4, 4, 0, 0]} name="realisasi" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="border-[#EAF5EC] hover:bg-transparent">
                  <TableHead className="px-3 text-gray-500 text-xs">Pokja</TableHead>
                  <TableHead className="px-3 text-gray-500 text-xs text-right">Rencana Anggaran</TableHead>
                  <TableHead className="px-3 text-gray-500 text-xs text-right">Realisasi Anggaran</TableHead>
                  <TableHead className="px-3 text-gray-500 text-xs text-right">% Serapan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggaranChartData.map((d, idx) => (
                  <TableRow key={d.name} className={idx % 2 === 0 ? '' : 'bg-[#EAF5EC]/30'}>
                    <TableCell className="py-2 px-3 font-medium text-gray-700">{d.name}</TableCell>
                    <TableCell className="py-2 px-3 text-right text-gray-600">{formatRupiah(d.rencana)}</TableCell>
                    <TableCell className="py-2 px-3 text-right text-[#1B6B35] font-medium">{formatRupiah(d.realisasi)}</TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <Badge className={`rounded-full ${serapanBadgeClass(d.pct)}`}>{formatPct(d.pct)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-[#EAF5EC]/60 border-t border-[#d1e8d5]">
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-2 px-3 font-semibold text-gray-700">Total</TableCell>
                  <TableCell className="py-2 px-3 text-right font-semibold text-gray-700">{formatRupiah(totalRencana)}</TableCell>
                  <TableCell className="py-2 px-3 text-right font-bold text-[#1B6B35]">{formatRupiah(totalRealisasi)}</TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Badge className={`rounded-full font-bold ${serapanBadgeClass(pctSerapan)}`}>{formatPct(pctSerapan)}</Badge>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabel ringkasan kegiatan */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-[#1B6B35]">Ringkasan Kegiatan</CardTitle>
              <CardDescription>Status kegiatan bulan {BULAN_LABELS[sampai - 1]} {tahun}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#134D26] hover:bg-[#134D26] border-b-0">
                <TableHead className="text-white">Kegiatan</TableHead>
                <TableHead className="text-white hidden md:table-cell">Program Pokok</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Pokja</TableHead>
                <TableHead className="text-white">Status Bulan Ini</TableHead>
                <TableHead className="text-white"><span className="sr-only">Aksi</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((k, idx) => (
                <TableRow key={k.id} className={idx % 2 === 0 ? '' : 'bg-[#EAF5EC]/40'}>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <div className="flex items-center gap-2">
                      {k.isLate && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="font-medium text-gray-800 line-clamp-1">{k.nama_kegiatan}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 hidden md:table-cell">{k.programName}</TableCell>
                  <TableCell className="px-4 py-3 hidden lg:table-cell">
                    <Badge variant="outline" className="border-[#52B788] text-[#2E8B57] text-xs">{k.pokjaName}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {k.statusBulanIni === 'tidak_dijadwalkan'
                      ? <Badge variant="outline" className="text-gray-400 text-xs">— Tidak Dijadwalkan</Badge>
                      : getStatusBadge(k.statusBulanIni === 'menunggu' ? null : k.statusBulanIni)
                    }
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Link to={`/kegiatan/${k.id}`} className="text-[#1B6B35] hover:text-[#134D26] flex items-center gap-1 text-xs">
                      Detail <ChevronRight className="w-3 h-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {tableData.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data kegiatan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
