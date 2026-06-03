import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { Pokja } from '@/types'
import { fetchPokja, createPokja, updatePokja, deletePokja } from '@/lib/db'
import { toast } from 'sonner'

export default function MasterPokjaPage() {
  const [pokjaList, setPokjaList] = useState<Pokja[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<Pokja | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPokja().then(setPokjaList).finally(() => setIsLoading(false))
  }, [])

  function openAdd() {
    setEditItem(null)
    setForm({ name: '', description: '' })
    setIsOpen(true)
  }

  function openEdit(p: Pokja) {
    setEditItem(p)
    setForm({ name: p.name, description: p.description })
    setIsOpen(true)
  }

  async function handleSave() {
    if (!form.name) { toast.error('Nama Pokja wajib diisi.'); return }
    setIsSaving(true)
    try {
      if (editItem) {
        await updatePokja(editItem.id, form)
        setPokjaList(prev => prev.map(p => p.id === editItem.id ? { ...p, ...form } : p))
        toast.success('Data Pokja diperbarui.')
      } else {
        const newPokja = await createPokja(form)
        setPokjaList(prev => [...prev, newPokja])
        toast.success('Pokja baru ditambahkan.')
      }
      setIsOpen(false)
    } catch {
      toast.error('Gagal menyimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(p: Pokja) {
    try {
      await deletePokja(p.id)
      setPokjaList(prev => prev.filter(item => item.id !== p.id))
      toast.success('Pokja dihapus.')
    } catch {
      toast.error('Gagal menghapus. Pastikan tidak ada kegiatan yang terkait.')
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-gray-400">Memuat data...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B6B35]">Master Pokja</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data Kelompok Kerja (Pokja)</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1B6B35] hover:bg-[#134D26]">
          <Plus className="w-4 h-4 mr-1" /> Tambah Pokja
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pokjaList.map((p, idx) => (
          <Card key={p.id} className="border-[#d1e8d5]">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-7 h-7 bg-[#1B6B35] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-9 leading-relaxed">{p.description || '-'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="h-8 w-8 rounded-md flex items-center justify-center text-blue-600 hover:bg-blue-50">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button className="h-8 w-8 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {p.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Menghapus Pokja akan menghapus semua data program dan kegiatan yang terkait. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(p)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1B6B35]">{editItem ? 'Edit Pokja' : 'Tambah Pokja Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Pokja <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="mis: Pokja V" className="border-[#d1e8d5]" />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Fokus program Pokja ini..." className="border-[#d1e8d5]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-[#d1e8d5]">Batal</Button>
            <Button onClick={handleSave} className="bg-[#1B6B35] hover:bg-[#134D26]" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
