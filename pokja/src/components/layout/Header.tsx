import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { mockPokja } from '@/data/mockData'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Administrator',
  operator: 'Operator Pokja',
  viewer: 'Viewer',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  operator: 'bg-[#EAF5EC] text-[#1B6B35]',
  viewer: 'bg-blue-100 text-blue-700',
}

export function Header() {
  const { user } = useAuth()
  if (!user) return null

  const pokja = user.pokja_id ? mockPokja.find(p => p.id === user.pokja_id) : null
  const initials = user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-[#d1e8d5] flex items-center justify-between px-4 flex-shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">
          Sistem Monitoring Kegiatan TP PKK Provinsi Kalimantan Timur
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-[#1B6B35] hover:bg-[#EAF5EC] rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-[#1B6B35] text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user.full_name}</p>
            <div className="flex items-center gap-1 justify-end">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
              {pokja && (
                <Badge variant="outline" className="text-xs py-0 h-5 border-[#52B788] text-[#2E8B57]">
                  {pokja.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
