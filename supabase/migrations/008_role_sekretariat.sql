-- Menambahkan role sekretariat.
--
-- BERDIRI SENDIRI, JANGAN DIGABUNG DENGAN MIGRASI 009.
-- Postgres melarang nilai enum baru dipakai di transaksi yang sama dengan
-- statement yang menambahkannya. Menggabungkan berkas ini dengan 009 — yang
-- policy-nya menyebut 'sekretariat' — akan gagal dengan
-- "unsafe use of new value of enum type".
--
-- Jalankan berkas ini sampai selesai, baru jalankan 009.

alter type user_role add value if not exists 'sekretariat';

-- Verifikasi: harus memuat sekretariat
select enum_range(null::user_role) as nilai_role;
