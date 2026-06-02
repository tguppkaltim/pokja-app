import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import KegiatanListPage from '@/pages/KegiatanListPage'
import KegiatanFormPage from '@/pages/KegiatanFormPage'
import KegiatanDetailPage from '@/pages/KegiatanDetailPage'
import RealisasiPage from '@/pages/RealisasiPage'
import LaporanPage from '@/pages/LaporanPage'
import PenggunaPage from '@/pages/admin/PenggunaPage'
import MasterPokjaPage from '@/pages/admin/MasterPokjaPage'
import MasterProgramPage from '@/pages/admin/MasterProgramPage'
import ProfilPage from '@/pages/ProfilPage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6FBF7] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-[#1B6B35] rounded-xl flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white text-sm font-bold">PKK</span>
          </div>
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/laporan" element={<LaporanPage />} />
        <Route path="/profil" element={<ProfilPage />} />

        <Route path="/kegiatan" element={
          <ProtectedRoute roles={['super_admin', 'operator']}>
            <KegiatanListPage />
          </ProtectedRoute>
        } />
        <Route path="/kegiatan/tambah" element={
          <ProtectedRoute roles={['super_admin', 'operator']}>
            <KegiatanFormPage />
          </ProtectedRoute>
        } />
        <Route path="/kegiatan/:id" element={<KegiatanDetailPage />} />
        <Route path="/kegiatan/:id/edit" element={
          <ProtectedRoute roles={['super_admin', 'operator']}>
            <KegiatanFormPage />
          </ProtectedRoute>
        } />

        <Route path="/realisasi" element={
          <ProtectedRoute roles={['super_admin', 'operator']}>
            <RealisasiPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/pengguna" element={
          <ProtectedRoute roles={['super_admin']}>
            <PenggunaPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/pokja" element={
          <ProtectedRoute roles={['super_admin']}>
            <MasterPokjaPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/program" element={
          <ProtectedRoute roles={['super_admin']}>
            <MasterProgramPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}
