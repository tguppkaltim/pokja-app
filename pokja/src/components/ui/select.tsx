"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, SearchIcon } from "lucide-react"

/**
 * Dropdown dengan kotak pencarian.
 *
 * Dibangun di atas Base UI Combobox, bukan Base UI Select: Select memakai
 * semantik listbox yang tidak mengizinkan kolom isian di dalam popup-nya.
 * Nama ekspornya tetap `Select*` supaya seluruh pemakaian yang sudah ada tidak
 * perlu diubah — bentuk propnya sama persis seperti sebelumnya.
 *
 *   <Select items={[{ value, label }]} value={v} onValueChange={setV}>
 *     <SelectTrigger><SelectValue placeholder="Pilih…" /></SelectTrigger>
 *     <SelectContent>
 *       {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
 *     </SelectContent>
 *   </Select>
 *
 * Penyaringan dikerjakan sendiri, bukan oleh Base UI, karena pemakainya
 * merender `SelectItem` sebagai children — bukan lewat koleksi item Base UI.
 * Prop `items` dipakai untuk mencari label tiap nilai.
 */

interface Opsi {
  value: string
  label: string
}

interface KonteksSelect {
  /** Label untuk sebuah nilai; jatuh ke nilainya sendiri kalau tak ada di `items`. */
  labelUntuk: (value: string) => string
  kueri: string
  setKueri: (kueri: string) => void
}

const SelectContext = React.createContext<KonteksSelect | null>(null)

function useSelectContext(bagian: string): KonteksSelect {
  const konteks = React.useContext(SelectContext)
  if (!konteks) {
    throw new Error(`${bagian} harus berada di dalam <Select>.`)
  }
  return konteks
}

function Select({
  items,
  children,
  onOpenChange,
  ...props
}: Omit<Combobox.Root.Props<string>, "items" | "filter"> & {
  items?: readonly Opsi[]
}) {
  const [kueri, setKueri] = React.useState("")

  const labelUntuk = React.useCallback(
    (value: string) => items?.find(i => i.value === value)?.label ?? String(value ?? ""),
    [items],
  )

  const konteks = React.useMemo<KonteksSelect>(
    () => ({ labelUntuk, kueri, setKueri }),
    [labelUntuk, kueri],
  )

  return (
    <SelectContext.Provider value={konteks}>
      <Combobox.Root<string>
        // Penyaringan bawaan dimatikan: ia bekerja atas prop `items`, sementara
        // yang dirender adalah children milik pemakai. Dua sumber itu bisa
        // berbeda, jadi hanya satu yang boleh memutuskan — lihat SelectContent.
        filter={null}
        // Dikendalikan, bukan sekadar dipantau. Kalau kueri hanya dicerminkan
        // lewat onInputValueChange, teks di kotak cari dan daftar yang tersaring
        // bisa berpisah: mereset kueri saat popup ditutup tidak ikut mengosongkan
        // input milik Base UI, sehingga popup terbuka lagi dengan teks lama
        // tetapi daftar penuh.
        inputValue={kueri}
        onInputValueChange={setKueri}
        onOpenChange={(terbuka, detail) => {
          // Kueri direset saat popup tertutup supaya pembukaan berikutnya
          // selalu mulai dari daftar penuh.
          if (!terbuka) setKueri("")
          onOpenChange?.(terbuka, detail)
        }}
        {...props}
      >
        {children}
      </Combobox.Root>
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: Combobox.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <Combobox.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <Combobox.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </Combobox.Trigger>
  )
}

function SelectValue({
  className,
  placeholder,
}: {
  className?: string
  placeholder?: React.ReactNode
}) {
  const { labelUntuk } = useSelectContext("SelectValue")
  return (
    // Combobox.Value tidak merender elemennya sendiri, jadi span ini yang
    // membawa data-slot yang dirujuk gaya di SelectTrigger.
    <span data-slot="select-value" className={cn("flex flex-1 text-left", className)}>
      <Combobox.Value>
        {(terpilih: string | null) =>
          terpilih === null || terpilih === undefined || terpilih === "" ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            labelUntuk(terpilih)
          )
        }
      </Combobox.Value>
    </span>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  // Hanya ada pada Base UI Select, tidak pada Combobox: popup combobox selalu
  // muncul di bawah pemicu. Sengaja diambil lalu dibuang supaya pemakaian lama
  // yang mengirimnya tidak perlu diubah, dan agar prop ini tidak ikut tersebar
  // ke elemen DOM.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  alignItemWithTrigger: _alignItemWithTrigger,
  ...props
}: Combobox.Popup.Props &
  Pick<Combobox.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> & {
    alignItemWithTrigger?: boolean
  }) {
  const { kueri, labelUntuk } = useSelectContext("SelectContent")

  const dicari = kueri.trim().toLowerCase()
  const semuaAnak = React.Children.toArray(children)

  // Disaring di sini, bukan di dalam SelectItem: hanya di tempat ini jumlah
  // hasil diketahui, dan tanpa itu daftar kosong tampil tanpa penjelasan.
  const terlihat =
    dicari === ""
      ? semuaAnak
      : semuaAnak.filter(anak => {
          if (!React.isValidElement<{ value?: unknown }>(anak)) return true
          const value = anak.props.value
          // Anak yang bukan pilihan (pemisah, label) dibiarkan lewat.
          if (typeof value !== "string") return true
          return labelUntuk(value).toLowerCase().includes(dicari)
        })

  return (
    <Combobox.Portal>
      <Combobox.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <Combobox.Popup
          data-slot="select-content"
          className={cn(
            "relative isolate z-50 flex max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-2.5">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <Combobox.Input
              placeholder="Cari…"
              className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {terlihat.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">
              Tidak ada yang cocok.
            </p>
          ) : (
            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-my-1 p-1">
              {terlihat}
            </Combobox.List>
          )}
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  )
}

function SelectItem({ className, children, ...props }: Combobox.Item.Props) {
  return (
    <Combobox.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="flex flex-1 shrink-0 gap-2">{children}</span>
      <Combobox.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </Combobox.ItemIndicator>
    </Combobox.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
