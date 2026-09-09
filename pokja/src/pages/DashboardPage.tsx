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
import { KartuKPI } from '@/components/kartu-kpi'
import { BadgeStatus } from '@/components/badge-status'
import { useAuth } from '@/contexts/auth-context'
import { bolehKelolaKegiatan, pokjaTerikat, saringPokja } from '@/lib/hak-akses'
import { useData } from '@/contexts/data-context'
import { fetchKegiatan, fetchRealisasi, fetchJadwal } from '@/lib/db'
import type { Kegiatan, RealisasiKegiatan, JadwalKegiatan } from '@/types'
import { BULAN_LABELS, BULAN_FULL } from '@/lib/kalender'

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
  if (pct >= 70) return 'bg-status-success-tint text-status-success'
  if (pct >= 40) return 'bg-status-warning-tint text-status-warning'
  return 'bg-status-danger-tint text-status-danger'
}

function formatPct(pct: number | null) {
  return pct === null ? '—' : `${pct}%`
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
    const terikat = pokjaTerikat(user)
    const opts = terikat !== null ? { pokjaId: terikat, tahun } : { tahun }
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
    const base = saringPokja(user, pokjaList)
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
    { name: 'Terlaksana', value: allScheduled.terlaksana, color: 'var(--pkk-primary)' },
    { name: 'Belum', value: allScheduled.belum, color: 'var(--status-danger)' },
    { name: 'Akan Datang', value: allScheduled.scheduled - allScheduled.terlaksana - allScheduled.belum, color: 'var(--pkk-soft)' },
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
  const bolehMemetakan = bolehKelolaKegiatan(user)

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
      // `as const` menjaga tipenya tetap union literal. Tanpa itu properti
      // objek melebar jadi `string`, dan pemeriksaan `!== 'tidak_dijadwalkan'`
      // di tabel tidak bisa menyempitkannya untuk BadgeStatus.
      statusBulanIni: r?.status ?? (scheduledThisMonth ? ('menunggu' as const) : ('tidak_dijadwalkan' as const)),
      isLate: scheduledThisMonth && !r && sampai <= bulanSudahLewat,
    }
  })

  const pokjaForFilter = saringPokja(user, pokjaList)

  // Base UI butuh `items` agar trigger menampilkan label, bukan nilai mentah.
  const pokjaFilterItems = [{ value: 'all', label: 'Semua Pokja' }, ...pokjaForFilter.map(p => ({ value: String(p.id), label: p.name }))]
  const tahunItems = [{ value: '2026', label: '2026' }, { value: '2025', label: '2025' }]
  const bulanItems = BULAN_FULL.map((b, i) => ({ value: String(i + 1), label: b }))

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
          <h1 className="text-2xl font-bold text-pkk">Dashboard Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tahun {tahun} — {dari === sampai
              ? `Bulan ${BULAN_FULL[dari - 1]}`
              : `${BULAN_FULL[dari - 1]} s/d ${BULAN_FULL[sampai - 1]}`} {tahun}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select items={tahunItems} value={filterTahun} onValueChange={v => v && setFilterTahun(v)}>
            <SelectTrigger className="w-28 border-pkk-border text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tahunItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Select items={bulanItems} value={dariBulan} onValueChange={v => v && gantiDari(v)}>
              <SelectTrigger className="w-36 border-pkk-border text-sm" aria-label="Bulan awal"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bulanItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-400 shrink-0">s/d</span>
            <Select items={bulanItems} value={sampaiBulan} onValueChange={v => v && gantiSampai(v)}>
              <SelectTrigger className="w-36 border-pkk-border text-sm" aria-label="Bulan akhir"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bulanItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {pokjaTerikat(user) === null && (
            <Select items={pokjaFilterItems} value={filterPokja} onValueChange={v => v && gantiPokja(v)}>
              <SelectTrigger className="w-40 border-pkk-border text-sm"><SelectValue placeholder="Filter Pokja" /></SelectTrigger>
              <SelectContent>
                {pokjaFilterItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select items={programItems} value={filterProgram} onValueChange={v => v && setFilterProgram(v)}>
            <SelectTrigger className="w-52 border-pkk-border text-sm"><SelectValue placeholder="Filter Program" /></SelectTrigger>
            <SelectContent>
              {programItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {belumDipetakan > 0 && bolehMemetakan && (
        <Link
          to="/kegiatan"
          className="flex items-center gap-3 rounded-lg border border-status-warning/25 bg-status-warning-tint px-4 py-3 transisi-warna hover:border-status-warning/40"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 text-status-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-status-warning">
              {belumDipetakan} kegiatan belum dipetakan ke Program Prioritas
            </p>
            <p className="text-xs text-status-warning/85">
              Kegiatan ini dibuat sebelum master program diadopsi. Buka Rencana Kegiatan lalu Edit untuk melengkapinya.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-status-warning" />
        </Link>
      )}

      {/* KPI Kegiatan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuKPI
          label="Total Kegiatan"
          nilai={scopedKegiatan.length}
          ikon={TrendingUp}
          keterangan={`${allScheduled.scheduled} sesi dijadwalkan`}
        />
        <KartuKPI
          label="Terlaksana"
          nilai={allScheduled.terlaksana}
          ikon={CheckCircle2}
          nada="berhasil"
          keterangan={`dari ${allScheduled.scheduled} sesi`}
        />
        <KartuKPI
          label="Belum Terlaksana"
          nilai={allScheduled.belum}
          ikon={XCircle}
          nada="bahaya"
          keterangan="sesi terlambat"
        />
        <KartuKPI
          label="Persentase Realisasi"
          nilai={`${pctRealisasi}%`}
          ikon={Clock}
          nada="aksen"
          keterangan={<Progress value={pctRealisasi} className="mt-1.5 h-2 [&>div]:bg-pkk" />}
        />
      </div>

      {/* KPI Anggaran */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KartuKPI
          label="Total Rencana Anggaran"
          nilai={formatRupiah(totalRencana)}
          ikon={Wallet}
          ringkas
          keterangan={`seluruh kegiatan tahun ${tahun}`}
        />
        <KartuKPI
          label="Realisasi Anggaran"
          nilai={formatRupiah(totalRealisasi)}
          ikon={BadgeDollarSign}
          nada="aksen"
          ringkas
          keterangan={
            <div className="flex items-center gap-2">
              <Progress value={pctSerapan ?? 0} className="h-2 flex-1 [&>div]:bg-pkk-accent" />
              <span className="shrink-0 text-xs font-semibold text-pkk-accent">{formatPct(pctSerapan)}</span>
            </div>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-pkk-border transisi-kartu hover:shadow-md lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-pkk">Realisasi per Pokja</CardTitle>
            <CardDescription>Persentase sesi terlaksana per Kelompok Kerja</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pokjaChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pkk-tint)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(val, _name, props) => [`${val}% (${props.payload.terlaksana}/${props.payload.total})`, 'Realisasi']}
                  contentStyle={{ borderColor: 'var(--pkk-border)', borderRadius: 8 }}
                />
                <Bar dataKey="pct" fill="var(--pkk-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-pkk-border transisi-kartu hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-pkk">Komposisi Status</CardTitle>
            <CardDescription>Semua sesi terencana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderColor: 'var(--pkk-border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Line chart */}
      <Card className="border-pkk-border transisi-kartu hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-pkk">Tren Realisasi Bulanan</CardTitle>
          <CardDescription>Perbandingan sesi dijadwalkan vs terlaksana ({BULAN_FULL[dari - 1]}–{BULAN_FULL[sampai - 1]} {tahun})</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pkk-tint)" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderColor: 'var(--pkk-border)', borderRadius: 8 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="dijadwalkan" stroke="var(--pkk-soft)" strokeWidth={2} dot={{ r: 4 }} name="Dijadwalkan" />
              <Line type="monotone" dataKey="terlaksana" stroke="var(--pkk-primary)" strokeWidth={2} dot={{ r: 4 }} name="Terlaksana" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Anggaran chart */}
      <Card className="border-pkk-border transisi-kartu hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-pkk">Rencana vs Realisasi Anggaran per Pokja</CardTitle>
          <CardDescription>Estimasi penyerapan anggaran berdasarkan kegiatan yang terlaksana — dalam jutaan Rupiah</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={anggaranChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pkk-tint)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatJuta} width={48} />
              <Tooltip
                formatter={(val, name) => [formatRupiah(Number(val)), name === 'rencana' ? 'Rencana Anggaran' : 'Realisasi Anggaran']}
                contentStyle={{ borderColor: 'var(--pkk-border)', borderRadius: 8 }}
              />
              <Legend formatter={name => name === 'rencana' ? 'Rencana' : 'Realisasi'} iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rencana" fill="var(--pkk-soft)" radius={[4, 4, 0, 0]} name="rencana" />
              <Bar dataKey="realisasi" fill="var(--pkk-primary)" radius={[4, 4, 0, 0]} name="realisasi" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="border-pkk-tint hover:bg-transparent">
                  <TableHead className="px-3 text-gray-500 text-xs">Pokja</TableHead>
                  <TableHead className="px-3 text-gray-500 text-xs text-right">Rencana Anggaran</TableHead>
                  <TableHead className="px-3 text-gray-500 text-xs text-right">Realisasi Anggaran</TableHead>
                  <TableHead className="px-3 text-gray-500 text-xs text-right">% Serapan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggaranChartData.map(d => (
                  <TableRow key={d.name} className="border-pkk-tint">
                    <TableCell className="py-2 px-3 font-medium text-gray-700">{d.name}</TableCell>
                    <TableCell className="py-2 px-3 text-right text-gray-600">{formatRupiah(d.rencana)}</TableCell>
                    <TableCell className="py-2 px-3 text-right text-pkk font-medium">{formatRupiah(d.realisasi)}</TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <Badge className={`rounded-full ${serapanBadgeClass(d.pct)}`}>{formatPct(d.pct)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-pkk-tint/60 border-t border-pkk-border">
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-2 px-3 font-semibold text-gray-700">Total</TableCell>
                  <TableCell className="py-2 px-3 text-right font-semibold text-gray-700">{formatRupiah(totalRencana)}</TableCell>
                  <TableCell className="py-2 px-3 text-right font-bold text-pkk">{formatRupiah(totalRealisasi)}</TableCell>
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
      <Card className="border-pkk-border transisi-kartu hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-pkk">Ringkasan Kegiatan</CardTitle>
              <CardDescription>Status kegiatan bulan {BULAN_FULL[sampai - 1]} {tahun}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-pkk-hover hover:bg-pkk-hover border-b-0">
                <TableHead className="text-white">Kegiatan</TableHead>
                <TableHead className="text-white hidden md:table-cell">Program Pokok</TableHead>
                <TableHead className="text-white hidden lg:table-cell">Pokja</TableHead>
                <TableHead className="text-white">Status Bulan Ini</TableHead>
                <TableHead className="text-white"><span className="sr-only">Aksi</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((k, idx) => (
                <TableRow key={k.id} className={idx % 2 === 0 ? '' : 'bg-pkk-tint/40'}>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <div className="flex items-center gap-2">
                      {k.isLate && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="font-medium text-gray-800 line-clamp-1">{k.nama_kegiatan}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 hidden md:table-cell">{k.programName}</TableCell>
                  <TableCell className="px-4 py-3 hidden lg:table-cell">
                    <Badge variant="outline" className="border-pkk-soft text-pkk-accent text-xs">{k.pokjaName}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {k.statusBulanIni === 'tidak_dijadwalkan'
                      ? <Badge variant="outline" className="text-gray-400 text-xs">— Tidak Dijadwalkan</Badge>
                      : <BadgeStatus status={k.statusBulanIni} className="text-xs" />
                    }
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Link to={`/kegiatan/${k.id}`} className="text-pkk hover:text-pkk-hover flex items-center gap-1 text-xs">
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
