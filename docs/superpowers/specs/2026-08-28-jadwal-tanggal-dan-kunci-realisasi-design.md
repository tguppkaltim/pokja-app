# Jadwal per Tanggal & Pencegahan Double Input Realisasi

Tanggal: 2026-08-28

## Masalah

1. Jadwal kegiatan hanya sampai level bulan — 12 kolom boolean
   `sched_jan`…`sched_des`. Tidak bisa menyatakan "5 Januari", dan tidak bisa
   menjadwalkan dua kegiatan di bulan yang sama.
2. Realisasi bisa diinput ulang untuk periode yang sama. `upsertRealisasi`
   menimpa berdasarkan `(kegiatan_id, bulan, tahun)`; UI hanya memperingatkan
   "akan menimpa data lama" tanpa mencegah.

## Keputusan

1. **Sesi dihitung per tanggal.** Jadwal jadi daftar tanggal bebas. Satu
   kegiatan boleh punya beberapa sesi dalam bulan yang sama.
2. **Realisasi menempel ke sesi**, bukan ke bulan. Satu sesi = maksimal satu
   realisasi, ditegakkan constraint database.
3. **Koreksi lewat tombol Ubah eksplisit.** Form input menolak sesi yang sudah
   terealisasi; perbaikan dilakukan sadar lewat riwayat.

## Model data

```sql
create table jadwal_kegiatan (
  id serial primary key,
  kegiatan_id integer not null references kegiatan(id) on delete cascade,
  tanggal date not null,
  created_at timestamptz not null default now(),
  unique (kegiatan_id, tanggal)
);

alter table realisasi_kegiatan
  add column jadwal_id integer references jadwal_kegiatan(id) on delete cascade;
alter table realisasi_kegiatan drop constraint realisasi_kegiatan_kegiatan_id_bulan_tahun_key;
alter table realisasi_kegiatan add constraint realisasi_satu_per_sesi unique (jadwal_id);
```

Tabel, bukan kolom `date[]`: realisasi perlu menunjuk satu sesi tertentu, dan
kolom array tidak bisa jadi target foreign key.

Membuang `unique(kegiatan_id, bulan, tahun)` **wajib** — constraint itulah yang
membuat dua sesi di bulan sama mustahil punya realisasi masing-masing.

`unique(jadwal_id)` menegakkan pencegahan double input di level database, jadi
tetap berlaku walau ada bug di frontend atau dua operator menyimpan bersamaan.

Kolom `bulan` dan `tahun` di `realisasi_kegiatan` dipertahankan karena dipakai
filter Dashboard dan Laporan; nilainya diturunkan dari `jadwal.tanggal`.

## Migrasi data lama

- Tiap `sched_<bulan> = true` jadi satu baris jadwal bertanggal **1** bulan itu.
- Realisasi lama disambungkan ke jadwal bulan yang cocok.
- Realisasi tanpa pasangan jadwal — ada satu di data uji, realisasi Oktober pada
  kegiatan yang hanya dijadwalkan September — dibuatkan jadwal dari
  `tanggal_pelaksanaan`-nya supaya tidak menggantung dan constraint NOT NULL
  di kemudian hari tidak gagal.

## Perubahan aplikasi

| Berkas | Perubahan |
|---|---|
| `types/database.ts`, `types/index.ts` | tabel `jadwal_kegiatan`, kolom `jadwal_id` |
| `lib/db.ts` | CRUD jadwal; `upsertRealisasi` pakai `jadwal_id` |
| `KegiatanFormPage` | `MonthYearPicker` → `DatePicker`, chip tanggal |
| `RealisasiPage` | pilih **sesi terjadwal** (yang sudah terisi dinonaktifkan), tombol Ubah di riwayat |
| `DashboardPage`, `LaporanPage`, `KegiatanListPage`, `KegiatanDetailPage` | baca jadwal, bukan `sched_*` |
| `data/mockData.ts` | jadwal contoh |

## Perubahan perilaku yang perlu diketahui operator

Realisasi di luar jadwal **tidak bisa lagi diinput**. Saat ini bisa. Kegiatan
yang terlaksana di luar rencana harus ditambahkan dulu tanggalnya di Rencana
Kegiatan.

## Yang sengaja tidak dilakukan

12 kolom `sched_*` **tidak di-drop**. Menghapus kolom di produksi tidak bisa
dibatalkan dan sembilan berkas membacanya. Penghapusan menyusul sebagai migrasi
terpisah setelah semua kode pindah dan terbukti stabil.

## Risiko

Skema live mungkin berbeda dari repo: migrasi 001 memakai pola
`exists (select ... from profiles ...)` inline, sementara catatan proyek
menyebut RLS sudah diubah manual memakai fungsi `auth_user_role()` untuk
menghindari infinite recursion. Migrasi ini mengikuti pola yang ada di repo.
Nama constraint `realisasi_kegiatan_kegiatan_id_bulan_tahun_key` juga perlu
diverifikasi di database sebelum di-drop.
