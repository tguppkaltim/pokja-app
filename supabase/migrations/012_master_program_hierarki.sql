-- Master Program: hierarki Bidang > Program Pokok > Unggulan > Prioritas
--
-- Dibangkitkan dari master-program.xlsx (sheet "Master Data").
-- Menyesuaikan Master Program dengan format resmi TP PKK Kalimantan Timur.
--
-- Catatan penting:
--   * Nama Program Pokok yang sudah ada DIGANTI DI TEMPAT (id tidak berubah),
--     sehingga seluruh kegiatan yang menunjuk ke sana tetap tersambung.
--   * kegiatan.program_prioritas_id sengaja nullable: kegiatan lama belum
--     dipetakan dan akan ditandai "belum dipetakan" di aplikasi.
--
-- JALANKAN SETELAH 011_drop_foto_path_tindak_lanjut.sql.

begin;

-- 1. Bidang -------------------------------------------------------------

alter table pokja add column if not exists nama_lengkap text not null default '';

comment on column pokja.nama_lengkap is
  'Nama resmi bidang sesuai master program. Kolom name tetap dipakai untuk label ringkas di antarmuka.';

update pokja set nama_lengkap = 'Pembinaan Karakter Keluarga (POKJA I)' where id = 1;
update pokja set nama_lengkap = 'Pendidikan dan Peningkatan Ekonomi Keluarga (POKJA II)' where id = 2;
update pokja set nama_lengkap = 'Penguatan Ketahanan Keluarga (POKJA III)' where id = 3;
update pokja set nama_lengkap = 'Kesehatan Keluarga dan Lingkungan (POKJA IV)' where id = 4;

-- Sekretariat menjadi bidang kelima. Dipakai baik oleh master program maupun
-- oleh tindak lanjut notulensi yang PIC-nya sekretariat.
insert into pokja (id, name, description, nama_lengkap) values
  (5, 'Sekretariat', 'Dukungan kelembagaan, administrasi, dan publikasi Gerakan PKK', 'Sekretariat')
on conflict (id) do update set nama_lengkap = excluded.nama_lengkap;

select setval('pokja_id_seq', greatest(5, (select max(id) from pokja)));

-- 2. Program Pokok ------------------------------------------------------

alter table program_pokok
  add column if not exists indikator text not null default '',
  add column if not exists sasaran   text not null default '',
  add column if not exists urutan    integer not null default 0,
  add column if not exists di_luar_master boolean not null default false;

comment on column program_pokok.urutan is
  'Nomor urut baku 10 Program Pokok PKK. 0 untuk yang di luar daftar baku.';
comment on column program_pokok.di_luar_master is
  'True bila program ini tidak ada di master resmi tapi masih dipakai kegiatan.';

-- Ganti nama di tempat: id tetap, kegiatan tidak putus.
update program_pokok set
  name = 'Penghayatan dan Pengamalan Pancasila',
  urutan = 1,
  indikator = '- Jumlah Kegiatan
- Persentase Capaian
- Dokumen',
  sasaran = '- Keluarga
- Kader PKK
- Masyarakat desa/kelurahan'
where id = 1;
update program_pokok set
  name = 'Gotong Royong',
  urutan = 2,
  indikator = '',
  sasaran = ''
where id = 2;
update program_pokok set
  name = 'Pendidikan dan Keterampilan',
  urutan = 6,
  indikator = 'Aspek Pendidikan dan Keterampilan:
- Jumlah Anak Usia Sekolah
- Jumlah Anak Putus Sekolah/Tidak Sekolah
- Jumlah partisipasi kelompok belajar Paket A, B, dan C
- Jumlah Tutor Kelompok Belajar Paket A,B, dan C
- Jumlah partisipasi keluarga dalam pelaksanaan program/kegiatan
- Dokumentasi (laporan kegiatan, foto, publikasi media)

Aspek Ekonomi:
- Data perkembangan Jumlah Kelompok UP2K PKK
- Data perkembangan Jumlah Koperasi PKK
- Data perkembangan UMKM Binaan PKK',
  sasaran = 'Aspek Pendidikan dan Keterampilan:
- Keluarga
- Anak Usia Sekolah
- Kader PKK dan Dasawisma
- Tutor
- Kelompok Belajar Paket A, B, dan C

