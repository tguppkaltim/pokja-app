import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, CheckSquare, FileBarChart,
  Users, Building2, Layers, ChevronLeft, ChevronRight, LogOut, User, NotebookPen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'sekretariat', 'operator', 'viewer'] },
  // Sekretariat bukan pokja, jadi hanya membaca Rencana Kegiatan — tombol ubah
  // di halaman itu memang sudah dibatasi super_admin dan operator.
  { label: 'Rencana Kegiatan', path: '/kegiatan', icon: ClipboardList, roles: ['super_admin', 'sekretariat', 'operator'] },
  { label: 'Input Realisasi', path: '/realisasi', icon: CheckSquare, roles: ['super_admin', 'operator'] },
  { label: 'Notulensi', path: '/notulensi', icon: NotebookPen, roles: ['super_admin', 'sekretariat', 'operator', 'viewer'] },
  { label: 'Laporan', path: '/laporan', icon: FileBarChart, roles: ['super_admin', 'sekretariat', 'operator', 'viewer'] },
]

const adminItems: NavItem[] = [
  { label: 'Pengguna', path: '/admin/pengguna', icon: Users, roles: ['super_admin'] },
  { label: 'Master Pokja', path: '/admin/pokja', icon: Building2, roles: ['super_admin'] },
  { label: 'Master Program', path: '/admin/program', icon: Layers, roles: ['super_admin'] },
]

/**
 * Kelas satu item navigasi. Sebelumnya blok kelas yang sama ditulis ulang di
 * tiga tempat, dan sempat berbeda satu sama lain.
 *
 * Penanda aktif memakai putih transparan, bukan biru muda: di atas sidebar
 * #0047AB, #2349B5 hanya berkontras 1,08:1 — praktis tak terlihat. Putih 18%
 * terbaca sebagai bidang dan teks putih di atasnya tetap lolos AA (5,52:1).
 * Garis tebal di tepi kiri jadi penanda kedua supaya tidak bergantung warna
 * saja.
 */
function kelasNav(isActive: boolean, collapsed: boolean) {
  return cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transisi-warna',
    // Garis tepi kiri selalu ada tapi tergulung habis saat tidak aktif,
    // sehingga bisa tumbuh dengan halus alih-alih muncul mendadak.
    'before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2',
    'before:rounded-r-full before:bg-white before:transition-transform before:duration-200',
    isActive
      ? 'bg-white/18 text-white before:scale-y-100'
      : 'text-white/70 before:scale-y-0 hover:bg-white/10 hover:text-white',
    collapsed && 'justify-center px-2',
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visibleNav = navItems.filter(item => user && item.roles.includes(user.role))
  const visibleAdmin = adminItems.filter(item => user && item.roles.includes(user.role))

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-pkk text-white transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/14', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          <img src="/logo-pemprov.png" alt="Logo Pemprov Kaltim" className="w-full h-full object-contain p-0.5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            {/* Nama baru lebih panjang dari sebelumnya; `truncate` memotongnya
                jadi "SIM PKK Kalimantan Ti...". Dibiarkan membungkus dua baris
                supaya nama lembaganya terbaca utuh. */}
            <p className="text-sm font-bold leading-tight">SIM PKK Kalimantan Timur</p>
            <p className="text-xs text-white/65 leading-tight mt-0.5 truncate">Sistem Informasi Manajemen</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleNav.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => kelasNav(isActive, collapsed)}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {visibleAdmin.length > 0 && (
          <>
            {!collapsed && (
              <p className="text-xs text-white/55 uppercase tracking-wider px-5 mt-6 mb-2">Administrasi</p>
            )}
            {collapsed && <div className="border-t border-white/14 my-3 mx-2" />}
            <ul className="space-y-1 px-2">
              {visibleAdmin.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => kelasNav(isActive, collapsed)}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Bottom: Profil & Logout */}
      <div className="border-t border-white/14 p-2 space-y-1">
        <NavLink
          to="/profil"
          className={({ isActive }) => kelasNav(isActive, collapsed)}
          title={collapsed ? 'Profil' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Profil</span>}
        </NavLink>
        <Button
          variant="ghost"
          onClick={logout}
          title={collapsed ? 'Keluar' : undefined}
          className={cn(
            'h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transisi-warna hover:bg-red-600 hover:text-white',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </Button>
      </div>

      {/* Collapse toggle */}
      <Button
        variant="outline"
        size="icon-xs"
        aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 rounded-full border-pkk-border bg-white text-pkk shadow-sm transisi-warna hover:bg-pkk-tint hover:text-pkk-hover"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </Button>
    </aside>
  )
}
