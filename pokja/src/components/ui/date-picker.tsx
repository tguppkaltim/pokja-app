import { useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(value ?? new Date())

  function handleSelect(date: Date | undefined) {
    onChange(date)
    if (date) setOpen(false)
  }

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
        {/* Header navigasi bulan */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1 border-b border-border/50">
          <button
            type="button"
            onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-[#1B6B35]">
            {BULAN_FULL[month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          locale={id}
          hideNavigation
          startMonth={startMonth}
          endMonth={endMonth}
          classNames={{
            root: 'p-3',
            weekdays: 'flex mb-1',
            weekday: 'flex-1 text-center text-xs text-muted-foreground font-medium pb-1.5',
            weeks: 'space-y-1',
            week: 'flex',
            day: 'flex-1 flex justify-center',
            day_button: cn(
              'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
              'hover:bg-[#EAF5EC] hover:text-[#1B6B35] cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52B788]'
            ),
            selected: '[&>button]:!bg-[#1B6B35] [&>button]:!text-white [&>button]:hover:!bg-[#134D26]',
            today: '[&>button]:font-bold [&>button]:text-[#1B6B35]',
            outside: 'opacity-30',
            disabled: 'opacity-30 cursor-not-allowed',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
