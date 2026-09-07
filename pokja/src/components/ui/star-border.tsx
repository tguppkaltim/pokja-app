import type { CSSProperties, ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * StarBorder — dua titik cahaya menyusuri tepi atas dan bawah.
 *
 * Diadaptasi dari React Bits (varian TypeScript + Tailwind).
 * Copyright (c) 2026 David Haz — MIT + Commons Clause.
 * https://reactbits.dev
 *
 * Perubahan dari sumbernya:
 *
 * 1. Elemen bawaannya `div`, bukan `button`. Di aplikasi ini pembungkusnya
 *    memuat logo pada layar pemuatan — tombol tanpa aksi menyesatkan pembaca
 *    layar, yang akan mengumumkannya sebagai sesuatu yang bisa ditekan.
 * 2. Warna bawaannya mengikuti merek PKK, bukan hitam-putih.
 * 3. `rounded-[20px]` diganti token radius Tailwind supaya seragam dengan
 *    kartu lain.
 *
 * Keyframes-nya didaftarkan di index.css lewat @theme Tailwind. Karena itu
 * animasi CSS — bukan JavaScript — penjaga prefers-reduced-motion di berkas
 * yang sama menghentikannya dengan sendirinya.
 */

interface Props {
  as?: ElementType
  className?: string
  children?: ReactNode
  /** Warna titik cahaya yang bergerak. */
  color?: string
  /** Lama satu putaran, mis. '6s'. */
  speed?: CSSProperties['animationDuration']
  /** Tebal celah tempat cahaya lewat, dalam piksel. */
  thickness?: number
  backgroundColor?: string
  borderColor?: string
}

export function StarBorder({
  as: Component = 'div',
  className,
  color = 'var(--pkk-soft)',
  speed = '5s',
  thickness = 2,
  backgroundColor = '#ffffff',
  borderColor = 'var(--pkk-border)',
  children,
}: Props) {
  return (
    <Component
      className={cn('relative inline-block overflow-hidden rounded-2xl', className)}
      style={{ padding: `${thickness}px 0` }}
    >
      <div
        className="animate-star-movement-bottom absolute right-[-250%] bottom-[-11px] z-0 h-1/2 w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="animate-star-movement-top absolute top-[-10px] left-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="relative z-[1] rounded-2xl border px-6 py-5 text-center"
        style={{ background: backgroundColor, borderColor }}
      >
        {children}
      </div>
    </Component>
  )
}
