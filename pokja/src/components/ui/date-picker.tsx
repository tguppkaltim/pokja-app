import { useState } from 'react'
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { id } from 'date-fns/locale'
import 'react-day-picker/style.css'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const BULAN_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatTanggal(date: Date) {
  return `${date.getDate()} ${BULAN_FULL[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Rentang tahun yang bisa dipilih kalau pemanggilnya tidak menentukan.
 *
 * Ke belakang untuk mencatat kegiatan yang sudah lewat, ke depan untuk
 * menyusun rencana tahun berikutnya. Tanpa batas apa pun, daftar tahunnya
 * tak berujung dan justru lebih sulit dipakai daripada dua tombol panah.
 */
const MUNDUR_TAHUN = 5
const MAJU_TAHUN = 5

const awalBulan = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

/** Selisih bulan a → b; negatif berarti a lebih dulu. */
const selisihBulan = (a: Date, b: Date) =>
  (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth())

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  startMonth?: Date
  endMonth?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal...',
  disabled = false,
  className,
  startMonth,
  endMonth,
}: DatePickerProps) {
  // Batas rentang. Pemanggil boleh menyempitkannya lewat startMonth/endMonth;
  // kalau tidak, dipakai rentang bawaan di sekitar tahun berjalan.
  const tahunIni = new Date().getFullYear()
  const batasAwal = awalBulan(startMonth ?? new Date(tahunIni - MUNDUR_TAHUN, 0, 1))
  const batasAkhir = awalBulan(endMonth ?? new Date(tahunIni + MAJU_TAHUN, 11, 1))

  const jepit = (d: Date) => {
    if (selisihBulan(d, batasAwal) < 0) return batasAwal
    if (selisihBulan(d, batasAkhir) > 0) return batasAkhir
    return d
  }

  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(value ?? new Date())

  // Selalu dibaca lewat jepit(), bukan langsung dari state. Bulan awalnya
  // adalah hari ini, yang belum tentu masuk rentang — picker dengan rentang
  // Mar–Jun bisa terbuka di September, menampilkan kalender yang seluruh
  // harinya mati. Menjepit saat render juga menutup kemungkinan rentangnya
  // berubah setelah state terlanjur terisi.
  const bulanAktif = jepit(awalBulan(month))

  function handleSelect(date: Date | undefined) {
    onChange(date)
    if (date) setOpen(false)
  }

  const daftarTahun: number[] = []
  for (let t = batasAwal.getFullYear(); t <= batasAkhir.getFullYear(); t++) daftarTahun.push(t)

  // Bulan di tahun batas ikut dipangkas: pada rentang yang berakhir Juni,
  // memilih Desember hanya menampilkan kalender yang seluruh harinya mati.
  const bulanTerawal = bulanAktif.getFullYear() === batasAwal.getFullYear() ? batasAwal.getMonth() : 0
  const bulanTerakhir = bulanAktif.getFullYear() === batasAkhir.getFullYear() ? batasAkhir.getMonth() : 11

  const pindahBulan = (langkah: number) =>
    setMonth(jepit(new Date(bulanAktif.getFullYear(), bulanAktif.getMonth() + langkah, 1)))

  // Berpindah tahun bisa membuat bulannya jatuh di luar rentang — misalnya
  // sedang di Desember lalu pindah ke tahun yang batasnya Juni.
  const pilihTahun = (tahun: number) =>
    setMonth(jepit(new Date(tahun, bulanAktif.getMonth(), 1)))

  const pilihBulan = (bulan: number) =>
    setMonth(jepit(new Date(bulanAktif.getFullYear(), bulan, 1)))

  const bisaMundur = selisihBulan(bulanAktif, batasAwal) > 0
  const bisaMaju = selisihBulan(bulanAktif, batasAkhir) < 0

  const kelasPilihan =
    'cursor-pointer appearance-none rounded-lg bg-transparent py-1 pl-2 pr-6 text-sm font-semibold text-pkk ' +
    'transition-colors hover:bg-pkk-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pkk-soft'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              'flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-left transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        {value ? formatTanggal(value) : placeholder}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        {/* Header navigasi bulan.
            Bulan dan tahun bisa dipilih langsung, bukan hanya digeser satu per
            satu — mencari Maret tahun lalu lewat tombol panah butuh 18 klik.
            Panahnya tetap ada untuk langkah pendek yang lebih cepat.

            Memakai <select> bawaan peramban, bukan komponen Select aplikasi:
            kendali ini berada di dalam popover, dan popup di dalam popup
            saling berebut penutupan saat diklik. <select> bawaan digambar
            peramban di luar halaman sehingga bebas dari masalah itu, sekaligus
            langsung enak dipakai di ponsel. */}
        <div className="flex items-center justify-between gap-1 border-b border-border/50 px-2 pt-2 pb-1.5">
          <button
            type="button"
            onClick={() => pindahBulan(-1)}
            disabled={!bisaMundur}
            aria-label="Bulan sebelumnya"
            className="rounded-lg p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-0.5">
            <div className="relative">
              <select
                value={bulanAktif.getMonth()}
                onChange={e => pilihBulan(parseInt(e.target.value))}
                aria-label="Bulan"
                className={kelasPilihan}
              >
                {BULAN_FULL.map((nama, i) => (
                  <option key={nama} value={i} disabled={i < bulanTerawal || i > bulanTerakhir}>
                    {nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pkk-soft" />
            </div>

            <div className="relative">
              <select
                value={bulanAktif.getFullYear()}
                onChange={e => pilihTahun(parseInt(e.target.value))}
                aria-label="Tahun"
                className={kelasPilihan}
              >
                {daftarTahun.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pkk-soft" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => pindahBulan(1)}
            disabled={!bisaMaju}
            aria-label="Bulan berikutnya"
            className="rounded-lg p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={bulanAktif}
          onMonthChange={setMonth}
          locale={id}
          hideNavigation
          startMonth={batasAwal}
          endMonth={batasAkhir}
          classNames={{
            root: 'p-3',
            // hideNavigation hanya membuang tombol panahnya, bukan judulnya —
            // tanpa ini "September 2026" tampil dua kali, sekali di header di
            // atas dan sekali lagi di sini. Disembunyikan secara visual saja,
            // bukan dibuang: react-day-picker memakainya sebagai live region
            // yang membacakan perpindahan bulan ke pembaca layar.
            month_caption: 'sr-only',
            weekdays: 'flex mb-1',
            weekday: 'flex-1 text-center text-xs text-muted-foreground font-medium pb-1.5',
            weeks: 'space-y-1',
            week: 'flex',
            day: 'flex-1 flex justify-center',
            day_button: cn(
              'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
              'hover:bg-pkk-tint hover:text-pkk cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pkk-soft'
            ),
            selected: '[&>button]:!bg-pkk [&>button]:!text-white [&>button]:hover:!bg-pkk-hover',
            today: '[&>button]:font-bold [&>button]:text-pkk',
            outside: 'opacity-30',
            disabled: 'opacity-30 cursor-not-allowed',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