Aspek Ekonomi:
- Keluarga
- Poklak dan Poksus UP2K PKK
- Kader PKK dan Dasawisma
- Pengurus Koperasi PKK
- UMKM Binaan PKK'
where id = 4;
update program_pokok set
  name = 'Pengembangan Kehidupan Berkoperasi',
  urutan = 8,
  indikator = 'Aspek Pendidikan dan Keterampilan:
- Jumlah Anak Usia Sekolah
- Jumlah Anak Putus Sekolah/Tidak Sekolah
- Jumlah partisipasi kelompok belajar Paket A, B, dan C
- Jumlah Tutor Kelompok Belajar Paket A,B, dan C
- Jumlah partisipasi keluarga dalam pelaksanaan program/kegiatan
- Dokumentasi (laporan kegiatan, foto, publikasi media)

Aspek Ekonomi:
- Data perkembangan Jumlah Kelompok UP2K PKK
- Data perkembangan Jumlah Koperasi PKK
- Data perkembangan UMKM Binaan PKK',
  sasaran = 'Aspek Pendidikan dan Keterampilan:
- Keluarga
- Anak Usia Sekolah
- Kader PKK dan Dasawisma
- Tutor
- Kelompok Belajar Paket A, B, dan C

Aspek Ekonomi:
- Keluarga
- Poklak dan Poksus UP2K PKK
- Kader PKK dan Dasawisma
- Pengurus Koperasi PKK
- UMKM Binaan PKK'
where id = 6;
update program_pokok set
  name = 'Pangan',
  urutan = 3,
  indikator = '- Jumlah keluarga memanfaatkan pekarangan
- Jumlah kader yang aktif dalam edukasi B2SA dan MP-ASI lokal
- Jumlah kegiatan MBG Non Peserta Didik
- Persentase rumah tangga mengonsumsi pangan lokal dan bergizi',
  sasaran = '- Keluarga
- Ibu hamil, balita, ibu menyusui
- Kader PKK
- Masyarakat desa/kelurahan'
where id = 7;
update program_pokok set
  name = 'Sandang',
  urutan = 4,
  indikator = '- Persentase penggunaan produk sandang lokal dalam keluarga
- Jumlah kegiatan untuk mendukung pemanfaatan sandang secara berkelanjutan',
  sasaran = '- Perajin sandang
- Keluarga
- Generasi muda
- Kader PKK'
where id = 8;
update program_pokok set
  name = 'Perumahan dan Tata Laksana Rumah Tangga',
  urutan = 5,
  indikator = '- Persentase jumlah rumah tangga yang menerapkan prinsip rumah sehat
- Jumlah rumah dengan sanitasi dan ventilasi layak',
  sasaran = '- Keluarga
- Masyarakat perdesaan dan perkotaan
- Pemerintah daerah
- Kader PKK'
where id = 9;
update program_pokok set
  name = 'Kesehatan',
  urutan = 7,
  indikator = 'Aspek Kesehatan
a. Peduli Stunting
- Jumlah Bayi Lahir Prematur
- Jumlah Bayi Lahir Berat Badan Bayi Lahir Rendah (BBLR)
- Jumlah Balita Kurang Gizi
- Jumlah Balita Stunting
- Jumlah bayi dan balita yang rutin dilakukan pemeriksaan tumbuh kembang setiap bulan
- Jumlah Ibu yang melahirkan dengan jarak terlalu dekat
- Jumlah kehamilan yang tidak direncanakan /tidak diinginkan
b. Perilaku Hidup Bersih dan Sehat (PHBS)
- Jumlah penduduk yang mematuhi protokol Kesehatan
- Jumlah rumah yang memiliki jamban sehat
- Jumlah rumah yang memiliki fasilitas instalasi atau bak penampung air bersih
- Jumlah kasus penyakit Diare
- Jumlah keluarga yang sadar gizi
- Jumlah rumah tanpa asap rokok
- Jumlah penduduk yang masih Buang Air Besar Sembarangan (BABS)
c. Peduli Kesehatan Keluarga
- Jumlah Ayah yang rutin melakukan pemeriksaan kesehatan minimal 1x per tahun pada Pemeriksaan Kesehatan Gratis (PKG) atau Medical Check Up (MCU)
- Jumlah ibu hamil yang rutin memeriksakan kehamilannya pada pelayanan kesehatan secara berkala
- Jumlah kasus Kematian Ibu nifas
- Jumlah kasus Kanker Serviks pada Perempuan
- Jumlah bayi dan balita yang mendapat imunisasi
- Jumlah bayi dan balita sakit yang terdata pada fasilitas Kesehatan
- Jumlah kasus Kematian Bayi dan Balita

