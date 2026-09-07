import { motion, useReducedMotion, type Transition, type Easing } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * BlurText — teks yang muncul kata demi kata dari keadaan buram.
 *
 * Diadaptasi dari React Bits (varian TypeScript + Tailwind).
 * Copyright (c) 2026 David Haz — MIT + Commons Clause.
 * https://reactbits.dev
 *
 * Tiga perubahan dari sumbernya:
 *
 * 1. Menghormati `prefers-reduced-motion`. Versi aslinya selalu menganimasikan.
 *    Penjaga reduced-motion di index.css tidak menolong di sini: penjaga itu
 *    hanya menekan transisi dan animasi CSS, sedangkan motion menganimasikan
 *    lewat JavaScript. Jadi pemeriksaannya harus eksplisit.
 * 2. Gaya inline diganti utilitas Tailwind.
 * 3. Kelas penanda `blur-text` dibuang — itu kait untuk varian CSS-nya, tidak
 *    dipakai di varian Tailwind.
 */

type BlurTextProps = {
  text?: string
  /** Jeda antar kata dalam milidetik. */
  delay?: number
  className?: string
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  rootMargin?: string
  animationFrom?: Record<string, string | number>
  animationTo?: Array<Record<string, string | number>>
  easing?: Easing | Easing[]
  onAnimationComplete?: () => void
  stepDuration?: number
  /** Elemen pembungkus. Judul halaman sebaiknya h1, bukan p. */
  as?: 'p' | 'h1' | 'h2'
}

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>,
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))])
  const keyframes: Record<string, Array<string | number>> = {}
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])]
  })
  return keyframes
}

export function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  as: Wrapper = 'p',
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const kurangiGerak = useReducedMotion()

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction],
  )

  const defaultTo = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction],
  )

  // Tanpa gerak: teksnya langsung utuh. Judul halaman tidak boleh bergantung
  // pada animasi untuk bisa terbaca.
  if (kurangiGerak) {
    return <Wrapper className={cn('flex flex-wrap', className)}>{text}</Wrapper>
  }

  const fromSnapshot = animationFrom ?? defaultFrom
  const toSnapshots = animationTo ?? defaultTo
  const stepCount = toSnapshots.length + 1
  const totalDuration = stepDuration * (stepCount - 1)
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)))
  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots)

  return (
    <Wrapper ref={ref as never} className={cn('flex flex-wrap', className)}>
      {elements.map((segment, index) => {
        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing,
        }
        return (
          <motion.span
            key={index}
            className="inline-block will-change-[transform,filter,opacity]"
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          >
            {segment === ' ' ? ' ' : segment}
            {animateBy === 'words' && index < elements.length - 1 && ' '}
          </motion.span>
        )
      })}
    </Wrapper>
  )
}
