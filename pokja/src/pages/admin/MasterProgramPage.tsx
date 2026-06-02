import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { mockProgramPokok as initialPrograms, mockPokja } from '@/data/mockData'
import type { ProgramPokok } from '@/types'
import { toast } from 'sonner'

export default function MasterProgramPage() {
  const [programs, setPrograms] = useState<ProgramPokok[]>(initialPrograms)
  const [filterPokja, setFilterPokja] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<ProgramPokok | null>(null)
  const [form, setForm] = useState({ pokja_id: '', name: '' })

  const filtered = filterPokja === 'all' ? programs : programs.filter(p => p.pokja_id === parseInt(filterPokja))

  function openAdd() {
    setEditItem(null)
    setForm({ pokja_id: filterPokja !== 'all' ? filterPokja : '', name: '' })
    setIsOpen(true)
  }

  function openEdit(p: ProgramPokok) {
    setEditItem(p)
    setForm({ pokja_id: String(p.pokja_id), name: p.name })
    setIsOpen(true)
  }

  function handleSave() {
    if (!form.pokja_id || !form.name) {
      toast.error('Pokja dan nama program wajib diisi.')
      return
    }
    if (editItem) {
      setPrograms(prev => prev.map(p => p.id === editItem.id ? { ...p, pokja_id: parseInt(form.pokja_id), name: form.name } : p))
      toast.success('Program Pokok diperbarui.')
    } else {
      const next: ProgramPokok = {
        id: Math.max(...programs.map(p => p.id)) + 1,
        pokja_id: parseInt(form.pokja_id),
        name: form.name,
        created_at: new Date().toISOString(),
      }
      setPrograms(prev => [...prev, next])
      toast.success('Program Pokok ditambahkan.')
    }
    setIsOpen(false)
  }

  function handleDelete(p: ProgramPokok) {
    setPrograms(prev => prev.filter(item => item.id !== p.id))
    toast.success('Program Pokok dihapus.')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B6B35]">Master Program Pokok</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola program pokok per Pokja</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1B6B35] hover:bg-[#134D26]">
          <Plus className="w-4 h-4 mr-1" /> Tambah Program
        </Button>
      </div>

      <Select value={filterPokja} onValueChange={v => v && setFilterPokja(v)}>
        <SelectTrigger className="w-44 border-[#d1e8d5]">
          <SelectValue placeholder="Filter Pokja" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Pokja</SelectItem>
          {mockPokja.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-4">
        {mockPokja
          .filter(p => filterPokja === 'all' || p.id === parseInt(filterPokja))
          .map(pokja => {
            const pokjaPrograms = filtered.filter(p => p.pokja_id === pokja.id)
            if (pokjaPrograms.length === 0 && filterPokja === 'all') return null
            return (
              <Card key={pokja.id} className="border-[#d1e8d5]">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-[#1B6B35] text-white">{pokja.name}</Badge>
                    <span className="text-xs text-gray-400">{pokjaPrograms.length} program</span>
                  </div>
                  <div className="space-y-2">
                    {pokjaPrograms.map((prog, idx) => (
                      <div key={prog.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#F6FBF7] border border-[#EAF5EC]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                          <span className="text-sm text-gray-700">{prog.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(prog)} className="h-7 w-7 rounded-md flex items-center justify-center text-blue-600 hover:bg-blue-50">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <button className="h-7 w-7 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Program Pokok?</AlertDialogTitle>
                                <AlertDialogDescription>"{prog.name}" akan dihapus permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(prog)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    {pokjaPrograms.length === 0 && (
                      <p className="text-sm text-gray-400 py-3 text-center">Belum ada program pokok.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        }
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1B6B35]">{editItem ? 'Edit Program Pokok' : 'Tambah Program Pokok'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Pokja <span className="text-red-500">*</span></Label>
              <Select value={form.pokja_id} onValueChange={v => v && setForm(p => ({ ...p, pokja_id: v }))}>
                <SelectTrigger className="border-[#d1e8d5]">
                  <SelectValue placeholder="Pilih Pokja" />
                </SelectTrigger>
                <SelectContent>
                  {mockPokja.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Program Pokok <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="mis: Ketahanan Pangan" className="border-[#d1e8d5]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-[#d1e8d5]">Batal</Button>
            <Button onClick={handleSave} className="bg-[#1B6B35] hover:bg-[#134D26]">
              {editItem ? 'Simpan' : 'Tambahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