Aspek Kelestarian Lingkungan Hidup
a. Siaga kebakaran lingkungan
- Jumlah kasus Kebakaran Rumah Tangga
- Jumlah kasus kebakaran non rumah tangga
- Jumlah Rumah Tangga yang memiliki Alat Pemadam Api Ringan (APAR) atau Instalasi Air untuk antisipasi kebakaran
- Jumlah Rumah Semi Permanen dan rumah kayu
- Jumlah Rumah Tangga yang memiliki Kotak P3K
- Jumlah kasus Kecelakaan Rumah Tangga
- Jumlah instalasi air atau hydrant antisipasi Kebakaran
b. Tanggap dan Tangguh Bencana Alam
- Jumlah korban akibat Bencana Alam
- Jumlah kasus kerusakan lingkungan akibat eksploitasi hasil alam
- Jumlah kasus kerusakan lingkungan akibat bencana alam
- Jumlah luas pengikisan tanah atau erosi
- Jumlah luas alih fungsi pemanfaatan lahan
- Jumlah luas area restorasi kerusakan alam
- Jumlah kerusakan fasilitas bangunan
c. Peduli Lingkungan
- Jumlah Rumah yang memiliki bak sampah
- Jumlah Anggota Bank Sampah
- Jumlah rumah yang menggunakan Sistem Pembuangan Air Limbah (SPAL)
- Jumlah kasus banjir
- Jumlah bak sampah milik Desa/Kelurahan
- Jumlah Rumah dengan ventilasi udara yang baik
- Jumlah kasus Kejadian Luar Biasa (KLB)

Aspek Perencanaan Sehat
a. Menuju keluarga sehat berkualitas
- Jumlah Keluarga dengan 2 anak
- Jumlah Penduduk yang berobat ke fasilitas Kesehatan
- Jumlah kasus penyakit menular
- Jumlah kasus penyakit tidak menular
- Jumlah Bayi Lahir Sehat
- Jumlah Bayi Lahir Cukup Bulan
- Jumlah keluarga yang memiliki anggota dengan kriteria penyakit gangguan jiwa
b. Menuju keuangan sehat
- Jumlah Keluarga yang memiliki Asuransi Kesehatan
- Jumlah kepala keluarga yang tidak memiliki pekerjaan / Pengangguran
- Jumlah kepala keluarga yang tidak memiliki pekerjaan tetap
- Jumlah Kepala Keluarga yang memiliki penghasilan tetap
- Jumlah Ibu hamil yang mempunyai Tabungan bersalin (TABULIN)
- Jumlah keluarga yang memiliki Tabungan
- Jumlah keluarga yang mempunyai aset untuk investasi
c. Mewujudkan keluarga sehat pasangan usia subur (PUS)
- Jumlah Ibu melahirkan Bayi sehat
- Jumlah Wanita sebagai peserta KB
- Jumlah Pria peserta KB
- Jumlah Wanita pada Pasangan Usia Subur (PUS) yang memiliki masalah kesehatan reproduksi
- Jumlah Pasangan Usia Subur (PUS) yang menikah dengan isteri usia di bawah 20 Tahun
- Jumlah Wanita Usia Subur dengan kehamilan berisiko
- Jumlah penderita penyakit infeksi menular seksual pada Pasangan Usia Subur (PUS)',
  sasaran = '- Keluarga
- Ibu dan Anak
- Pasangan Usia Subur
- Kader PKK
- Masyarakat desa/kelurahan'
where id = 10;
update program_pokok set
  name = 'Kelestarian Lingkungan Hidup',
  urutan = 9,
  indikator = '',
  sasaran = ''
where id = 11;
update program_pokok set
  name = 'Perencanaan Sehat',
  urutan = 10,
  indikator = '',
  sasaran = ''
where id = 12;

