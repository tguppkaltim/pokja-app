import { Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Administrator',
  sekretariat: 'Sekretariat',
  operator: 'Operator Pokja',
  viewer: 'Viewer',
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  sekretariat: 'bg-amber-100 text-amber-700 border-amber-200',
  operator: 'bg-[#EAF5EC] text-[#1B6B35] border-[#c5e3cc]',
  viewer: 'bg-blue-100 text-blue-700 border-blue-200',
}

export function Header() {
  const { user, logout } = useAuth()
  const { pokja: pokjaList } = useData()
  const navigate = useNavigate()
  if (!user) return null

  const pokja = user.pokja_id ? pokjaList.find(p => p.id === user.pokja_id) : null
  const initials = user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const roleLabel = ROLE_LABELS[user.role] ?? user.role

  // Sebagian akun memakai nama yang sama persis dengan label role-nya
  // (mis. full_name "Administrator" untuk super_admin), sehingga teksnya
  // tampil dobel. Kalau kembar, cukup tampilkan satu.
  const showRoleUnderName = user.full_name.trim().toLowerCase() !== roleLabel.toLowerCase()

  return (
    <header className="h-14 bg-white border-b border-[#d1e8d5] flex items-center justify-between px-4 flex-shrink-0">
      <h2 className="text-sm font-semibold text-gray-700 truncate">
        Sistem Monitoring Kegiatan TP PKK Provinsi Kalimantan Timur
      </h2>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative text-gray-500 hover:text-[#1B6B35] hover:bg-[#EAF5EC]"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto gap-2 py-1.5 pl-1.5 pr-2 hover:bg-[#EAF5EC] data-[popup-open]:bg-[#EAF5EC]"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#1B6B35] text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium text-gray-800">{user.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {showRoleUnderName ? roleLabel : (pokja?.name ?? roleLabel)}
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-gray-800 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="flex flex-wrap items-center gap-1 pt-2">
                  <Badge variant="outline" className={`text-xs ${ROLE_BADGE[user.role] ?? ''}`}>
                    {roleLabel}
                  </Badge>
                  {pokja && (
                    <Badge variant="outline" className="text-xs border-[#52B788] text-[#2E8B57]">
                      {pokja.name}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profil')}>
              <UserIcon className="w-4 h-4" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut className="w-4 h-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
