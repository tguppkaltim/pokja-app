import { useState, useEffect } from 'react'
import { Plus, Pencil, UserX, UserCheck, KeyRound, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useData } from '@/contexts/DataContext'
import { fetchProfiles, updateProfile } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  operator: 'Operator Pokja',
  viewer: 'Viewer',
}

export default function PenggunaPage() {
  const { pokja: pokjaList } = useData()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role: 'operator', pokja_id: '', is_active: true })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfiles().then(setUsers).finally(() => setIsLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ full_name: u.full_name, email: u.email, role: u.role, pokja_id: u.pokja_id ? String(u.pokja_id) : '', is_active: u.is_active })
    setIsOpen(true)
  }

  async function handleSave() {
    if (!form.full_name) { toast.error('Nama wajib diisi.'); return }
    if (form.role === 'operator' && !form.pokja_id) { toast.error('Operator harus memilih Pokja.'); return }
    if (!editUser) return
    setIsSaving(true)
    try {
      await updateProfile(editUser.id, {
        full_name: form.full_name,
        role: form.role as User['role'],
        pokja_id: form.pokja_id ? parseInt(form.pokja_id) : null,
        is_active: form.is_active,
      })
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...form, role: form.role as User['role'], pokja_id: form.pokja_id ? parseInt(form.pokja_id) : null } : u))
      toast.success('Data pengguna diperbarui.')
      setIsOpen(false)
    } catch {
      toast.error('Gagal memperbarui data pengguna.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActive(u: User) {
    try {
      await updateProfile(u.id, { is_active: !u.is_active })
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_active: !p.is_active } : p))
      toast.success(`Akun ${u.full_name} ${u.is_active ? 'dinonaktifkan' : 'diaktifkan kembali'}.`)
    } catch {
      toast.error('Gagal mengubah status akun.')
    }
  }

  async function resetPassword(u: User) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(u.email)
      if (error) throw error
      toast.success(`Email reset password dikirim ke ${u.email}.`)
    } catch {
      toast.error('Gagal mengirim email reset password.')
    }
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat data pengguna...</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B6B35]">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola akun pengguna sistem</p>
        </div>
        <Button onClick={() => toast.info('Tambah pengguna dilakukan via Supabase Dashboard → Authentication → Users.')} className="bg-[#1B6B35] hover:bg-[#134D26]">
          <Plus className="w-4 h-4 mr-1" /> Tambah Pengguna
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 border-[#d1e8d5]" />
        </div>
        <Select value={filterRole} onValueChange={v => v && setFilterRole(v)}>
          <SelectTrigger className="w-44 border-[#d1e8d5]"><SelectValue placeholder="Filter role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="operator">Operator Pokja</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-[#d1e8d5]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#134D26] text-white">
                  <th className="text-left px-4 py-3 font-medium">Pengguna</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Pokja</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const pokja = u.pokja_id ? pokjaList.find(p => p.id === u.pokja_id) : null
                  return (
                    <tr key={u.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EC]/30'} ${!u.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#1B6B35] text-white text-xs">{getInitials(u.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-800">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={u.role === 'super_admin' ? 'border-purple-300 text-purple-600' : u.role === 'operator' ? 'border-[#52B788] text-[#2E8B57]' : 'border-blue-300 text-blue-600'}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{pokja?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {u.is_active ? <Badge className="bg-green-100 text-green-700">Aktif</Badge> : <Badge className="bg-gray-100 text-gray-500">Nonaktif</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(u)} className="h-8 w-8 rounded-md flex items-center justify-center text-blue-600 hover:bg-blue-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => resetPassword(u)} title="Reset Password" className="h-8 w-8 rounded-md flex items-center justify-center text-amber-600 hover:bg-amber-50">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleActive(u)} title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'} className={`h-8 w-8 rounded-md flex items-center justify-center ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Tidak ada pengguna ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B6B35]">Edit Pengguna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="border-[#d1e8d5]" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} disabled className="border-[#d1e8d5] bg-gray-50 text-gray-400" />
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={form.role} onValueChange={v => v && setForm(p => ({ ...p, role: v, pokja_id: '' }))}>
                <SelectTrigger className="border-[#d1e8d5]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="operator">Operator Pokja</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'operator' && (
              <div className="space-y-1.5">
                <Label>Pokja <span className="text-red-500">*</span></Label>
                <Select value={form.pokja_id} onValueChange={v => v && setForm(p => ({ ...p, pokja_id: v }))}>
                  <SelectTrigger className="border-[#d1e8d5]"><SelectValue placeholder="Pilih Pokja" /></SelectTrigger>
                  <SelectContent>
                    {pokjaList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-[#d1e8d5]">Batal</Button>
            <Button onClick={handleSave} className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
