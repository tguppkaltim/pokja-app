import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Calendar, User, DollarSign, Building2, FileText, Handshake, Star, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatTanggalPanjang } from '@/lib/utils'
import { jalurPrioritas } from '@/lib/master-program'
import { menurutInduk } from '@/lib/urutkan'
import { BadgeStatus, BadgePeringatan } from '@/components/badge-status'
import { useAuth } from '@/contexts/auth-context'
import { bolehKelolaPokja } from '@/lib/hak-akses'
import { useData } from '@/contexts/data-context'
import { fetchKegiatanById, fetchRealisasi, fetchEvidence, fetchJadwal, fetchKegiatanMitra, fetchKegiatanWilayah } from '@/lib/db'
import type { Kegiatan, RealisasiKegiatan, EvidenceFile, JadwalKegiatan } from '@/types'
import { BULAN_FULL } from '@/lib/kalender'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function KegiatanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok, programUnggulan, programPrioritas, mitra: daftarMitra, wilayah: daftarWilayah } = useData()
  const [kegiatan, setKegiatan] = useState<Kegiatan | null>(null)
  const [mitraKegiatan, setMitraKegiatan] = useState<number[]>([])
  const [wilayahKegiatan, setWilayahKegiatan] = useState<number[]>([])
  const [realisasiList, setRealisasiList] = useState<RealisasiKegiatan[]>([])
  const [jadwalList, setJadwalList] = useState<JadwalKegiatan[]>([])
  const [evidenceMap, setEvidenceMap] = useState<Record<number, EvidenceFile[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const kegId = parseInt(id)
    Promise.all([
      fetchKegiatanById(kegId),
      fetchRealisasi({ kegiatanId: kegId }),
      fetchJadwal({ kegiatanId: kegId }),
      fetchKegiatanMitra([kegId]),
      fetchKegiatanWilayah([kegId]),
    ]).then(async ([k, realisasi, jadwal, kaitan, lokus]) => {
      setKegiatan(k)
      setJadwalList(jadwal)
      setMitraKegiatan(kaitan.map(m => m.mitra_id))
      setWilayahKegiatan(lokus.map(w => w.wilayah_id))
      setRealisasiList(realisasi.sort((a, b) => a.bulan - b.bulan))
      const evMap: Record<number, EvidenceFile[]> = {}
      await Promise.all(realisasi.map(async r => {
        evMap[r.id] = await fetchEvidence(r.id)
      }))
      setEvidenceMap(evMap)
    }).finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat data...</div>

  if (!kegiatan) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Kegiatan tidak ditemukan.</p>
        <Button onClick={() => navigate(-1)} variant="ghost" className="text-pkk mt-2">Kembali</Button>
      </div>
    )
  }

  const pokja = pokjaList.find(p => p.id === kegiatan.pokja_id)
  const program = programPokok.find(p => p.id === kegiatan.program_pokok_id)
  const jalur = jalurPrioritas(kegiatan.program_prioritas_id, {
    pokja: pokjaList, programPokok, programUnggulan, programPrioritas,
  })

  // Anggaran aktual kegiatan = jumlah anggaran aktual seluruh sesi terlaksana.
  const anggaranAktual = realisasiList
    .filter(r => r.status === 'terlaksana')
    .reduce((sum, r) => sum + r.anggaran_aktual, 0)
  // null bila kegiatan tidak punya rencana anggaran — serapannya tak terdefinisi.
  const pctSerapan = kegiatan.anggaran > 0 ? Math.round((anggaranAktual / kegiatan.anggaran) * 100) : null
  const canEdit = bolehKelolaPokja(user, kegiatan.pokja_id)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        {canEdit && (
          <Link to={`/kegiatan/${kegiatan.id}/edit`} className={cn(buttonVariants({ size: 'sm' }), 'bg-pkk hover:bg-pkk-hover text-white')}>
            <Pencil className="w-4 h-4 mr-1" /> Edit Kegiatan
          </Link>
        )}
      </div>

      <Card className="border-pkk-border">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="border-pkk-soft text-pkk-accent">{pokja?.name}</Badge>
                <Badge className="bg-pkk-tint text-pkk">{program?.name}</Badge>
                {!jalur && (
                  <BadgePeringatan title="Kegiatan ini dibuat sebelum master program diadopsi.">
                    Belum dipetakan
                  </BadgePeringatan>
                )}
              </div>
              {jalur && (
                <p className="text-xs text-gray-500 mb-2">
                  {jalur.unggulan.name} <span className="text-gray-300">›</span>{' '}
                  <span className="text-gray-700">{jalur.prioritas.name}</span>
                </p>
              )}
              <CardTitle className="text-xl leading-snug text-gray-800">
                {kegiatan.isu_strategis && (
                  <Star
                    aria-label="Isu strategis"
                    className="mr-1.5 -mt-1 inline h-4 w-4 fill-pkk text-pkk"
                  />
                )}
                {kegiatan.nama_kegiatan}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2 text-sm">
              <User className="w-4 h-4 text-pkk-accent mt-0.5 shrink-0" />
              <div><p className="text-gray-400 text-xs">Sasaran</p><p className="text-gray-700">{kegiatan.sasaran || '-'}</p></div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="w-4 h-4 text-pkk-accent mt-0.5 shrink-0" />
              <div><p className="text-gray-400 text-xs">Pelaksana</p><p className="text-gray-700">{kegiatan.pelaksana || '-'}</p></div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-pkk-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-400 text-xs">Lokus</p>
                {wilayahKegiatan.length > 0 ? (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {menurutInduk(daftarWilayah, wilayahKegiatan).map(w => (
                      <Badge key={w.id} variant="outline" className="border-pkk-border text-pkk text-xs font-normal">
                        {w.nama}
                      </Badge>
                    ))}
                  </div>
                ) : <p className="text-gray-700">-</p>}
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Handshake className="w-4 h-4 text-pkk-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-400 text-xs">Mitra / OPD</p>
                {mitraKegiatan.length > 0 ? (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {menurutInduk(daftarMitra, mitraKegiatan).map(m => (
                      <Badge key={m.id} variant="outline" className="border-pkk-border text-pkk text-xs font-normal">
                        {m.nama}
                      </Badge>
                    ))}
                  </div>
                ) : <p className="text-gray-700">-</p>}
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-pkk-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Anggaran</p>
                <p className="text-gray-700 font-medium">{formatRupiah(kegiatan.anggaran)} <span className="text-xs font-normal text-gray-400">rencana</span></p>
                <p className="text-pkk font-medium">
                  {formatRupiah(anggaranAktual)} <span className="text-xs font-normal text-gray-400">aktual &middot; serapan {pctSerapan === null ? '—' : `${pctSerapan}%`}</span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-pkk-accent mt-0.5 shrink-0" />
              <div><p className="text-gray-400 text-xs">Tahun</p><p className="text-gray-700">{kegiatan.tahun}</p></div>
            </div>
          </div>

          {/* Hanya muncul kalau diisi: baris "Deskripsi: -" yang selalu ada
              hanya menambah kebisingan pada kegiatan yang tidak memerlukannya. */}
          {kegiatan.deskripsi && (
            <>
              <Separator className="bg-pkk-tint" />
              <div>
                <p className="mb-1 text-xs text-gray-400">Deskripsi Kegiatan</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {kegiatan.deskripsi}
                </p>
              </div>
            </>
          )}

          <Separator className="bg-pkk-tint" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-pkk-accent" />
              <p className="text-sm font-medium text-gray-700">Jadwal Pelaksanaan</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {jadwalList.length === 0 && <span className="text-sm text-gray-400">Belum ada jadwal.</span>}
              {jadwalList.map(j => {
                const sudah = realisasiList.some(r => r.jadwal_id === j.id)
                return (
                  <span
                    key={j.id}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${sudah ? 'bg-pkk text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {formatTanggalPanjang(j.tanggal)}
                  </span>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-pkk-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-pkk">Riwayat Realisasi {kegiatan.tahun}</CardTitle>
            {canEdit && (
              <Link to="/realisasi" className="text-sm text-pkk border border-pkk-soft hover:bg-pkk-tint px-3 py-1 rounded-lg transition-colors">
                + Input Realisasi
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {realisasiList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada realisasi yang diinput.</p>
          ) : (
            <div className="space-y-3">
              {realisasiList.map(r => {
                const evidences = evidenceMap[r.id] ?? []
                return (
                  <div key={r.id} className="border border-pkk-border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Judul memakai tanggal sesi, bukan bulan: satu bulan kini
                            bisa punya beberapa sesi dan judul bulan jadi kembar. */}
                        <p className="font-medium text-gray-800 text-sm">
                          Sesi {jadwalList.find(j => j.id === r.jadwal_id)
                            ? formatTanggalPanjang(jadwalList.find(j => j.id === r.jadwal_id)!.tanggal)
                            : `${BULAN_FULL[r.bulan - 1]} ${r.tahun}`}
                        </p>
                        {r.tanggal_pelaksanaan && (
                          <p className="text-xs text-gray-400">
                            Dilaksanakan: {formatTanggalPanjang(r.tanggal_pelaksanaan)}
                          </p>
                        )}
                      </div>
                      <BadgeStatus status={r.status} />
                    </div>
                    {r.status === 'terlaksana' && (
                      <p className="text-xs text-gray-500">
                        Anggaran aktual: <span className="font-medium text-pkk">{formatRupiah(r.anggaran_aktual)}</span>
                      </p>
                    )}
                    {r.lokasi && (
                      <p className="flex items-start gap-1 text-xs text-gray-500">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-pkk-accent" />
                        <span>{r.lokasi}</span>
                      </p>
                    )}
                    {r.catatan && <p className="text-sm text-gray-600 bg-pkk-surface rounded px-3 py-2">{r.catatan}</p>}
                    {evidences.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {evidences.map(e => (
                          <div key={e.id} className="flex items-center gap-1.5 text-xs bg-pkk-tint text-pkk-accent px-2 py-1 rounded">
                            <FileText className="w-3 h-3" />
                            {e.file_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
