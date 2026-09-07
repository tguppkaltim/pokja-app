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
import { LABEL_PERAN, BADGE_PERAN } from '@/lib/peran'

export function Header() {
  const { user, logout } = useAuth()
  const { pokja: pokjaList } = useData()
  const navigate = useNavigate()
  if (!user) return null

  const pokja = user.pokja_id ? pokjaList.find(p => p.id === user.pokja_id) : null
  const initials = user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const roleLabel = LABEL_PERAN[user.role]

  // Sebagian akun memakai nama yang sama persis dengan label role-nya
  // (mis. full_name "Administrator" untuk super_admin), sehingga teksnya
  // tampil dobel. Kalau kembar, cukup tampilkan satu.
  const showRoleUnderName = user.full_name.trim().toLowerCase() !== roleLabel.toLowerCase()

  return (
    <header className="h-14 flex-shrink-0 border-b border-pkk-border bg-white px-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-700 truncate">
        SIM PKK Kalimantan Timur
      </h2>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative text-gray-500 transisi-warna hover:bg-pkk-tint hover:text-pkk"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto gap-2 py-1.5 pl-1.5 pr-2 transisi-warna hover:bg-pkk-tint data-[popup-open]:bg-pkk-tint"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-pkk text-xs font-bold text-white">
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
                  <Badge variant="outline" className={`text-xs ${BADGE_PERAN[user.role]}`}>
                    {roleLabel}
                  </Badge>
                  {pokja && (
                    <Badge variant="outline" className="text-xs border-pkk-soft text-pkk-accent">
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
