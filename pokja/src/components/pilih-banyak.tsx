import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * Pemilih banyak-nilai berbentuk chip: dropdown untuk menambah, badge dengan
 * tombol silang untuk melepas.
 *
 * Dipakai untuk Mitra/OPD dan Lokus. Keduanya semula akan jadi dua komponen
 * yang isinya sama persis kecuali kata-katanya — satu komponen dengan teks
 * yang bisa diatur lebih baik daripada dua salinan yang lambat laun menyimpang.
 *
 * Bentuknya menyalin pemilih jadwal di form yang sama, supaya kendali
 * banyak-nilai di satu halaman tidak bekerja dengan cara yang berbeda-beda.
 */

export interface OpsiPilihan {
  id: number
  label: string
  /** Kata lain yang ikut dicari selain label; tidak ditampilkan. */
  cari?: string
  /** Tidak ditawarkan lagi, tapi tetap tampil kalau sudah terlanjur dipilih. */
  nonaktif?: boolean
}

interface Props {
  opsi: OpsiPilihan[]
  terpilih: number[]
  onChange: (ids: number[]) => void
  /** Teks pemicu saat masih ada yang bisa dipilih. */
  placeholder: string
  /** Teks pemicu saat semua sudah dipilih. */
  placeholderHabis: string
  /** Ditampilkan menggantikan seluruh kendali kalau daftarnya memang kosong. */
  pesanKosong: string
  /** Ditampilkan di bawah pemicu saat belum ada yang dipilih. */
  pesanBelumDipilih: string
  disabled?: boolean
}

export function PilihBanyak({
  opsi,
  terpilih,
  onChange,
  placeholder,
  placeholderHabis,
  pesanKosong,
  pesanBelumDipilih,
  disabled,
}: Props) {
  const perId = new Map(opsi.map(o => [o.id, o]))

  // Yang nonaktif tidak ditawarkan lagi, tapi yang sudah terlanjur dipilih
  // tetap ditampilkan: data lama harus tetap menyebut apa yang dulu dipilih.
  const bisaDipilih = opsi.filter(o => !o.nonaktif && !terpilih.includes(o.id))
  const items = bisaDipilih.map(o => ({ value: String(o.id), label: o.label, cari: o.cari }))

  // Chip mengikuti urutan daftar induk, bukan urutan pemilihan: satu kegiatan
  // harus tampil sama di form, tabel, dan halaman rinci. Nilai yang tidak lagi
  // ada di master diletakkan di belakang, bukan dihilangkan diam-diam.
  const terpilihUrut = [
    ...opsi.filter(o => terpilih.includes(o.id)).map(o => o.id),
    ...terpilih.filter(id => !perId.has(id)),
  ]

  if (opsi.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-pkk-border px-3 py-2 text-xs text-gray-500">
        {pesanKosong}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        items={items}
        // Sengaja dikosongkan lagi setiap kali: kendali ini menambah ke daftar,
        // bukan menyimpan satu pilihan. Membiarkannya terisi membuat pemicu
        // menampilkan nilai yang sudah jadi chip di bawahnya.
        value=""
        onValueChange={v => {
          if (!v) return
          const id = parseInt(v)
          if (!terpilih.includes(id)) onChange([...terpilih, id])
        }}
        disabled={disabled || bisaDipilih.length === 0}
      >
        <SelectTrigger className="border-pkk-border">
          <SelectValue placeholder={bisaDipilih.length === 0 ? placeholderHabis : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map(i => (
            <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {terpilih.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {terpilihUrut.map(id => {
            const o = perId.get(id)
            const label = o?.label ?? `#${id}`
            return (
              <Badge
                key={id}
                className="gap-1.5 rounded-full bg-pkk py-1 pl-3 pr-1.5 text-sm text-white [a&]:hover:bg-pkk"
              >
                <span>{label}</span>
                {o?.nonaktif && <span className="text-[10px] text-white/70">(nonaktif)</span>}
                <button
                  type="button"
                  aria-label={`Lepas ${label}`}
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
        <p className="text-xs text-gray-400">{pesanBelumDipilih}</p>
      )}
    </div>
  )
}
