import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Badge status realisasi.
 *
 * Sebelumnya fungsi ini ditulis ulang di empat halaman dan sudah menyimpang:
 * Dashboard menyebut status `tidak_terlaksana` sebagai "Belum Terlaksana",
 * sementara Laporan dan Detail Kegiatan menyebutnya "Tidak Terlaksana" untuk
 * data yang sama persis. Dua kata itu berbeda arti — "belum" berarti belum
 * dilaporkan, "tidak" berarti sudah dipastikan tidak berjalan — dan Dashboard
 * memang memakai "Belum Terlaksana" untuk hitungan sesi lewat tenggat yang
 * belum punya laporan. Memakai kata yang sama untuk dua hal berbeda membuat
 * angkanya tidak bisa dibaca.
 */

export type StatusTampil = 'terlaksana' | 'tidak_terlaksana' | 'menunggu' | null

const GAYA: Record<
  Exclude<StatusTampil, null>,
  { kelas: string; label: string }
> = {
  terlaksana: {
    kelas: 'bg-status-success-tint text-status-success border-status-success/25',
    label: '✓ Terlaksana',
  },
  tidak_terlaksana: {
    kelas: 'bg-status-danger-tint text-status-danger border-status-danger/25',
    label: '✗ Tidak Terlaksana',
  },
  menunggu: {
    kelas: 'bg-pkk-tint text-pkk-accent border-pkk-soft/40',
    label: '⏳ Menunggu',
  },
}

export function BadgeStatus({ status, className }: { status: StatusTampil; className?: string }) {
  if (status === null) {
    return (
      <Badge variant="outline" className={cn('border-gray-200 text-gray-400', className)}>
        —
      </Badge>
    )
  }
  const gaya = GAYA[status]
  return <Badge className={cn(gaya.kelas, className)}>{gaya.label}</Badge>
}

/**
 * Badge peringatan kuning untuk data yang perlu dilengkapi — kegiatan yang
 * belum dipetakan ke Program Prioritas, atau program pokok di luar master.
 * Isinya berbeda-beda, jadi teksnya lewat children.
 */
export function BadgePeringatan({
  children,
  title,
  className,
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      title={title}
      className={cn(
        'gap-1 border-status-warning/30 bg-status-warning-tint font-normal text-status-warning',
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {children}
    </Badge>
  )
}
