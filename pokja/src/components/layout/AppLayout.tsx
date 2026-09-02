import { Outlet } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useData } from '@/contexts/data-context'

export function AppLayout() {
  const { error } = useData()

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6FBF7]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <div className="min-w-0 text-sm">
                <p className="font-medium text-red-900">Master data gagal dimuat.</p>
                <p className="text-red-700">
                  Daftar Bidang dan Program mungkin tampil kosong. Muat ulang halaman; bila tetap gagal,
                  hubungi administrator. Rincian: {error}
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
        <footer className="flex-shrink-0 bg-white border-t border-[#d1e8d5] px-6 py-2 text-xs text-gray-400 text-center">
          SIM PKK Kalimantan Timur — v1.0.0 &copy; 2026 Pemerintah Provinsi Kalimantan Timur
        </footer>
      </div>
    </div>
  )
}
