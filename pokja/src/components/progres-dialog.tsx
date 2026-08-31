import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { tambahProgres, uploadFotoTindakLanjut } from '@/lib/db'
import { STATUS_ITEMS, STATUS_LABEL } from '@/lib/tindak-lanjut'
import type { StatusTindakLanjut, TindakLanjut } from '@/types'
import { toast } from 'sonner'

const MAKS_FOTO = 5 * 1024 * 1024
const TIPE_FOTO = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Satu-satunya pintu perubahan status tindak lanjut di UI.
 *
 * Dipakai bersama oleh tabel Monitoring dan halaman detail rapat supaya tidak
 * ada jalur kedua yang bisa mengubah status tanpa meninggalkan riwayat.
 *
 * Dirender hanya saat dibutuhkan dan diberi `key` oleh pemanggil, sehingga
 * state awalnya cukup diambil dari props tanpa efek pereset — versi sebelumnya
 * memakai useEffect, yang berarti setState sinkron di badan efek.
 */
export function ProgresDialog({
  tindakLanjut,
  statusAwal,
  userId,
  onTutup,
  onSaved,
}: {
  tindakLanjut: TindakLanjut
  /** Status yang dipilih pengguna sebelum dialog dibuka, bila ada. */
  statusAwal?: StatusTindakLanjut
  userId: string
  onTutup: () => void
  onSaved: () => void | Promise<void>
}) {
  const [status, setStatus] = useState<StatusTindakLanjut>(statusAwal ?? tindakLanjut.status)
  const [catatan, setCatatan] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function pilihFoto(f: File | null) {
    if (!f) { setFoto(null); return }
    const ekstensi = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!TIPE_FOTO.includes(ekstensi)) { toast.error('Format foto harus JPG, PNG, atau WEBP.'); return }
    if (f.size > MAKS_FOTO) { toast.error('Ukuran foto maksimum 5 MB.'); return }
    setFoto(f)
  }

  async function simpan() {
    setIsSaving(true)
    try {
      // Foto diunggah lebih dulu: kalau gagal, tidak ada entri riwayat
      // setengah jadi yang menunjuk foto yang tidak pernah tersimpan.
      let fotoPath: string | null = null
      if (foto) fotoPath = await uploadFotoTindakLanjut(foto, tindakLanjut.id)

      await tambahProgres({
        tindak_lanjut_id: tindakLanjut.id,
        status_baru: status,
        catatan: catatan.trim(),
        foto_path: fotoPath,
        dibuat_oleh: userId,
      })

      toast.success(
        status === tindakLanjut.status
          ? 'Catatan progress ditambahkan.'
          : `Status diubah ke ${STATUS_LABEL[status]}.`
      )
      onTutup()
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan progress.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={terbuka => { if (!terbuka) onTutup() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1B6B35]">Tambah Progress</DialogTitle>
          <DialogDescription className="line-clamp-2">{tindakLanjut.uraian}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select items={STATUS_ITEMS} value={status} onValueChange={v => v && setStatus(v as StatusTindakLanjut)}>
              <SelectTrigger className="border-[#d1e8d5]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ITEMS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {status === tindakLanjut.status && (
              <p className="text-xs text-gray-400">
                Status tidak berubah — entri ini hanya menambah catatan progress.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Catatan Progress</Label>
            <Textarea
              placeholder="Apa yang sudah dikerjakan, kendalanya, atau hasilnya..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              className="border-[#d1e8d5] min-h-24"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Foto Bukti <span className="text-xs font-normal text-gray-400">(opsional)</span></Label>
            {foto ? (
              <div className="flex items-center gap-3 bg-[#F6FBF7] border border-[#d1e8d5] rounded-lg px-3 py-2">
                <ImageIcon className="w-4 h-4 text-[#2E8B57] shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{foto.name}</span>
                <span className="text-xs text-gray-400">{(foto.size / 1024).toFixed(0)} KB</span>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Hapus foto" onClick={() => setFoto(null)} className="text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-[#52B788] rounded-lg cursor-pointer hover:bg-[#EAF5EC]/50 transition-colors">
                <span className="text-sm text-[#2E8B57]">Pilih foto — JPG, PNG, WEBP. Maks 5 MB.</span>
                <input
                  type="file"
                  className="hidden"
                  accept={TIPE_FOTO.join(',')}
                  onChange={e => { pilihFoto(e.target.files?.[0] ?? null); e.target.value = '' }}
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onTutup}>Batal</Button>
          <Button onClick={simpan} disabled={isSaving} className="bg-[#1B6B35] hover:bg-[#134D26]">
            {isSaving ? 'Menyimpan...' : 'Simpan Progress'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
