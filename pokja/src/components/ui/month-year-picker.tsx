import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export interface MonthYear {
  month: number // 1-12
  year: number
}

interface MonthYearPickerProps {
  value: MonthYear | undefined
  onChange: (val: MonthYear | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minYear?: number
  maxYear?: number
}

export function MonthYearPicker({
  value,
  onChange,
  placeholder = 'Pilih bulan & tahun...',
  disabled = false,
  className,
  minYear = 2020,
  maxYear = 2030,
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value?.year ?? new Date().getFullYear())

  function handleSelect(month: number, year: number) {
    onChange({ month, year })
    setOpen(false)
  }

  const label = value ? `${BULAN_FULL[value.month - 1]} ${value.year}` : placeholder

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
        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
        {label}
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" align="start">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setViewYear(y => Math.max(minYear, y - 1))}
            disabled={viewYear <= minYear}
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-[#1B6B35]">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear(y => Math.min(maxYear, y + 1))}
            disabled={viewYear >= maxYear}
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {BULAN_SHORT.map((bln, idx) => {
            const m = idx + 1
            const isSelected = value?.month === m && value?.year === viewYear
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSelect(m, viewYear)}
                className={cn(
                  'h-9 rounded-lg text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-[#1B6B35] text-white'
                    : 'hover:bg-[#EAF5EC] hover:text-[#1B6B35] text-gray-700'
                )}
              >
                {bln}
              </button>
            )
          })}
        </div>

        {/* Clear */}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(undefined); setOpen(false) }}
            className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
          >
            Hapus pilihan
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
