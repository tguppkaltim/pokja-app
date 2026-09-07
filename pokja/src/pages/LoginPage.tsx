import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BlurText } from '@/components/ui/blur-text'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const kurangiGerak = useReducedMotion()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email dan password harus diisi.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setIsLoading(false)
    }
  }

  // Gerak dimatikan seluruhnya kalau perangkat memintanya. motion menganimasikan
  // lewat JavaScript, jadi penjaga prefers-reduced-motion di index.css — yang
  // hanya menekan animasi CSS — tidak berlaku di sini.
  const masuk = (jeda: number) =>
    kurangiGerak
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay: jeda, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pkk-surface p-4 lg:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-pkk-border lg:grid-cols-2">
        {/* ── Kiri: form ─────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-16">
          <motion.div {...masuk(0)} className="mb-10 flex items-center gap-2.5">
            <img src="/logo-pemprov.png" alt="" className="h-8 w-auto" />
            <span className="text-sm font-bold text-pkk">SIM PKK Kalimantan Timur</span>
          </motion.div>

          <BlurText
            as="h1"
            text="Selamat Datang Kembali"
            delay={110}
            className="max-w-sm text-4xl leading-tight font-bold tracking-tight text-gray-900 sm:text-5xl"
          />

          <motion.p {...masuk(0.5)} className="mt-4 text-sm text-gray-500">
            Masuk untuk melanjutkan ke sistem monitoring TP PKK Provinsi Kalimantan Timur.
          </motion.p>

          <motion.form {...masuk(0.62)} onSubmit={handleSubmit} className="mt-9 max-w-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@pkk-kaltim.go.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 border-pkk-border focus-visible:ring-pkk-soft"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-pkk-border pr-10 focus-visible:ring-pkk-soft"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 transisi-warna hover:bg-transparent hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full bg-pkk text-white transisi-warna hover:bg-pkk-hover sm:w-44"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </motion.form>

          <motion.div {...masuk(0.74)} className="mt-12 max-w-sm">
            <p className="text-xs text-gray-400">
              Lupa password? Hubungi Administrator sistem.
            </p>
            <p className="mt-1.5 text-xs text-gray-400">
              &copy; 2026 Pemerintah Provinsi Kalimantan Timur
            </p>
          </motion.div>
        </div>

        {/* ── Kanan: panel ───────────────────────────────────────────────
            Disembunyikan di bawah lg: panel hias tidak layak memakan
            setengah layar ponsel yang dipakai untuk mengetik. */}
        <motion.div
          {...(kurangiGerak
            ? {}
            : {
                initial: { opacity: 0, x: 40 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
              })}
          className="relative hidden overflow-hidden bg-gradient-to-br from-pkk-hover via-pkk to-pkk-accent lg:block"
        >
          {/* Bentuk geometris — seluruhnya utilitas Tailwind, tanpa CSS baru. */}
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute top-1/3 -left-20 h-56 w-56 rounded-full bg-white/[0.07]" />
          <div className="absolute -right-10 -bottom-28 h-80 w-80 rounded-full bg-white/[0.06]" />
          <div className="absolute top-16 right-24 h-24 w-24 rotate-12 rounded-3xl bg-white/[0.08]" />

          <div className="relative flex h-full flex-col items-center justify-center gap-6 px-12 text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/95 shadow-lg">
              <img src="/logo-pemprov.png" alt="Logo Pemerintah Provinsi Kalimantan Timur" className="h-20 w-auto" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">SIM PKK Kalimantan Timur</p>
              <p className="mt-2 text-sm text-white/70">Sistem Informasi Manajemen</p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/80">
              Perencanaan, realisasi, dan pelaporan kegiatan Tim Penggerak PKK dalam satu tempat.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/80">
              <ShieldCheck className="h-4 w-4" />
              Akses terbatas untuk pengurus terdaftar
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
