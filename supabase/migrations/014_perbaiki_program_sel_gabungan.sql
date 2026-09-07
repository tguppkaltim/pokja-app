-- Perbaiki Program Pokok yang ikut disebut di sel gabungan.
--
-- Beberapa baris master menuliskan lebih dari satu Program Pokok dalam satu
-- sel — baris 2 menyebut Pancasila dan Gotong Royong, baris 29 menyebut
-- Kesehatan, Kelestarian Lingkungan Hidup, dan Perencanaan Sehat. Artinya
-- Program Pokok itu BERBAGI Program Unggulan dan Prioritas pada baris tsb.
--
-- Migrasi 012 keliru membacanya: unggulan hanya dilekatkan ke Program Pokok
-- yang disebut pertama, sehingga Gotong Royong, Kelestarian Lingkungan Hidup,
-- dan Perencanaan Sehat tidak punya satu pun Program Prioritas. Akibatnya
-- form Rencana Kegiatan tidak bisa menawarkan pilihan apa pun untuk ketiganya.
--
-- Aman dijalankan ulang: setiap penyisipan memakai on conflict do nothing.

begin;

-- baris 2: Gotong Royong berbagi unggulan dengan Penghayatan dan Pengamalan Pancasila
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 1 and pp.name = 'Gotong Royong'
on conflict (program_pokok_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Keluarga Indonesia Sejahtera Harmonis (KISAH)', '- Judol Pinjol Teratasi (Jupiter)
- Cegah Perkawinan Anak (Cepak)
- Calon Pengantin (Catin)
- Lansia Siap (Lansiap)', 1
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 1 and pp.name = 'Gotong Royong' and pu.name = 'Pola Asuh Anak dan Remaja di Era Digital (PAAREDI)'
on conflict (program_unggulan_id, name) do nothing;

-- baris 29: Kelestarian Lingkungan Hidup berbagi unggulan dengan Kesehatan
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup'
on conflict (program_pokok_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Cek Kesehatan Gratis (CKG)', '- Pemeriksaan Kesehatan Gratis
- Pemberian makan bergizi melalui program PMT pada Balita, Ibu hamil dan menyusui serta anak sekolah
- Sosialisasi, advokasi dan edukasi penyakit menular (TBC, Malaria, HIV/AIDS -Sifilis dan Hepatitis)
- Sosialisasi, advokasi dan edukasi faktor risiko Penyakit Tidak Menular (Deteksi kanker payudara dan leher rahim Obesitas, Hipertensi dan Diabetes Mellitus, termasuk pengendalian gula garam lemak/GGL)
- Sosialisasi, advokasi dan edukasi dengan Pemberian Imunisasi Lengkap dan Tepat Usia untuk Anak Zero Dose
- Sosialisasi, advokasi dan edukasi Implementasi lima pilar Sanitasi Total Berbasis Masyarakat (STBM);
- Pembekalan Kader Kesehatan (PHBS, TBC, Gizi, KB, Obat, Makanan dan Kosmetik, dsb)
- Menggalakkan Bank Sampah, Sosialisasi, advokasi dan edukasi Pengolahan sampah plastik dan pelestarian lingkungan melalui penanaman pohon', 1
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Peduli Stunting Pemberian makan bergizi melalui program PMT pada Balita, Ibu hamil dan menyusui serta anak sekolah', '', 2
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pengendalian penyakit menular (TBC, Malaria, HIV/AIDS -Sifilis dan Hepatitis)', '', 3
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Mengendalikan faktor risiko PTM (Deteksi kanker payudara dan leher rahim Obesitas, Hipertensi dan Diabetes Mellitus, termasuk pengendalian gula garam lemak/GGL)', '', 4
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pemberian Imunisasi Lengkap dan Tepat Usia (Imunisasi Zero Dose )', '', 5
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penggerakan keluarga dalam rangka mendorong perubahan perilaku Ibu Rumah Tangga dalam implementasi lima pilar Sanitasi Total Berbasis Masyarakat (STBM);', '', 6
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pembekalan Kader Kesehatan', '', 7
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Kelestarian Lingkungan Hidup' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;

-- baris 29: Perencanaan Sehat berbagi unggulan dengan Kesehatan
insert into program_unggulan (program_pokok_id, name, asal, urutan)
select pp.id, 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana', 'Pusat', 1
from program_pokok pp where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat'
on conflict (program_pokok_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Cek Kesehatan Gratis (CKG)', '- Pemeriksaan Kesehatan Gratis
- Pemberian makan bergizi melalui program PMT pada Balita, Ibu hamil dan menyusui serta anak sekolah
- Sosialisasi, advokasi dan edukasi penyakit menular (TBC, Malaria, HIV/AIDS -Sifilis dan Hepatitis)
- Sosialisasi, advokasi dan edukasi faktor risiko Penyakit Tidak Menular (Deteksi kanker payudara dan leher rahim Obesitas, Hipertensi dan Diabetes Mellitus, termasuk pengendalian gula garam lemak/GGL)
- Sosialisasi, advokasi dan edukasi dengan Pemberian Imunisasi Lengkap dan Tepat Usia untuk Anak Zero Dose
- Sosialisasi, advokasi dan edukasi Implementasi lima pilar Sanitasi Total Berbasis Masyarakat (STBM);
- Pembekalan Kader Kesehatan (PHBS, TBC, Gizi, KB, Obat, Makanan dan Kosmetik, dsb)
- Menggalakkan Bank Sampah, Sosialisasi, advokasi dan edukasi Pengolahan sampah plastik dan pelestarian lingkungan melalui penanaman pohon', 1
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Peduli Stunting Pemberian makan bergizi melalui program PMT pada Balita, Ibu hamil dan menyusui serta anak sekolah', '', 2
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pengendalian penyakit menular (TBC, Malaria, HIV/AIDS -Sifilis dan Hepatitis)', '', 3
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Mengendalikan faktor risiko PTM (Deteksi kanker payudara dan leher rahim Obesitas, Hipertensi dan Diabetes Mellitus, termasuk pengendalian gula garam lemak/GGL)', '', 4
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pemberian Imunisasi Lengkap dan Tepat Usia (Imunisasi Zero Dose )', '', 5
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Penggerakan keluarga dalam rangka mendorong perubahan perilaku Ibu Rumah Tangga dalam implementasi lima pilar Sanitasi Total Berbasis Masyarakat (STBM);', '', 6
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;
insert into program_prioritas (program_unggulan_id, name, contoh_kegiatan, urutan)
select pu.id, 'Pembekalan Kader Kesehatan', '', 7
from program_unggulan pu join program_pokok pp on pp.id = pu.program_pokok_id
where pp.pokja_id = 4 and pp.name = 'Perencanaan Sehat' and pu.name = 'Gerakan Keluarga Sehat Tanggap dan Tangguh Bencana'
on conflict (program_unggulan_id, name) do nothing;

commit;

-- Verifikasi: tidak boleh ada lagi Program Pokok tanpa Program Prioritas.
select pp.name as program_pokok_tanpa_prioritas
from program_pokok pp
where not exists (
  select 1 from program_unggulan pu
  join program_prioritas ppr on ppr.program_unggulan_id = pu.id
  where pu.program_pokok_id = pp.id
)
order by pp.urutan, pp.id;
