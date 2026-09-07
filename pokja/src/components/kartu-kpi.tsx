import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Kartu angka ringkas: label, angka besar, lencana ikon, dan satu baris
 * keterangan di bawahnya.
 *
 * Sebelumnya markup ini disalin enam kali di Dashboard dan sudah mulai
 * menyimpang — ada yang memakai `text-3xl`, ada yang `text-2xl`, dan padding
 * lencananya berbeda-beda.
 */

export type NadaKPI = 'merek' | 'aksen' | 'berhasil' | 'bahaya'

/** Nada hanya memilih warna; strukturnya selalu sama. */
const NADA: Record<NadaKPI, { angka: string; lencana: string; ikon: string }> = {
  merek: { angka: 'text-pkk', lencana: 'bg-pkk-tint', ikon: 'text-pkk' },
  aksen: { angka: 'text-pkk-accent', lencana: 'bg-pkk-tint', ikon: 'text-pkk-accent' },
  berhasil: { angka: 'text-status-success', lencana: 'bg-status-success-tint', ikon: 'text-status-success' },
  bahaya: { angka: 'text-status-danger', lencana: 'bg-status-danger-tint', ikon: 'text-status-danger' },
}

interface Props {
  label: string
  nilai: ReactNode
  ikon: LucideIcon
  nada?: NadaKPI
  /** Baris di bawah angka: keterangan kecil, bilah kemajuan, atau keduanya. */
  keterangan?: ReactNode
  /**
   * Angka rupiah jauh lebih panjang daripada cacahan sesi. Tanpa ini, nilai
   * seperti "Rp 1.250.000.000" terpotong di kartu selebar seperempat layar.
   */
  ringkas?: boolean
}

export function KartuKPI({ label, nilai, ikon: Ikon, nada = 'merek', keterangan, ringkas }: Props) {
  const warna = NADA[nada]
  return (
    <Card className="border-pkk-border transisi-kartu hover:border-pkk-soft hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          {/* flex-1 penting: tanpa itu kolom ini menyusut ke lebar teks
              terpanjangnya, dan bilah kemajuan di `keterangan` ikut memendek
              jadi sepotong kecil di tengah kartu yang lebar. */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={cn('mt-1 font-bold', ringkas ? 'text-2xl' : 'text-3xl', warna.angka)}>
              {nilai}
            </p>
            {keterangan && <div className="mt-1 text-xs text-gray-400">{keterangan}</div>}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              warna.lencana,
            )}
          >
            <Ikon className={cn('h-5 w-5', warna.ikon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