-- Program Pokok yang belum ada di sistem.
insert into program_pokok (pokja_id, name, urutan, indikator, sasaran)
select 5, 'Lintas 10 Program Pokok PKK (dukungan kelembagaan/sekretariat)', 0, '- Jumlah Kader PKK dan Dasawisma yang terlatih
- Jumlah dan jenis Juknis Panduan Kelembagaan PKK yang tersusun
- Jumlah jenis Sistem Informasi Gerakan PKK / E-PKK yang digunakan
- Data dan Informasi tentang 10 Program Pokok PKK', '- Pengurus TP PKK
- Kelompok PKK
- Kader PKK dan Dasawisma'
where not exists (select 1 from program_pokok where pokja_id = 5 and name = 'Lintas 10 Program Pokok PKK (dukungan kelembagaan/sekretariat)');

-- Dua baris seed tanpa padanan di master: "Karakter Keluarga" (3) dan
-- "Literasi" (5). Hapus hanya bila benar-benar tidak dipakai; kalau masih
-- dipakai kegiatan, pertahankan dan tandai agar terlihat di antarmuka.
do $$
declare
  sisa integer;
begin
  foreach sisa in array array[3, 5] loop
    if exists (select 1 from kegiatan where program_pokok_id = sisa) then
      update program_pokok set di_luar_master = true, urutan = 0 where id = sisa;
      raise notice 'Program Pokok id % masih dipakai kegiatan, dipertahankan dan ditandai di luar master.', sisa;
    else
      delete from program_pokok where id = sisa;
      raise notice 'Program Pokok id % tidak dipakai kegiatan, dihapus.', sisa;
    end if;
  end loop;
end $$;

-- 3. Program Unggulan ---------------------------------------------------

create table if not exists program_unggulan (
  id serial primary key,
  program_pokok_id integer not null references program_pokok(id) on delete cascade,
  name text not null,
  asal text not null default 'Pusat',
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  unique (program_pokok_id, name)
);

comment on column program_unggulan.asal is 'Pusat atau Daerah, sesuai kolom PROGRAM PUSAT/DAERAH di master.';

insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 2 and pp.name = 'Pengembangan Kehidupan Berkoperasi'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Ketahanan Pangan Berbasis Masyarakat Menuju Indonesia Emas (KETAPANG-MAS)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 3 and pp.name = 'Pangan'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 3 and pp.name = 'Sandang'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 3 and pp.name = 'Perumahan dan Tata Laksana Rumah Tangga'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Revitalisasi Rumah dan Tata Laksana Rumah Tangga Bersih, Sehat, Rapi, dan Inovatif (REHARTA BERSERI)', 'Pusat', 2
from program_pokok pp where pp.pokja_id = 3 and pp.name = 'Perumahan dan Tata Laksana Rumah Tangga'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 4 and pp.name = 'Kesehatan'
on conflict (program_pokok_id, name) do nothing;
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Memperkuat Kelembagaan PKK terfokus pada teknologi informasi', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 5 and pp.name = 'Lintas 10 Program Pokok PKK (dukungan kelembagaan/sekretariat)'
on conflict (program_pokok_id, name) do nothing;

-- 4. Program Prioritas --------------------------------------------------

create table if not exists program_prioritas (
  id serial primary key,
  program_unggulan_id integer not null references program_unggulan(id) on delete cascade,
  name text not null,
  contoh_kegiatan text not null default '',
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  unique (program_unggulan_id, name)
);

comment on column program_prioritas.contoh_kegiatan is
  'Contoh kegiatan acuan dari master. Bukan kegiatan yang direncanakan; itu ada di tabel kegiatan.';

insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Keluarga Indonesia Sejahtera Harmonis (KISAH)', '- Judol Pinjol Teratasi (Jupiter)
- Cegah Perkawinan Anak (Cepak)
- Calon Pengantin (Catin)
- Lansia Siap (Lansiap)', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Keluarga Indonesia Sehat Tanpa Narkoba (KRISAN)', '- Sosialisasi Pencegahan dan Rehabilitasi Penyalahgunaan Narkoba dan Zat Adiktif lainnya
- Peningkatan Kapasitas Kader PKK', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Keluarga Indonesia Lindungi Anak dari Kekerasan Seksual (KILAS)', '- Sosialisasi Pencegahan Kekerasan Seksual Pada Anak
- Pendampingan Pada Anak Korban Kekerasan Berbasis Masyarakat', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Keluarga Indonesia Anti Trafficking (KIAT)', '- Sosialisasi Pencegahan Perdagangan Manusia
- Pendampingan Pada Korban TPPO Berbasis Masyarakat', 4
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pembinaan Kesadaran Bela Negara (PKBN)', '- PKK SIP (SOSIALISASI IDEOLOGI PANCASILA)
- PKK HADIR
- Keluarga Sadar Hukum (KADARKUM)', 5
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Keluarga Indonesia Sadar Administrasi Kependudukan (KISAK)', '- Sosialisasi Kesadaran Administrasi Kependudukan
- Lomba Vlog Caper (CATATKAN PERKAWINANMU)
- Pemberian Dokumen Kependudukan Bagi Pemula', 6
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Penghayatan dan Pengamalan Pancasila' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Peningkatan kesadaran Keluarga tentang wajib belajar 12 Tahun;', '- Kampanye dan edukasi tentang pentingnya program wajib belajar 12 Tahun kepada keluarga
- Inventarisasi/Pendataan Anak Usia Sekolah
- Inventarisasi/Pendataan dan Pembinaan Anak Putus/Tidak Sekolah
- Revitalisasi PAUD binaan PKK dalam menyongsong Program Wajib Belajar 13 Tahun
- Mendorong pemerintah, pemerintah daerah/Desa untuk menjamin terwujudnya wajib belajar minimal pada jenjang pendidikan dasar secara gratis', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penguatan peran keluarga sebagai pusat pendidikan pertama dan utama sesuai arah kebijakan lifelong learning;', '- Pembinaan orang tua dalam pendidikan karakter anak dan pengasuhan positif
- Kelas edukasi orang tua (parenting class) di Posbindu/PAUD binaan PKK
- Reaktivasi Bina Keluarga Balita (BKB) PKK
- Gerakan gemar membaca 30 menit sehari di rumah
- Gerakan Seminggu Sebuku', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Menggerakkan keluarga dalam peningkatan pendidikan dan keterampilan berbasis kebutuhan lokal', '- Revitalisasi taman bacaan Masyarakat / perpustakaan Desa / Kelurahan melalui kegiatan-kegiatan literasi seperti bazar buku murah, bedah buku, diseminasi, dll
- Program RUMAH DILAN (Rumah Pendidikan dan Keterampilan) sebagai wadah Edukasi keluarga berbasis komunitas dengan menggunakan modul (literasi, numerasi, karakter, parenting) dan keterampilan yang relevan dengan potensi kesenian dan budaya lokal seperti menenun, menyulam, memahat, dll', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Memperluas akses pendidikan dan pelatihan melalui teknologi informasi.', '- Pemanfaatan platform digital PKK (website/aplikasi buatan lainnya ) untuk penyebaran materi edukatif bagi keluarga
- Mendorong pemerintah/pemerintah daerah/Desa untuk penyediaan e-learning berbasis keluarga
- Mendorong pemerintah/pemerintah daerah/Desa untuk perluasan infrastruktur digital (akses internet) terutama bagi Desa-Desa di wilayah blindspot
- Mendorong pemerintah/pemerintah daerah/Desa untuk penyediaan bantuan sarana pendukung literasi digital kepada anak-anak usia sekolah
- Bekerjasama dengan startup yang relevan dalam upaya peningkatan softskill keluarga', 4
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Memfasilitasi Peningkatan kapasitas Kader PKK bagi tutor Kelompok Belajar Paket A,B,C', '- TOT bagi tutor untuk kelompok belajar Paket A,B dan C bekerjasama dengan instansi terkait
- Mendorong pelaksanaan sertifikasi bagi tutor untuk kelompok belajar Paket A,B dan C melalui instansi terkait', 5
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pemberdayaan kelompok rentan (perempuan, difabel, lansia) dan Gen-Z /remaja', '- Melaksanakan Program Pelatihan yang inklusif untuk Kelompok rentan (perempuan, difabel, lansia) dan remaja berbasis gender (misalnya, menjahit, memasak sehat, kerajinan tangan/kriya, kemampuan berbahasa asing, dan kewirausahaan digital)
- Pengarustamaan partisipasi/keterlibatan remaja milenial/Gen-Z dalam setiap pelaksanaan program-program PKK', 6
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pendidikan dan Keterampilan' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penguatan Ekonomi keluarga melalui pembentukan Kelompok UP2K PKK', '- Revitalisasi UP2K PKK melalui:
1. Pembaruan Juklak/Juknis Pedoman Pelaksanaan UP2K PKK sesuai dengan perkembangan perekonomian terkini;
2. Inventarisasi data perkembangan UP2K PKK;
- Pengembangan Usaha UP2K melalui:
1. Mengupayakan bantuan permodalan
2. pelatihan manajemen usaha
3. bantuan pemasaran produk
4. Kerjasama dengan mitra strategis terkait seperti BUMD / BUMDes, Dekranas / Dekranasda, CSR, UMKM, dll;
- Transformasi digital dalam pengembangan usaha UP2K PKK melalui pemanfaatan platform e-commerce
- Mendorong pengembangan UP2K PKK menjadi UMKM atau Koperasi', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pengembangan Kehidupan Berkoperasi' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Mengembangkan Industri Kreatif serta Mengembangkan Agromaritim Industri di Sentra Produksi melalui Peran Aktif Koperasi PKK', '- Optimalisasi Pembentukan dan Pengembangan Koperasi PKK
1. Mendorong pembentukan Koperasi PKK
2. Inventarisasi data perkembangan Koperasi PKK
3. Pelatihan tata kelola koperasi dan akuntansi sederhana kepada pengurus koperasi PKK
4. Mendorong Pembentukan Badan Hukum Koperasi PKK
5. Membangun jejaring kemitraan strategis dengan sektor usaha atau kelompok masyarakat lainnya seperti BUMD/BUMDes, GAPOKTAN, KWT, UMKM, termasuk dengan Koperasi Desa/Kelurahan Merah Putih
6. Mendorong transformasi Koperasi PKK bergerak di sektor produksi', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pengembangan Kehidupan Berkoperasi' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Mendorong Kewirausahaan dan Mengembangkan Industri Kreatif dan produktif melalui UMKM binaan PKK', '- Inkubasi UMKM Binaan PKK :
1. Mengupayakan Bantuan Permodalan
2. Bantuan pemasaran/promosi melalui event-event dan hari besar Pemerintah/Pemerintah Daerah/Desa/Kelurahan, Dekranas, dan juga di Sarana dan Prasarana Transportasi umum seperti Bandara, Pelabuhan, dan Fasilitas penunjang lainnya seperti Hotel serta di pusat-pusat perbelanjaan atau hiburan
3. Mendorong ekspansi di sektor pengadaan barang dan jasa melalui pendaftaran di e-catalog LPSE
4. Bantuan sertifikasi produk UMKM (Halal dan BPOM)
5. Membangun jejaring kemitraan strategis
6. Menyelenggarakan Bazaar/Pasar Murah untuk UMKM binaan PKK
7. Kerjasama dengan dengan instansi terkait dan e-commerce', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pengembangan Kehidupan Berkoperasi' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Mendorong Transformasi Digital UMKM binaan PKK dan Koperasi PKK', '- Pemanfaatan platform digital untuk tata kelola, promosi, dan transaksi seperti penggunaan QRIS sebagai salah satu contoh metode pembayaran', 4
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 2 and pp.name = 'Pengembangan Kehidupan Berkoperasi' and pu.name = 'Gerakan Keluarga Indonesia dalam Peningkatan Kualitas Pendidikan dan Pengelolaan Ekonomi (GELARI PELANGI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Revitalisasi AKU HATINYA PKK berbasis tanaman unggulan daerah bernilai ekonomi tinggi', '- Pemanfaatan Pekarangan Produktif Berbasis Kearifan Lokal
- GERTAM CABE (Gerakan Tanam Cabe di Pekarangan)
- Pelatihan pembuatan kebun gizi keluarga (KGK)', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Pangan' and pu.name = 'Ketahanan Pangan Berbasis Masyarakat Menuju Indonesia Emas (KETAPANG-MAS)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Gerakan Keluarga Cerdas Gizi', '- Gerakan konsumsi pangan lokal berbasis B2SA
- Peningkatan kapasitas kader dalam mendukung konsumsi pangan aman
- Pelatihan olahan pangan lokal bergizi dan sehat
- Kampanye Gemar Konsumsi Ikan (Gisikan) dan Protein Hewani (Prowani)
- Festival pangan lokal sehat', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Pangan' and pu.name = 'Ketahanan Pangan Berbasis Masyarakat Menuju Indonesia Emas (KETAPANG-MAS)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Program MBG Non-Peserta Didik', '- Mendukung Penyediaan makanan tambahan untuk ibu hamil, menyusui, dan balita
- Pemantauan dan evaluasi gizi keluarga berbasis kader PKK', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Pangan' and pu.name = 'Ketahanan Pangan Berbasis Masyarakat Menuju Indonesia Emas (KETAPANG-MAS)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pengurangan Susut dan Sisa Pangan', '- Edukasi penanganan Susut dan Sisa Pangan
- Kampanye “Stop Boros Pangan”
- Pelatihan pemanfaatan ulang sisa makanan
- Gerakan "Piringku Tidak Bersisa" di tingkat keluarga', 4
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Pangan' and pu.name = 'Ketahanan Pangan Berbasis Masyarakat Menuju Indonesia Emas (KETAPANG-MAS)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Kampanye Sandang Lokal yang Bermoral, Beretika dan Berbudaya', '- Sosialisasi dan edukasi sandang lokal pada kader dan keluarga
- Festival dan lomba busana sandang lokal
- Gerakan Hari Sandang Lokal (HSL)', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Sandang' and pu.name = 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Peningkatan Inovasi Produk Sandang Lokal', '- Pelatihan desain dan motif lokal', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Sandang' and pu.name = 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penggunaan Warna Alami Ramah Lingkungan', '- Workshop pewarnaan alami
- Pelatihan teknis untuk pengrajin', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Sandang' and pu.name = 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penguatan Rumah Sehat dan Tatalaksana Rumah Tangga', '- Pelatihan pedoman rumah sehat layak huni
- Edukasi pengelolaan ruang dan sanitasi rumah
- Edukasi pengelolaan dapur sehat dan aman
- Penataan ruang keluarga yang fungsional dan nyaman
- Pemilahan dan pengelolaan sampah rumah tangga', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Perumahan dan Tata Laksana Rumah Tangga' and pu.name = 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Gerakan Rumah Tangga Tertib dan Ramah Lingkungan', '- Kampanye dan lomba rumah tangga berseri (bersih, sehat, rapi)
- Penerapan 3R di tingkat rumah tangga
- Pendampingan perbaikan rumah tidak layak huni (RTLH)
- Sosialisasi desain rumah sehat berbasis budaya lokal
- Penggunaan teknologi sederhana untuk sanitasi rumah', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Perumahan dan Tata Laksana Rumah Tangga' and pu.name = 'Revitalisasi Rumah dan Tata Laksana Rumah Tangga Bersih, Sehat, Rapi, dan Inovatif (REHARTA BERSERI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pemanfaatan Teknologi Tepat Guna di Rumah Tangga', '- Pelatihan penggunaan alat sederhana ramah lingkungan
- Edukasi perilaku hemat energi dan air
- Pelatihan membangun resapan air sederhana', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Perumahan dan Tata Laksana Rumah Tangga' and pu.name = 'Revitalisasi Rumah dan Tata Laksana Rumah Tangga Bersih, Sehat, Rapi, dan Inovatif (REHARTA BERSERI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Kampanye “REHARTA BERSERI”', '- Promosi kampanye melalui media lokal dan digital
- Pemberian penghargaan bagi rumah tangga teladan
- Integrasi dengan kegiatan PKK lainnya di desa/kelurahan', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 3 and pp.name = 'Perumahan dan Tata Laksana Rumah Tangga' and pu.name = 'Revitalisasi Rumah dan Tata Laksana Rumah Tangga Bersih, Sehat, Rapi, dan Inovatif (REHARTA BERSERI)'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Cek Kesehatan Gratis (CKG)', '- Pemeriksaan Kesehatan Gratis
- Pemberian makan bergizi melalui program PMT pada Balita, Ibu hamil dan menyusui serta anak sekolah
- Sosialisasi, advokasi dan edukasi penyakit menular (TBC, Malaria, HIV/AIDS -Sifilis dan Hepatitis)
- Sosialisasi, advokasi dan edukasi faktor risiko Penyakit Tidak Menular (Deteksi kanker payudara dan leher rahim Obesitas, Hipertensi dan Diabetes Mellitus, termasuk pengendalian gula garam lemak/GGL)
- Sosialisasi, advokasi dan edukasi dengan Pemberian Imunisasi Lengkap dan Tepat Usia untuk Anak Zero Dose
- Sosialisasi, advokasi dan edukasi Implementasi lima pilar Sanitasi Total Berbasis Masyarakat (STBM);
- Pembekalan Kader Kesehatan (PHBS, TBC, Gizi, KB, Obat, Makanan dan Kosmetik, dsb)
- Menggalakkan Bank Sampah, Sosialisasi, advokasi dan edukasi Pengolahan sampah plastik dan pelestarian lingkungan melalui penanaman pohon', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Peduli Stunting Pemberian makan bergizi melalui program PMT pada Balita, Ibu hamil dan menyusui serta anak sekolah', '', 2
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pengendalian penyakit menular (TBC, Malaria, HIV/AIDS -Sifilis dan Hepatitis)', '', 3
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Mengendalikan faktor risiko PTM (Deteksi kanker payudara dan leher rahim Obesitas, Hipertensi dan Diabetes Mellitus, termasuk pengendalian gula garam lemak/GGL)', '', 4
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pemberian Imunisasi Lengkap dan Tepat Usia (Imunisasi Zero Dose )', '', 5
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penggerakan keluarga dalam rangka mendorong perubahan perilaku Ibu Rumah Tangga dalam implementasi lima pilar Sanitasi Total Berbasis Masyarakat (STBM);', '', 6
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pembekalan Kader Kesehatan', '', 7
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kesehatan' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Memperkuat kelembagaan PKK yang terfokus pada teknologi informasi', '- Peningkatan Kapasitas TP PKK dan Kader PKK
- Penyusunan modul pelatihan kapasitas TP PKK dan Kader PKK
- Pelaksanaan dukungan pada Rapat Kerja, Rapat Koordinasi, Rapat Konsultasi, Peringatan HKG, dan Jambore PKK
- Pelayanan pelaksanaan kegiatan administrasi PKK
- Publikasi Gerakan PKK
- Monitoring dan Evaluasi
- Sinergi program kegiatan PKK dengan mitra', 1
from program_unggulan pu
join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 5 and pp.name = 'Lintas 10 Program Pokok PKK (dukungan kelembagaan/sekretariat)' and pu.name = 'Memperkuat Kelembagaan PKK terfokus pada teknologi informasi'
on conflict (program_unggulan_id, name) do nothing;

