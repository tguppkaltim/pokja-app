import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F6FBF7]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <footer className="flex-shrink-0 bg-white border-t border-[#d1e8d5] px-6 py-2 text-xs text-gray-400 text-center">
          SIM PKK Kalimantan Timur — v1.0.0 &copy; 2026 Pemerintah Provinsi Kalimantan Timur
        </footer>
      </div>
    </div>
  )
}
