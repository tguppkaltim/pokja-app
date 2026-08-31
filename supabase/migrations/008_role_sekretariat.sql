-- Menambahkan role sekretariat.
--
-- BERKAS INI HANYA BOLEH BERISI SATU STATEMENT DI BAWAH.
--
-- Postgres melarang nilai enum baru DIPAKAI di transaksi yang sama dengan
-- statement yang menambahkannya. "Dipakai" termasuk sekadar membacanya:
-- menambahkan `select enum_range(null::user_role)` sebagai verifikasi di sini
-- akan menggagalkan seluruh berkas dengan
--   55P04: unsafe use of new value "sekretariat" of enum type user_role
--
-- Jadi jangan menambahkan statement apa pun ke berkas ini. Verifikasi dan
-- pemakaiannya ada di migrasi 009, yang dijalankan setelah ini selesai.

alter type user_role add value if not exists 'sekretariat';
