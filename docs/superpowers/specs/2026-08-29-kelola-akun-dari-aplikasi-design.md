# Kelola Akun Pengguna dari Aplikasi

Tanggal: 2026-08-29

## Masalah

1. Akun baru hanya bisa dibuat lewat Supabase Dashboard. Tombol "Tambah
   Pengguna" di aplikasi cuma menampilkan pesan yang mengarahkan ke sana.
2. **"Nonaktifkan" tidak menonaktifkan apa pun.** `is_active` hanya kolom di
   `profiles`, dan `AuthContext` tidak pernah memeriksanya. Akun yang
   dinonaktifkan tetap bisa login dan memakai aplikasi sepenuhnya.
3. **"Reset Password" bergantung SMTP.** Memakai `resetPasswordForEmail`;
   email bawaan Supabase dibatasi ketat dan biasanya belum dikonfigurasi, jadi
   tombolnya melaporkan sukses meski email tidak pernah sampai.

Ketiganya butuh `service_role`, yang tidak boleh ada di frontend.

## Keputusan

1. **Satu Edge Function** `kelola-pengguna` dengan empat aksi.
2. **Admin menetapkan password awal.** Tidak bergantung email sama sekali,
   sehingga tidak bisa gagal diam-diam.
3. **Nonaktifkan berlapis tiga**, karena satu lapis saja bocor.

## Edge Function

Menerima `{ aksi, ... }`: `buat`, `nonaktifkan`, `aktifkan`, `reset_password`.

Setiap aksi memeriksa hal yang sama lebih dulu:

1. Identitas pemanggil dari JWT-nya.
2. `profiles.role` pemanggil dibaca **memakai service_role**, bukan dari klaim
   JWT. Peran diambil dari database, bukan dari sesuatu yang dikirim klien —
   kalau tidak, pembatasan "khusus super admin" hanya sekuat tebakan frontend.
3. Tolak `403` bila bukan `super_admin`.

`service_role` key tersedia otomatis di dalam Edge Function sebagai variabel
lingkungan `SUPABASE_SERVICE_ROLE_KEY`. Tidak perlu ditempel di mana pun dan
tidak pernah menyentuh bundle frontend.

## Nonaktifkan berlapis

| Lapis | Fungsi |
|---|---|
| `ban_duration` di Supabase Auth | Login baru ditolak di tingkat platform |
| `auth.admin.signOut(userId)` | Refresh token dicabut, sesi tidak bisa diperpanjang |
| Pemeriksaan `is_active` di `AuthContext` | Sesi yang masih hidup langsung dikeluarkan |

Lapis ketiga bukan hiasan: memblokir akun tidak langsung mematikan access token
yang sudah dipegang — token itu sah sampai kedaluwarsa, biasanya sejam. Tanpa
pemeriksaan di aplikasi, pengguna yang baru dinonaktifkan masih bisa bekerja
selama sisa waktu itu.

## Pembuatan akun

Form: nama, email, password awal (min. 8 karakter), role, dan pokja — pokja
hanya muncul bila role Operator, mengikuti pola dialog edit yang sudah ada.

Trigger `handle_new_user` yang sudah ada membuat baris `profiles` dengan role
`viewer`; fungsi lalu memperbaruinya ke role dan pokja yang dipilih.

Admin mengetahui password pengguna — konsekuensi dari pilihan ini. Form
mencantumkan pengingat agar pengguna menggantinya lewat menu Profil.

## Deploy

Bukan tempel SQL seperti migrasi sebelumnya. Dua cara:

- Dashboard Supabase → Edge Functions → Deploy new function, tempel kodenya.
- Supabase CLI: `supabase functions deploy kelola-pengguna`.

## Di luar lingkup

Penghapusan akun permanen tidak dibuat. Menonaktifkan sudah cukup, dan menghapus
akun akan menyisakan kegiatan serta tindak lanjut yang menunjuk pembuat yang
tidak ada.