-- 5. Kaitan kegiatan ----------------------------------------------------

-- Nullable dengan sengaja: kegiatan yang sudah ada belum dipetakan ke master
-- baru. Aplikasi mewajibkannya untuk kegiatan baru dan menandai yang kosong.
alter table kegiatan
  add column if not exists program_prioritas_id integer
  references program_prioritas(id) on delete set null;

create index if not exists kegiatan_program_prioritas_idx
  on kegiatan(program_prioritas_id);

-- 6. RLS ----------------------------------------------------------------

alter table program_unggulan  enable row level security;
alter table program_prioritas enable row level security;

-- drop dulu supaya migrasi aman dijalankan ulang: create policy tidak punya
-- varian "if not exists".
drop policy if exists "program_unggulan_select"  on program_unggulan;
drop policy if exists "program_unggulan_manage"  on program_unggulan;
drop policy if exists "program_prioritas_select" on program_prioritas;
drop policy if exists "program_prioritas_manage" on program_prioritas;

create policy "program_unggulan_select" on program_unggulan
  for select to authenticated using (true);
create policy "program_unggulan_manage" on program_unggulan
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

create policy "program_prioritas_select" on program_prioritas
  for select to authenticated using (true);
create policy "program_prioritas_manage" on program_prioritas
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

commit;

-- Verifikasi
select
  (select count(*) from pokja)                                   as bidang,
  (select count(*) from program_pokok)                           as program_pokok,
  (select count(*) from program_unggulan)                        as program_unggulan,
  (select count(*) from program_prioritas)                       as program_prioritas,
  (select count(*) from program_pokok where di_luar_master)      as di_luar_master,
  (select count(*) from kegiatan where program_prioritas_id is null) as kegiatan_belum_dipetakan;
