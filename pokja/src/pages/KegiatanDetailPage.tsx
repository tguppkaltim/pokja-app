import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Calendar, User, DollarSign, Building2, FileText } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { mockKegiatan, mockPokja, mockProgramPokok, mockRealisasi, mockEvidence, mockUsers, BULAN_FULL, BULAN_LABELS, SCHED_KEYS } from '@/data/mockData'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'terlaksana') return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Terlaksana</Badge>
  if (status === 'tidak_terlaksana') return <Badge className="bg-red-100 text-red-700 border-red-200">✗ Tidak Terlaksana</Badge>
  return <Badge variant="outline" className="text-gray-400">—</Badge>
}

export default function KegiatanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const kegiatan = mockKegiatan.find(k => k.id === parseInt(id ?? ''))
  if (!kegiatan) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Kegiatan tidak ditemukan.</p>
        <Button onClick={() => navigate(-1)} variant="ghost" className="text-[#1B6B35] mt-2">Kembali</Button>
      </div>
    )
  }

  const pokja = mockPokja.find(p => p.id === kegiatan.pokja_id)
  const program = mockProgramPokok.find(p => p.id === kegiatan.program_pokok_id)
  const creator = mockUsers.find(u => u.id === kegiatan.created_by)
  const realisasiList = mockRealisasi
    .filter(r => r.kegiatan_id === kegiatan.id && r.tahun === 2026)
    .sort((a, b) => a.bulan - b.bulan)

  const jadwal = SCHED_KEYS
    .map((key, idx) => kegiatan[key] ? idx + 1 : null)
    .filter(Boolean) as number[]

  const canEdit = user?.role === 'super_admin' ||
    (user?.role === 'operator' && user.pokja_id === kegiatan.pokja_id)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        {canEdit && (
          <Link
            to={`/kegiatan/${kegiatan.id}/edit`}
            className={cn(buttonVariants({ size: 'sm' }), 'bg-[#1B6B35] hover:bg-[#134D26] text-white')}
          >
            <Pencil className="w-4 h-4 mr-1" /> Edit Kegiatan
          </Link>
        )}
      </div>

      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="border-[#52B788] text-[#2E8B57]">{pokja?.name}</Badge>
                <Badge className="bg-[#EAF5EC] text-[#1B6B35]">{program?.name}</Badge>
              </div>
              <CardTitle className="text-xl text-gray-800 leading-snug">{kegiatan.nama_kegiatan}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2 text-sm">
              <User className="w-4 h-4 text-[#2E8B57] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Sasaran</p>
                <p className="text-gray-700">{kegiatan.sasaran || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#2E8B57] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Pelaksana</p>
                <p className="text-gray-700">{kegiatan.pelaksana || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-[#2E8B57] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Anggaran</p>
                <p className="text-gray-700 font-medium">{formatRupiah(kegiatan.anggaran)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-[#2E8B57] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Dibuat oleh</p>
                <p className="text-gray-700">{creator?.full_name ?? '-'}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-[#EAF5EC]" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#2E8B57]" />
              <p className="text-sm font-medium text-gray-700">Jadwal Pelaksanaan</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BULAN_LABELS.map((b, idx) => {
                const isScheduled = jadwal.includes(idx + 1)
                return (
                  <span
                    key={idx}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isScheduled
                        ? 'bg-[#1B6B35] text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {b}
                  </span>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Realisasi */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#1B6B35]">Riwayat Realisasi 2026</CardTitle>
            {canEdit && (
              <Link
                to="/realisasi"
                className="text-sm text-[#1B6B35] border border-[#52B788] hover:bg-[#EAF5EC] px-3 py-1 rounded-lg transition-colors"
              >
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
                const evidences = mockEvidence.filter(e => e.realisasi_id === r.id)
                return (
                  <div key={r.id} className="border border-[#d1e8d5] rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{BULAN_FULL[r.bulan - 1]} {r.tahun}</p>
                        {r.tanggal_pelaksanaan && (
                          <p className="text-xs text-gray-400">
                            Dilaksanakan: {new Date(r.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.catatan && (
                      <p className="text-sm text-gray-600 bg-[#F6FBF7] rounded px-3 py-2">{r.catatan}</p>
                    )}
                    {evidences.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {evidences.map(e => (
                          <div key={e.id} className="flex items-center gap-1.5 text-xs bg-[#EAF5EC] text-[#2E8B57] px-2 py-1 rounded">
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
