import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuth } from '@/contexts/auth-context'
import { pokjaTerikat, saringPokja } from '@/lib/hak-akses'
import { useData } from '@/contexts/data-context'
import { fetchKegiatanById, createKegiatan, updateKegiatan, fetchJadwal, setJadwalKegiatan, fetchKegiatanMitra, setMitraKegiatan, fetchKegiatanWilayah, setWilayahKegiatan } from '@/lib/db'
import { toTanggalLokal, formatTanggalPanjang } from '@/lib/utils'
import { prioritasPerPokja } from '@/lib/master-program'
import { PilihBanyak } from '@/components/pilih-banyak'
import { labelMitra } from '@/lib/mitra'
import { toast } from 'sonner'


const emptyForm = {
  pokja_id: '',
  program_pokok_id: '',
  program_prioritas_id: '',
  nama_kegiatan: '',
  deskripsi: '',
  isu_strategis: false,
  sasaran: '',
  pelaksana: '',
  anggaran: '',
  jadwal: [] as string[], // YYYY-MM-DD
  mitra: [] as number[],
  wilayah: [] as number[],
}

export default function KegiatanFormPage() {
  const { user } = useAuth()
  const { pokja: pokjaList, programPokok, programUnggulan, programPrioritas, mitra: daftarMitra, wilayah: daftarWilayah } = useData()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ ...emptyForm })
  const [pickerValue, setPickerValue] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      Promise.all([
        fetchKegiatanById(parseInt(id)),
        fetchJadwal({ kegiatanId: parseInt(id) }),
        fetchKegiatanMitra([parseInt(id)]),
        fetchKegiatanWilayah([parseInt(id)]),
      ]).then(([existing, jadwalRows, mitraRows, wilayahRows]) => {
        if (existing) {
          const jadwal = jadwalRows.map(j => j.tanggal)
          setForm({
            pokja_id: String(existing.pokja_id),
            program_pokok_id: String(existing.program_pokok_id),
            program_prioritas_id: existing.program_prioritas_id === null ? '' : String(existing.program_prioritas_id),
            nama_kegiatan: existing.nama_kegiatan,
            deskripsi: existing.deskripsi,
            isu_strategis: existing.isu_strategis,
            sasaran: existing.sasaran,
            pelaksana: existing.pelaksana,
            anggaran: String(existing.anggaran),
            jadwal,
            mitra: mitraRows.map(m => m.mitra_id),
            wilayah: wilayahRows.map(w => w.wilayah_id),
          })
        }
      }).finally(() => setIsLoading(false))
    }
  }, [isEdit, id])

  // Operator terkunci ke pokjanya sendiri. Diturunkan, bukan disalin ke state
  // lewat efek: menyalinnya berarti setState sinkron di badan efek, dan nilainya
  // bisa tertinggal saat user berubah.
  const terikat = pokjaTerikat(user)
  const pokjaTerkunci = terikat !== null ? String(terikat) : ''
  const pokjaAktif = form.pokja_id || pokjaTerkunci

  const filteredProgram = programPokok.filter(p => pokjaAktif ? p.pokja_id === parseInt(pokjaAktif) : true)
  const pokjaOptions = saringPokja(user, pokjaList)

  // Base UI menampilkan nilai mentah di trigger kalau `items` tidak dikirim ke
  // Select.Root, sehingga yang tampil id-nya (angka) dan bukan namanya.
  const pokjaItems = pokjaOptions.map(p => ({ value: String(p.id), label: p.name }))
  const programItems = filteredProgram.map(p => ({ value: String(p.id), label: p.name }))

  // Prioritas disaring ke Program Pokok yang dipilih. Sebagian Program Pokok
  // belum dirinci di master resmi sehingga daftarnya kosong — itu bukan galat,
  // dan formnya tidak boleh memaksa memilih sesuatu yang tidak ada.
  const master = { pokja: pokjaList, programPokok, programUnggulan, programPrioritas }
  const jalurTersedia = form.program_pokok_id
    ? prioritasPerPokja(null, master).filter(j => j.pokok.id === parseInt(form.program_pokok_id))
    : []
  const prioritasItems = jalurTersedia.map(j => ({ value: String(j.prioritas.id), label: j.prioritas.name }))
  const jalurTerpilih = jalurTersedia.find(j => String(j.prioritas.id) === form.program_prioritas_id)
  const prioritasWajib = Boolean(form.program_pokok_id) && jalurTersedia.length > 0

  function addJadwal(d: Date | undefined) {
    if (!d) return
    const tanggal = toTanggalLokal(d)
    if (form.jadwal.includes(tanggal)) {
      toast.info(`${formatTanggalPanjang(tanggal)} sudah ada dalam jadwal.`)
      setPickerValue(undefined)
      return
    }
    setForm(prev => ({ ...prev, jadwal: [...prev.jadwal, tanggal].sort() }))
    setPickerValue(undefined)
  }

  function removeJadwal(tanggal: string) {
    setForm(prev => ({ ...prev, jadwal: prev.jadwal.filter(t => t !== tanggal) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pokjaAktif || !form.program_pokok_id || !form.nama_kegiatan) {
      toast.error('Pokja, Program Pokok, dan Nama Kegiatan wajib diisi.')
      return
    }
    if (prioritasWajib && !form.program_prioritas_id) {
      toast.error('Pilih Program Prioritas yang menaungi kegiatan ini.')
      return
    }
    if (form.jadwal.length === 0) {
      toast.error('Tambahkan minimal satu jadwal pelaksanaan.')
      return
    }
    if (!user) return

    const tahun = parseInt(form.jadwal[0].slice(0, 4))

    setIsSaving(true)
    try {
      const payload = {
        pokja_id: parseInt(pokjaAktif),
        program_pokok_id: parseInt(form.program_pokok_id),
        program_prioritas_id: form.program_prioritas_id ? parseInt(form.program_prioritas_id) : null,
        nama_kegiatan: form.nama_kegiatan,
        deskripsi: form.deskripsi,
        isu_strategis: form.isu_strategis,
        sasaran: form.sasaran,
        pelaksana: form.pelaksana,
        anggaran: parseInt(form.anggaran) || 0,
        tahun,
        created_by: user.id,
      }

      if (isEdit && id) {
        await updateKegiatan(parseInt(id), payload)
        await setJadwalKegiatan(parseInt(id), form.jadwal)
        await setMitraKegiatan(parseInt(id), form.mitra)
        await setWilayahKegiatan(parseInt(id), form.wilayah)
        toast.success('Kegiatan berhasil diperbarui.')
      } else {
        const dibuat = await createKegiatan(payload as Parameters<typeof createKegiatan>[0])
        await setJadwalKegiatan(dibuat.id, form.jadwal)
        await setMitraKegiatan(dibuat.id, form.mitra)
        await setWilayahKegiatan(dibuat.id, form.wilayah)
        toast.success('Kegiatan berhasil ditambahkan.')
      }
      navigate('/kegiatan')
    } catch (err) {
      // setJadwalKegiatan menolak membuang tanggal yang sudah punya realisasi;
      // pesannya ditujukan ke pengguna, jadi jangan ditelan.
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Memuat data...</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-pkk">{isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</h1>
        <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Perbarui data rencana kegiatan.' : 'Input rencana kegiatan ke dalam POA.'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-pkk-border">
          <CardHeader>
            <CardTitle className="text-base text-pkk">Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Pokja <span className="text-red-500">*</span></Label>
                <Select items={pokjaItems} value={pokjaAktif} onValueChange={v => v && setForm(prev => ({ ...prev, pokja_id: v, program_pokok_id: '', program_prioritas_id: '' }))} disabled={terikat !== null}>
                  <SelectTrigger className="border-pkk-border"><SelectValue placeholder="Pilih Pokja" /></SelectTrigger>
                  <SelectContent>
                    {pokjaItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Program Pokok <span className="text-red-500">*</span></Label>
                <Select items={programItems} value={form.program_pokok_id} onValueChange={v => v && setForm(prev => ({ ...prev, program_pokok_id: v, program_prioritas_id: '' }))}>
                  <SelectTrigger className="border-pkk-border"><SelectValue placeholder="Pilih Program Pokok" /></SelectTrigger>
                  <SelectContent>
                    {programItems.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.program_pokok_id && (
              <div className="space-y-1.5">
                <Label>
                  Program Prioritas {prioritasWajib && <span className="text-red-500">*</span>}
                </Label>
                {prioritasWajib ? (
                  <>
                    <Select
                      items={prioritasItems}
                      value={form.program_prioritas_id}
                      onValueChange={v => v && setForm(prev => ({ ...prev, program_prioritas_id: v }))}
                    >
                      <SelectTrigger className="border-pkk-border"><SelectValue placeholder="Pilih Program Prioritas" /></SelectTrigger>
                      <SelectContent>
                        {jalurTersedia.map(j => (
                          <SelectItem key={j.prioritas.id} value={String(j.prioritas.id)}>
                            {j.prioritas.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {jalurTerpilih && (
                      <div className="rounded-lg border border-pkk-tint bg-pkk-surface px-3 py-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          Program Unggulan: <span className="text-gray-700">{jalurTerpilih.unggulan.name}</span>
                        </p>
                        {jalurTerpilih.prioritas.contoh_kegiatan && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer text-pkk">Contoh kegiatan acuan</summary>
                            <p className="whitespace-pre-line pt-1 text-gray-600">{jalurTerpilih.prioritas.contoh_kegiatan}</p>
                          </details>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="rounded-lg border border-dashed border-pkk-border px-3 py-2 text-xs text-gray-500">
                    Program Pokok ini belum punya Program Prioritas di master.
                    Kegiatan tetap bisa disimpan; lengkapi masternya lewat menu Master Program.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Nama Kegiatan <span className="text-red-500">*</span></Label>
              <Textarea placeholder="Deskripsikan kegiatan secara singkat dan jelas..." value={form.nama_kegiatan} onChange={e => setForm(prev => ({ ...prev, nama_kegiatan: e.target.value }))} className="border-pkk-border min-h-20" />
            </div>

            <div className="space-y-1.5">
              <Label>Deskripsi Kegiatan</Label>
              <Textarea
                placeholder="Latar belakang, rincian pelaksanaan, atau catatan lain. Boleh dikosongkan."
                value={form.deskripsi}
                onChange={e => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                className="border-pkk-border min-h-24"
              />
              <p className="text-xs text-gray-400">
                Opsional. Untuk penjelasan yang terlalu panjang dimuat di Nama Kegiatan.
              </p>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-pkk-border bg-pkk-surface px-3 py-2.5 transisi-warna hover:border-pkk-soft">
              <Checkbox
                checked={form.isu_strategis}
                onCheckedChange={v => setForm(prev => ({ ...prev, isu_strategis: v === true }))}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Star className="h-3.5 w-3.5 text-pkk" /> Isu Strategis
                </span>
                <span className="block text-xs text-gray-500">
                  Selama belum ada realisasi tercatat, kegiatan ini tampil di bagian atas
                  daftar Rencana Kegiatan. Turun ke urutan biasa setelah sesi pertamanya dilaporkan.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sasaran</Label>
                <Input placeholder="Target peserta/penerima manfaat" value={form.sasaran} onChange={e => setForm(prev => ({ ...prev, sasaran: e.target.value }))} className="border-pkk-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Pelaksana</Label>
                <Input placeholder="Penanggung jawab pelaksanaan" value={form.pelaksana} onChange={e => setForm(prev => ({ ...prev, pelaksana: e.target.value }))} className="border-pkk-border" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Lokus</Label>
              <PilihBanyak
                opsi={daftarWilayah.map(w => ({ id: w.id, label: w.nama }))}
                terpilih={form.wilayah}
                onChange={wilayah => setForm(prev => ({ ...prev, wilayah }))}
                placeholder="Pilih kabupaten/kota..."
                placeholderHabis="Semua wilayah sudah dipilih"
                pesanKosong="Daftar wilayah belum terisi. Jalankan migrasi 019 lebih dulu."
                pesanBelumDipilih="Belum ada wilayah sasaran dipilih. Boleh dikosongkan."
              />
              <p className="text-xs text-gray-400">
                Wilayah sasaran yang direncanakan. Tempat pelaksanaan sebenarnya diisi saat melapor realisasi.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Mitra / OPD</Label>
              <PilihBanyak
                opsi={daftarMitra.map(m => ({
                  id: m.id,
                  label: labelMitra(m),
                  // Nama resminya ikut dicari: yang menyusun kegiatan biasanya
                  // menyalin dari surat, yang memakai nama panjang.
                  cari: m.nama,
                  nonaktif: !m.aktif,
                }))}
                terpilih={form.mitra}
                onChange={mitra => setForm(prev => ({ ...prev, mitra }))}
                placeholder="Pilih mitra/OPD..."
                placeholderHabis="Semua mitra aktif sudah dipilih"
                pesanKosong="Daftar mitra masih kosong. Isi lebih dulu lewat Administrasi › Master Mitra."
                pesanBelumDipilih="Belum ada mitra dipilih. Boleh dikosongkan."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Anggaran (Rp)</Label>
              <Input type="number" placeholder="0" value={form.anggaran} onChange={e => setForm(prev => ({ ...prev, anggaran: e.target.value }))} className="border-pkk-border" min={0} />
            </div>

            <Separator className="bg-pkk-tint" />

            <div className="space-y-3">
              <div>
                <Label>Jadwal Pelaksanaan <span className="text-red-500">*</span></Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pilih tanggal pelaksanaan. Boleh lebih dari satu tanggal, termasuk dalam bulan yang sama.
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <DatePicker value={pickerValue} onChange={setPickerValue} placeholder="Pilih tanggal..." className="border-pkk-border" />
                </div>
                <Button type="button" onClick={() => addJadwal(pickerValue)} disabled={!pickerValue} variant="outline" className="border-pkk-soft text-pkk hover:bg-pkk-tint shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </div>
              {form.jadwal.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.jadwal.map(tanggal => (
                    <Badge key={tanggal} className="gap-1.5 rounded-full bg-pkk pl-3 pr-1.5 py-1 text-sm text-white [a&]:hover:bg-pkk">
                      <span>{formatTanggalPanjang(tanggal)}</span>
                      <button
                        type="button"
                        aria-label={`Hapus jadwal ${formatTanggalPanjang(tanggal)}`}
                        onClick={() => removeJadwal(tanggal)}
                        className="rounded-full p-0.5 transition-colors hover:bg-white/20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-pkk-border rounded-lg py-4 text-center text-sm text-gray-400">
                  Belum ada jadwal. Pilih tanggal lalu klik Tambah.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-pkk-border">Batal</Button>
          <Button type="submit" className="bg-pkk hover:bg-pkk-hover" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-1" /> {isEdit ? 'Simpan Perubahan' : 'Tambahkan Kegiatan'}</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
