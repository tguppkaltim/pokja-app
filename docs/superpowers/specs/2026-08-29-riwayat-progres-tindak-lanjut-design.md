# Riwayat Progress Penyelesaian Tindak Lanjut

Tanggal: 2026-08-29

## Masalah

Tindak lanjut hanya menyimpan status terkini. Tidak terlihat bagaimana ia sampai
ke sana: kapan mulai dikerjakan, apa kendalanya, siapa yang memperbaruinya. Saat
monitoring, pertanyaan yang muncul justru "kenapa tertunda", dan datanya tidak
ada.

## Keputusan

1. **Catatan progres bertahap, tanpa verifikasi.** PIC menambahkan entri kapan
   pun disertai bukti; status berubah langsung tanpa persetujuan pihak lain.
2. **Foto pindah ke entri progres**, satu foto per entri, supaya terlihat bukti
   mana milik tahap mana.
3. **Status hanya berubah lewat entri progres.**
4. **Riwayat bersifat menambah saja** — tidak bisa disunting.

## Model data

```sql
create table progres_tindak_lanjut (
  id serial primary key,
  tindak_lanjut_id integer not null references tindak_lanjut(id) on delete cascade,
  status_baru text not null check (status_baru in ('open','on_progress','closed','dibatalkan')),
  catatan text not null default '',
  foto_path text,
  dibuat_oleh uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
```

Menambah progres tanpa mengubah status tetap bisa: isi `status_baru` sama dengan
status sekarang.

## Status hanya berubah lewat entri progres

Ini perubahan perilaku yang paling terasa. Saat ini status bisa diubah langsung
dari dropdown di tabel Monitoring, dan jalur itu ditutup.

Alasannya: kalau ada jalur yang mengubah status tanpa mencatat, riwayatnya bocor.
Riwayat yang tidak lengkap lebih berbahaya daripada tidak ada riwayat sama
sekali, karena terlihat seolah lengkap. `updateTindakLanjut` berhenti menerima
`status` dan `closed_date`.

Dropdown di tabel Monitoring tetap ada, tapi membuka dialog kecil berisi catatan
dan foto opsional sebelum menyimpan. Operator kehilangan ubah-status satu klik;
itu harga dari riwayat yang benar.

## Sinkronisasi lewat trigger, bukan aplikasi

`tindak_lanjut.status` dan `closed_date` diperbarui oleh trigger database saat
entri progres masuk. Dengan begitu keduanya tidak mungkin melenceng dari
riwayatnya, dan logika `closed_date` berhenti terduplikasi antara
`selaraskanClosedDate()` di aplikasi dan database.

`closed_date` dihitung dari `now() at time zone 'Asia/Makassar'`, bukan dari
`now()` mentah. `now()` adalah UTC; di WITA tanggal 1 pukul 00:30 lokal masih
tanggal sebelumnya menurut UTC — bug pergeseran hari yang sama seperti yang
pernah terjadi lewat `toISOString()`.

Fungsi trigger berjalan sebagai pemanggil, bukan SECURITY DEFINER, supaya RLS
`tindak_lanjut` tetap berlaku. Bila RLS menolak, insert entri ikut gagal — dan
gagal keras lebih baik daripada riwayat yang tersimpan tanpa status berubah.

## Migrasi data lama

- Tiap tindak lanjut yang sudah ada dibuatkan satu entri progres awal berisi
  status dan foto saat ini, supaya riwayatnya tidak kosong.
- Pembuatnya diambil dari `rapat.created_by`, karena `tindak_lanjut` tidak
  menyimpan pembuat.
- `tindak_lanjut.foto_path` **tidak di-drop**. Sama seperti perlakuan `sched_*`:
  penghapusan kolom tidak bisa dibatalkan, jadi menyusul sebagai migrasi
  terpisah setelah terbukti stabil.

## Hak akses

| Peran | Entri progres |
|---|---|
| super_admin | tambah, hapus |
| sekretariat | tambah |
| operator | tambah, hanya pada tindak lanjut ber-PIC pokjanya |
| viewer | baca |

Tidak ada yang bisa menyunting entri. Menyunting riwayat membuat riwayatnya
kehilangan makna. Hapus hanya untuk super admin, untuk kasus salah input.

## Tampilan

Di halaman detail rapat, tiap tindak lanjut menampilkan lini masanya beserta
tombol Tambah Progres. Dialog Ubah Tindak Lanjut menyisakan definisinya saja —
uraian, PIC, target, keterangan.

## Di luar lingkup

Notifikasi dan lampiran selain foto tidak dibuat.
