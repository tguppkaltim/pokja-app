// Dipisahkan dari komponennya agar berkas komponen hanya mengekspor
// komponen. Fast refresh React berhenti bekerja untuk seluruh berkas
// kalau ada ekspor non-komponen di dalamnya.
import { cva } from "class-variance-authority"

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export { tabsListVariants }
