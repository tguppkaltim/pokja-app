import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Mitra } from '@/types'

/**
 * Pemilih mitra/OPD banyak-nilai.
 *
 * Bentuknya menyalin pemilih jadwal di form yang sama — dropdown untuk
 * menambah, badge dengan tombol silang untuk melepas — supaya dua kendali
 * banyak-nilai di satu halaman tidak bekerja dengan cara yang berbeda.
 */

interface Props {
  /** Seluruh mitra dari master. Yang nonaktif disaring di sini. */
  daftarMitra: Mitra[]
  terpilih: number[]
  onChange: (mitraIds: number[]) => void
  disabled?: boolean
}

export function PilihMitra({ daftarMitra, terpilih, onChange, disabled }: Props) {
  const perId = new Map(daftarMitra.map(m => [m.id, m]))

  // Mitra nonaktif tidak lagi ditawarkan, tapi yang sudah terlanjur terpilih
  // tetap ditampilkan: kegiatan lama harus tetap menyebut mitranya meski kerja
  // samanya sudah berakhir.
  const bisaDipilih = daftarMitra.filter(m => m.aktif && !terpilih.includes(m.id))
  const items = bisaDipilih.map(m => ({ value: String(m.id), label: m.nama }))

  function tambah(nilai: string) {
    const id = parseInt(nilai)
    if (!terpilih.includes(id)) onChange([...terpilih, id])
  }

  if (daftarMitra.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-pkk-border px-3 py-2 text-xs text-gray-500">
        Daftar mitra masih kosong. Isi lebih dulu lewat Administrasi › Master Mitra.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        items={items}
        // Nilainya sengaja dikosongkan lagi setiap kali: kendali ini menambah
        // ke daftar, bukan menyimpan satu pilihan. Membiarkannya terisi membuat
        // pemicu menampilkan mitra yang sudah jadi chip di bawahnya.
        value=""
        onValueChange={v => v && tambah(v)}
        disabled={disabled || bisaDipilih.length === 0}
      >
        <SelectTrigger className="border-pkk-border">
          <SelectValue
            placeholder={
              bisaDipilih.length === 0
                ? 'Semua mitra aktif sudah dipilih'
                : 'Pilih mitra/OPD...'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {items.map(i => (
            <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {terpilih.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {terpilih.map(id => {
            const m = perId.get(id)
            // Mitra yang tidak lagi ada di master — misalnya terhapus lewat
            // jalur lain — tetap ditampilkan sebagai id, bukan hilang diam-diam.
            const nama = m?.nama ?? `Mitra #${id}`
            return (
              <Badge
                key={id}
                className="gap-1.5 rounded-full bg-pkk py-1 pl-3 pr-1.5 text-sm text-white [a&]:hover:bg-pkk"
              >
                <span>{nama}</span>
                {m && !m.aktif && <span className="text-[10px] text-white/70">(nonaktif)</span>}
                <button
                  type="button"
                  aria-label={`Lepas ${nama}`}
                  onClick={() => onChange(terpilih.filter(x => x !== id))}
                  className="rounded-full p-0.5 transition-colors hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Belum ada mitra dipilih. Boleh dikosongkan.</p>
      )}
    </div>
  )
}
