# Modul Notulensi Rapat & Pelacakan Tindak Lanjut

Tanggal: 2026-08-29

## Masalah

Notulensi rapat dan tindak lanjutnya dikelola di spreadsheet terpisah. Tidak ada
pelacakan progres dari Open sampai Closed di dalam aplikasi, dan tidak ada yang
menghitung keterlambatan terhadap target.

## Keputusan

1. **Rapat dan tindak lanjut dipisah.** Satu rapat dicatat sekali, punya banyak
   tindak lanjut. Tanggal rapat tidak diketik ulang tiap baris, dan isi
   notulensinya tersimpan.
2. **PIC berupa unit kerja**, bukan orang: Pokja I–IV + Sekretariat.
3. **Empat status**: Open, On Progress, Closed, Dibatalkan. Keterlambatan
   dihitung, bukan disimpan.
4. **Role baru `sekretariat`** dengan hak kelola notulensi.
5. **Foto bukti opsional**, satu per tindak lanjut.

## Model data

```sql
create table rapat (
  id serial primary key,
  tanggal date not null,
  judul text not null,
  peserta text not null default '',
  ringkasan text not null default '',
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table tindak_lanjut (
  id serial primary key,
  rapat_id integer not null references rapat(id) on delete cascade,
  uraian text not null,
  pic text not null check (pic in ('pokja', 'sekretariat')),
  pic_pokja_id integer references pokja(id) on delete restrict,
  open_date date not null default current_date,
  target_closed date,
  closed_date date,
  status text not null default 'open'
    check (status in ('open', 'on_progress', 'closed', 'dibatalkan')),
  keterangan text not null default '',
  foto_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint pic_konsisten check (
    (pic = 'pokja' and pic_pokja_id is not null) or
    (pic = 'sekretariat' and pic_pokja_id is null)
  )
);
```

**PIC dipecah dua kolom, bukan satu teks.** Master Pokja mengizinkan nama pokja
diubah; menyimpan `'Pokja I'` sebagai teks akan meninggalkan tindak lanjut dengan
nama basi. Foreign key membuat namanya selalu ikut. Constraint `pic_konsisten`
mencegah kondisi mustahil seperti "Sekretariat tapi punya pokja_id".

**Keterlambatan tidak disimpan.** Sebuah tindak lanjut terlambat bila belum
Closed/Dibatalkan dan `target_closed` sudah lewat. Status yang harus diperbarui
manual pasti ada yang lupa; yang dihitung selalu benar.

**`closed_date` dikelola aplikasi**: terisi otomatis saat status jadi Closed,
dikosongkan saat status dikembalikan. Tidak ada baris "Open tapi punya tanggal
selesai".

## Role sekretariat

`user_role` adalah enum Postgres. `alter type ... add value` tidak boleh berada
di transaksi yang sama dengan statement yang memakai nilai barunya, jadi
penambahan enum berdiri sebagai migrasi terpisah (008) sebelum migrasi yang
memakainya (009).

Pengguna ber-role `sekretariat` punya `pokja_id` null.

## Hak akses

| Peran | Rapat | Tindak lanjut |
|---|---|---|
| super_admin | CRUD | semua |
| sekretariat | CRUD | semua |
| operator | baca | ubah baris ber-PIC pokjanya |
| viewer | baca | baca |

Sekretariat mendapat hak tulis penuh atas tindak lanjut, bukan hanya baris
ber-PIC Sekretariat. RLS Postgres bekerja per-baris, bukan per-kolom: membatasi
Sekretariat hanya pada barisnya sendiri berarti mereka tidak bisa memperbaiki
salah ketik pada baris yang mereka buat sendiri.

Ditegakkan RLS di database, bukan hanya UI.

## Foto bukti

Satu foto opsional per tindak lanjut, disimpan di bucket `evidence` yang sudah
ada dengan prefix `tindak-lanjut/<id>/`. Bucket itu sudah menegakkan batas MIME
dan ukuran 5 MB di sisi server (terverifikasi 2026-08-29), jadi tidak ada
konfigurasi storage baru.

Menyimpan `foto_path` sebagai kolom, bukan tabel terpisah, karena hanya satu
foto. Bila kelak perlu banyak foto, itu berarti tabel `tindak_lanjut_foto`
tersendiri — bukan menambah kolom.

## Halaman

Menu **Notulensi** di sidebar untuk semua role, dua tab:

- **Daftar Rapat** — kartu per rapat berisi tanggal, judul, dan ringkasan status
  tindak lanjutnya. Klik untuk detail: notulensi lengkap + daftar tindak lanjut.
- **Monitoring Tindak Lanjut** — tabel datar lintas rapat, kolomnya mengikuti
  spreadsheet yang dipakai sekarang. Bisa disaring per PIC, status, dan rentang
  tanggal. Status diubah langsung dari baris tabel.

## Di luar lingkup

Kartu ringkas tindak lanjut di Dashboard tidak dibuat. Ditambahkan nanti bila
modulnya sudah terpakai.
