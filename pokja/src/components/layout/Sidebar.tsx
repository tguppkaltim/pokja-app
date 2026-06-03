import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, CheckSquare, FileBarChart,
  Users, Building2, Layers, ChevronLeft, ChevronRight, LogOut, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'operator', 'viewer'] },
  { label: 'Rencana Kegiatan', path: '/kegiatan', icon: ClipboardList, roles: ['super_admin', 'operator'] },
  { label: 'Input Realisasi', path: '/realisasi', icon: CheckSquare, roles: ['super_admin', 'operator'] },
  { label: 'Laporan', path: '/laporan', icon: FileBarChart, roles: ['super_admin', 'operator', 'viewer'] },
]

const adminItems: NavItem[] = [
  { label: 'Pengguna', path: '/admin/pengguna', icon: Users, roles: ['super_admin'] },
  { label: 'Master Pokja', path: '/admin/pokja', icon: Building2, roles: ['super_admin'] },
  { label: 'Master Program', path: '/admin/program', icon: Layers, roles: ['super_admin'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visibleNav = navItems.filter(item => user && item.roles.includes(user.role))
  const visibleAdmin = adminItems.filter(item => user && item.roles.includes(user.role))

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#1B6B35] text-white transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-[#134D26]', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          <img src="/logo-pemprov.png" alt="Logo Pemprov Kaltim" className="w-full h-full object-contain p-0.5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">TP PKK Kaltim</p>
            <p className="text-xs text-green-300 truncate">Sistem Monitoring</p>
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
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-[#1B6B35]'
                      : 'text-green-100 hover:bg-[#134D26] hover:text-white',
                    collapsed && 'justify-center px-2'
                  )
                }
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
              <p className="text-xs text-green-400 uppercase tracking-wider px-5 mt-6 mb-2">Administrasi</p>
            )}
            {collapsed && <div className="border-t border-[#134D26] my-3 mx-2" />}
            <ul className="space-y-1 px-2">
              {visibleAdmin.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white text-[#1B6B35]'
                          : 'text-green-100 hover:bg-[#134D26] hover:text-white',
                        collapsed && 'justify-center px-2'
                      )
                    }
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
      <div className="border-t border-[#134D26] p-2 space-y-1">
        <NavLink
          to="/profil"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-white text-[#1B6B35]' : 'text-green-100 hover:bg-[#134D26] hover:text-white',
              collapsed && 'justify-center px-2'
            )
          }
          title={collapsed ? 'Profil' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Profil</span>}
        </NavLink>
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-100 hover:bg-red-700 hover:text-white transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white border border-[#d1e8d5] text-[#1B6B35] rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-[#EAF5EC] transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  )
}
