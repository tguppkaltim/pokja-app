# Anggaran Aktual per Realisasi

Tanggal: 2026-08-28

## Masalah

Kegiatan punya `anggaran` (rencana), tapi tidak ada tempat mencatat berapa yang
benar-benar terpakai. Dashboard menampilkan "Estimasi Realisasi Anggaran" hasil
taksiran `anggaran / jumlah_sesi * sesi_terlaksana` — bukan angka nyata.

## Keputusan

1. **Dicatat per bulan/sesi, lalu dijumlah.** Tabel `realisasi_kegiatan` sudah
   satu baris per (kegiatan, bulan, tahun), jadi nominal aktual menempel di situ.
   Anggaran aktual sebuah kegiatan = jumlah seluruh barisnya. Ini tetap memberi
   sepasang angka rencana-vs-aktual per kegiatan, sekaligus jejak per bulan.
2. **Wajib saat Terlaksana, disembunyikan saat Tidak Terlaksana.** Kegiatan yang
   tidak jalan tersimpan 0 — tidak ada serapan.
3. **Taksiran dibuang.** Dashboard memakai angka aktual sepenuhnya.

## Perubahan database

Migrasi `supabase/migrations/005_anggaran_aktual_realisasi.sql`:

```sql
alter table realisasi_kegiatan
  add column anggaran_aktual bigint not null default 0;
```

`bigint` menyamai `kegiatan.anggaran` (rupiah bulat). `not null default 0` membuat
migrasi aman: baris lama terisi 0 tanpa error.

Migrasi dijalankan manual oleh pemilik project lewat SQL Editor Supabase. Aplikasi
error sampai migrasi jalan, jadi urutannya SQL dulu baru pakai fitur.

## Perubahan aplikasi

| Berkas | Perubahan |
|---|---|
| `types/database.ts` | `anggaran_aktual` di Row/Insert/Update `realisasi_kegiatan` |
| `types/index.ts` | field `anggaran_aktual: number` di `RealisasiKegiatan` |
| `lib/db.ts` | parameter `anggaran_aktual` di `upsertRealisasi` |
| `pages/RealisasiPage.tsx` | kolom input (muncul bila Terlaksana, wajib), pembanding rencana per sesi, nominal di Riwayat |
| `pages/DashboardPage.tsx` | kartu jadi "Realisasi Anggaran"; tabel serapan pakai angka aktual; rumus taksiran dihapus |
| `pages/KegiatanDetailPage.tsx` | blok Anggaran jadi Rencana vs Aktual + % serapan |

## Di luar lingkup

Halaman Laporan tidak menampilkan anggaran sama sekali saat ini, dan tetap begitu.

## Data yang sudah ada

Saat implementasi selesai, database berisi 1 kegiatan ("Test", anggaran 0) dengan
1 realisasi (September 2026, terlaksana). Baris itu akan terbaca `anggaran_aktual = 0`
setelah migrasi dan perlu diinput ulang bila nominalnya penting. Karena anggaran
kegiatannya juga 0, dampaknya nihil.

`fetchRealisasi()` menormalkan `anggaran_aktual ?? 0` supaya aplikasi tetap jalan
bila dimuat sebelum migrasi dijalankan — tanpa itu penjumlahan serapan menghasilkan
NaN dan Dashboard menampilkan "Rp NaN".
