import { useState } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { mockPokja } from '@/data/mockData'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrator',
  operator: 'Operator Pokja',
  viewer: 'Viewer / Pimpinan',
}

export default function ProfilPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.full_name ?? '')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingPass, setIsSavingPass] = useState(false)

  if (!user) return null

  const initials = user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const pokja = user.pokja_id ? mockPokja.find(p => p.id === user.pokja_id) : null

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nama tidak boleh kosong.'); return }
    setIsSavingName(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Nama berhasil diperbarui.')
    setIsSavingName(false)
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPass || !newPass || !confirmPass) { toast.error('Semua field password harus diisi.'); return }
    if (newPass !== confirmPass) { toast.error('Konfirmasi password tidak cocok.'); return }
    if (newPass.length < 6) { toast.error('Password baru minimal 6 karakter.'); return }
    setIsSavingPass(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Password berhasil diubah.')
    setIsSavingPass(false)
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B6B35]">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi akun Anda</p>
      </div>

      {/* Profile card */}
      <Card className="border-[#d1e8d5]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#1B6B35] text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{user.full_name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#EAF5EC] text-[#1B6B35] border-[#52B788]">{ROLE_LABELS[user.role]}</Badge>
                {pokja && <Badge variant="outline" className="border-[#52B788] text-[#2E8B57]">{pokja.name}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ubah nama */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1B6B35]">Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="border-[#d1e8d5]" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled className="border-[#d1e8d5] bg-gray-50 text-gray-400" />
              <p className="text-xs text-gray-400">Email tidak dapat diubah. Hubungi Administrator jika perlu perubahan.</p>
            </div>
            <Button type="submit" className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isSavingName}>
              {isSavingName ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-1" /> Simpan Nama</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ubah password */}
      <Card className="border-[#d1e8d5]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1B6B35]">Ubah Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Password Saat Ini</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  className="border-[#d1e8d5] pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Separator className="bg-[#EAF5EC]" />
            <div className="space-y-1.5">
              <Label>Password Baru</Label>
              <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="border-[#d1e8d5]" placeholder="Min. 6 karakter" />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password Baru</Label>
              <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="border-[#d1e8d5]" placeholder="Ulangi password baru" />
            </div>
            <Button type="submit" className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isSavingPass}>
              {isSavingPass ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-1" /> Ubah Password</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
