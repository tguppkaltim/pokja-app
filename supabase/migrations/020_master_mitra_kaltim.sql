-- Master Mitra/OPD Kalimantan Timur: 102 lembaga.
--
-- Sumber: Rencana Program TP PKK Kaltim TA 2027, kolom MITRA KERJA/OPD/SWASTA.
-- Migrasi 013 sengaja meninggalkan tabel ini kosong karena nama OPD tidak
-- boleh dikarang. Sekarang daftarnya ada dan resmi, jadi diisikan.
--
-- Pemetaan namanya perlu dijelaskan supaya tidak terbalik saat disunting:
--   mitra.nama      nama resmi dan panjang, dipakai laporan dan cetakan
--                   ("Dinas Kesehatan Provinsi Kalimantan Timur")
--   mitra.singkatan label pendek untuk sel tabel yang sempit
--                   ("Dinas Kesehatan Kaltim")
--
-- Yang TIDAK diambil dari sumbernya: jumlah_kegiatan, sebagai_mitra_utama,
-- no_kegiatan, dan bidang_pokja. Keempatnya hitungan atas rencana 2027, bukan
-- sifat mitranya — nomor kegiatannya pun milik berkas Excel, bukan id kegiatan
-- di sistem ini. Menyimpannya berarti menaruh sumber kebenaran kedua yang
-- langsung basi begitu kegiatan nyata diisikan, padahal kaitan kegiatan-mitra
-- sudah tercatat di kegiatan_mitra dan bisa dihitung kapan saja.

begin;

-- ── 1. Kolom baru ───────────────────────────────────────────────────────────

-- Semuanya not null default '': '' berarti belum ditentukan, mengikuti kolom
-- teks lain di sistem ini. Kolom yang bisa null memaksa penjagaan tiga keadaan
-- untuk perbedaan yang tidak berarti.
alter table mitra
  add column if not exists kode     text not null default '',
  add column if not exists kategori text not null default '',
  add column if not exists tingkat  text not null default '';

comment on column mitra.kode is
  'Penanda tetap dari berkas sumber, dipakai mencocokkan saat master diperbarui. Kosong untuk mitra yang ditambahkan lewat aplikasi.';
comment on column mitra.kategori is
  'Golongan lembaga. Kosong berarti belum ditentukan.';
comment on column mitra.tingkat is
  'Cakupan wilayah kerja lembaga. Kosong berarti belum ditentukan.';

-- Unique parsial: banyak baris boleh berkode kosong, tapi kode yang terisi
-- harus menunjuk satu mitra saja.
create unique index if not exists mitra_kode_unik on mitra (kode) where kode <> '';

alter table mitra drop constraint if exists mitra_kategori_sah;
alter table mitra add constraint mitra_kategori_sah check (kategori in (
  '',
  'AKADEMISI',
  'BUMN_BUMD_PERBANKAN',
  'INSTANSI_VERTIKAL',
  'MITRA_KELEMBAGAAN_PKK',
  'OPD_KAB_KOTA',
  'OPD_PROVINSI',
  'ORG_MASYARAKAT',
  'ORG_PROFESI',
  'PEMERINTAH_DESA',
  'SWASTA_DUNIA_USAHA'
));

alter table mitra drop constraint if exists mitra_tingkat_sah;
alter table mitra add constraint mitra_tingkat_sah check (tingkat in (
  '',
  'Desa/Kelurahan',
  'Kab/Kota',
  'Kecamatan',
  'Nasional',
  'Provinsi',
  'Provinsi & Kab/Kota'
));

-- ── 2. Rapikan entri yang sudah terlanjur ada ───────────────────────────────
-- Dua mitra dimasukkan manual sebelum daftar resmi ini ada, dengan nama
-- pendek. Namanya diseragamkan ke nama resmi supaya tidak berdampingan dengan
-- kembarannya dari daftar di bawah. Diubah di tempat, bukan dihapus lalu
-- dibuat ulang: id-nya tetap, sehingga kaitan kegiatan yang sudah ada utuh.
update mitra m set nama = p.resmi
from (values
  ('Dinas Kesehatan', 'Dinas Kesehatan Provinsi Kalimantan Timur'),
  ('Dinas Sosial',    'Dinas Sosial Provinsi Kalimantan Timur')
) as p(lama, resmi)
where m.nama = p.lama
  and not exists (select 1 from mitra lain where lain.nama = p.resmi);

-- ── 3. Daftar mitra ─────────────────────────────────────────────────────────
insert into mitra (kode, nama, singkatan, kategori, tingkat) values
  ('UNIVERSITAS_MULAWARMAN_UNMUL'            , 'Universitas Mulawarman'                                                                    , 'Universitas Mulawarman (Unmul)'                          , 'AKADEMISI'            , 'Provinsi'),
  ('UNIVERSITAS_MUHAMMADIYAH_KALIMANTAN_TIMU', 'Universitas Muhammadiyah Kalimantan Timur'                                                 , 'Universitas Muhammadiyah Kalimantan Timur (UMKT)'        , 'AKADEMISI'            , 'Provinsi'),
  ('POLITEKNIK_NEGERI_BALIKPAPAN'            , 'Politeknik Negeri Balikpapan'                                                              , 'Politeknik Negeri Balikpapan'                            , 'AKADEMISI'            , 'Provinsi'),
  ('POLITEKNIK_NEGERI_SAMARINDA'             , 'Politeknik Negeri Samarinda'                                                               , 'Politeknik Negeri Samarinda'                             , 'AKADEMISI'            , 'Provinsi'),
  ('BANKALTIMTARA'                           , 'PT Bank Pembangunan Daerah Kalimantan Timur dan Kalimantan Utara'                          , 'Bankaltimtara'                                           , 'BUMN_BUMD_PERBANKAN'  , 'Provinsi'),
  ('BUMD_PERUSDA_KALTIM'                     , 'BUMD/Perusahaan Daerah Provinsi Kalimantan Timur'                                          , 'BUMD/Perusda Kaltim'                                     , 'BUMN_BUMD_PERBANKAN'  , 'Provinsi'),
  ('BUMDES_BUMDESA'                          , 'Badan Usaha Milik Desa'                                                                    , 'BUMDes/BUMDesa'                                          , 'BUMN_BUMD_PERBANKAN'  , 'Desa/Kelurahan'),
  ('KOPERASI_DESA_KELURAHAN'                 , 'Koperasi Desa/Kelurahan (Koperasi Desa Merah Putih)'                                       , 'Koperasi Desa/Kelurahan'                                 , 'BUMN_BUMD_PERBANKAN'  , 'Desa/Kelurahan'),
  ('PLN_UIW_KALTIMRA'                        , 'PT PLN (Persero) Unit Induk Wilayah Kalimantan Timur dan Kalimantan Utara'                 , 'PLN UIW Kaltimra'                                        , 'BUMN_BUMD_PERBANKAN'  , 'Provinsi'),
  ('PT_PEGADAIAN'                            , 'PT Pegadaian'                                                                              , 'PT Pegadaian'                                            , 'BUMN_BUMD_PERBANKAN'  , 'Nasional'),
  ('PT_PERMODALAN_NASIONAL_MADANI_PNM'       , 'PT Permodalan Nasional Madani (Persero)'                                                   , 'PT Permodalan Nasional Madani (PNM)'                     , 'BUMN_BUMD_PERBANKAN'  , 'Nasional'),
  ('PERTAMINA'                               , 'PT Pertamina (Persero)'                                                                    , 'Pertamina'                                               , 'BUMN_BUMD_PERBANKAN'  , 'Nasional'),
  ('PERUMDA_AIR_MINUM'                       , 'Perumda Air Minum'                                                                         , 'Perumda Air Minum'                                       , 'BUMN_BUMD_PERBANKAN'  , 'Kab/Kota'),
  ('BKKBN_KALTIM'                            , 'Perwakilan BKKBN Provinsi Kalimantan Timur'                                                , 'BKKBN Kaltim'                                            , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('KANWIL_KEMENAG_KALTIM'                   , 'Kantor Wilayah Kementerian Agama Provinsi Kalimantan Timur'                                , 'Kanwil Kemenag Kaltim'                                   , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('POLDA_KALTIM'                            , 'Kepolisian Daerah Kalimantan Timur'                                                        , 'Polda Kaltim'                                            , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('BPJS_KESEHATAN'                          , 'BPJS Kesehatan'                                                                            , 'BPJS Kesehatan'                                          , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('BPOM_SAMARINDA'                          , 'Balai Besar POM di Samarinda'                                                              , 'BPOM Samarinda'                                          , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('KANWIL_KEMENKUM_KALTIM'                  , 'Kantor Wilayah Kementerian Hukum Provinsi Kalimantan Timur'                                , 'Kanwil Kemenkum Kaltim'                                  , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('BADAN_GIZI_NASIONAL'                     , 'Badan Gizi Nasional'                                                                       , 'Badan Gizi Nasional'                                     , 'INSTANSI_VERTIKAL'    , 'Nasional'),
  ('BANK_INDONESIA_KPW_KALTIM'               , 'Bank Indonesia Kantor Perwakilan Kalimantan Timur'                                         , 'Bank Indonesia KPw Kaltim'                               , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('OJK_KALTIM'                              , 'Otoritas Jasa Keuangan Kalimantan Timur'                                                   , 'OJK Kaltim'                                              , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('PENGADILAN_AGAMA'                        , 'Pengadilan Agama'                                                                          , 'Pengadilan Agama'                                        , 'INSTANSI_VERTIKAL'    , 'Kab/Kota'),
  ('BMKG_STASIUN_KALTIM'                     , 'Stasiun BMKG Kalimantan Timur'                                                             , 'BMKG Stasiun Kaltim'                                     , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('BNN_PROVINSI_KALTIM'                     , 'Badan Narkotika Nasional Provinsi Kalimantan Timur'                                        , 'BNN Provinsi Kaltim'                                     , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('BAPANAS'                                 , 'Badan Pangan Nasional'                                                                     , 'Bapanas'                                                 , 'INSTANSI_VERTIKAL'    , 'Nasional'),
  ('KEJAKSAAN_TINGGI_KALTIM'                 , 'Kejaksaan Tinggi Kalimantan Timur'                                                         , 'Kejaksaan Tinggi Kaltim'                                 , 'INSTANSI_VERTIKAL'    , 'Provinsi'),
  ('LSP_BNSP'                                , 'Lembaga Sertifikasi Profesi / Badan Nasional Sertifikasi Profesi'                          , 'LSP/BNSP'                                                , 'INSTANSI_VERTIKAL'    , 'Nasional'),
  ('DEKRANASDA_KALTIM'                       , 'Dewan Kerajinan Nasional Daerah Provinsi Kalimantan Timur'                                 , 'Dekranasda Kaltim'                                       , 'MITRA_KELEMBAGAAN_PKK', 'Provinsi'),
  ('TP_PKK_KAB_KOTA'                         , 'Tim Penggerak PKK Kabupaten/Kota'                                                          , 'TP PKK Kab/Kota'                                         , 'MITRA_KELEMBAGAAN_PKK', 'Kab/Kota'),
  ('BUNDA_PAUD_KALTIM'                       , 'Bunda PAUD Provinsi Kalimantan Timur'                                                      , 'Bunda PAUD Kaltim'                                       , 'MITRA_KELEMBAGAAN_PKK', 'Provinsi'),
  ('TP_PKK_PUSAT'                            , 'Tim Penggerak PKK Pusat'                                                                   , 'TP PKK Pusat'                                            , 'MITRA_KELEMBAGAAN_PKK', 'Nasional'),
  ('BUNDA_LITERASI_KALTIM'                   , 'Bunda Literasi Provinsi Kalimantan Timur'                                                  , 'Bunda Literasi Kaltim'                                   , 'MITRA_KELEMBAGAAN_PKK', 'Provinsi'),
  ('PUSKESMAS_KAB_KOTA'                      , 'Pusat Kesehatan Masyarakat Kabupaten/Kota'                                                 , 'Puskesmas Kab/Kota'                                      , 'OPD_KAB_KOTA'         , 'Kab/Kota'),
  ('DISDUKCAPIL_KAB_KOTA'                    , 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten/Kota'                                    , 'Disdukcapil Kab/Kota'                                    , 'OPD_KAB_KOTA'         , 'Kab/Kota'),
  ('SKB_KAB_KOTA'                            , 'Sanggar Kegiatan Belajar Kabupaten/Kota'                                                   , 'SKB Kab/Kota'                                            , 'OPD_KAB_KOTA'         , 'Kab/Kota'),
  ('DLH_KAB_KOTA'                            , 'Dinas Lingkungan Hidup Kabupaten/Kota'                                                     , 'DLH Kab/Kota'                                            , 'OPD_KAB_KOTA'         , 'Kab/Kota'),
  ('DINAS_PEMADAM_KEBAKARAN_PENYELAMATAN_KAB', 'Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten/Kota'                                   , 'Dinas Pemadam Kebakaran & Penyelamatan Kab/Kota'         , 'OPD_KAB_KOTA'         , 'Kab/Kota'),
  ('PENYULUH_PERTANIAN_BPP_KECAMATAN'        , 'Penyuluh Pertanian pada Balai Penyuluhan Pertanian Kecamatan'                              , 'Penyuluh Pertanian (BPP Kecamatan)'                      , 'OPD_KAB_KOTA'         , 'Kecamatan'),
  ('DINAS_KESEHATAN_KAB_KOTA'                , 'Dinas Kesehatan Kabupaten/Kota'                                                            , 'Dinas Kesehatan Kab/Kota'                                , 'OPD_KAB_KOTA'         , 'Kab/Kota'),
  ('DINAS_KESEHATAN_KALTIM'                  , 'Dinas Kesehatan Provinsi Kalimantan Timur'                                                 , 'Dinas Kesehatan Kaltim'                                  , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DPMPD_KALTIM'                            , 'Dinas Pemberdayaan Masyarakat dan Pemerintahan Desa Provinsi Kalimantan Timur'             , 'DPMPD Kaltim'                                            , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISDIKBUD_KALTIM'                        , 'Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Timur'                                 , 'Disdikbud Kaltim'                                        , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISPERINDAGKOP_UKM_KALTIM'               , 'Dinas Perindustrian, Perdagangan, Koperasi dan UKM Provinsi Kalimantan Timur'              , 'Disperindagkop-UKM Kaltim'                               , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_PANGAN_TPH_KALTIM'                 , 'Dinas Pangan, Tanaman Pangan dan Hortikultura Provinsi Kalimantan Timur'                   , 'Dinas Pangan, TPH Kaltim'                                , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISKOMINFO_KALTIM'                       , 'Dinas Komunikasi dan Informatika Provinsi Kalimantan Timur'                                , 'Diskominfo Kaltim'                                       , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DLH_KALTIM'                              , 'Dinas Lingkungan Hidup Provinsi Kalimantan Timur'                                          , 'DLH Kaltim'                                              , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DKP3A_KALTIM'                            , 'Dinas Kependudukan, Pemberdayaan Perempuan dan Perlindungan Anak Provinsi Kalimantan Timur', 'DKP3A Kaltim'                                            , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_SOSIAL_KALTIM'                     , 'Dinas Sosial Provinsi Kalimantan Timur'                                                    , 'Dinas Sosial Kaltim'                                     , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BAPPEDA_KALTIM'                          , 'Badan Perencanaan Pembangunan Daerah Provinsi Kalimantan Timur'                            , 'Bappeda Kaltim'                                          , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_PARIWISATA_KALTIM'                 , 'Dinas Pariwisata Provinsi Kalimantan Timur'                                                , 'Dinas Pariwisata Kaltim'                                 , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISNAKERTRANS_KALTIM'                    , 'Dinas Tenaga Kerja dan Transmigrasi Provinsi Kalimantan Timur'                             , 'Disnakertrans Kaltim'                                    , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISPERKIM_KALTIM'                        , 'Dinas Perumahan dan Kawasan Permukiman Provinsi Kalimantan Timur'                          , 'Disperkim Kaltim'                                        , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISPUSIP_KALTIM'                         , 'Dinas Perpustakaan dan Kearsipan Provinsi Kalimantan Timur'                                , 'Dispusip Kaltim'                                         , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_PUPR_KALTIM'                       , 'Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Kalimantan Timur'                         , 'Dinas PUPR Kaltim'                                       , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BPBD_KALTIM'                             , 'Badan Penanggulangan Bencana Daerah Provinsi Kalimantan Timur'                             , 'BPBD Kaltim'                                             , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BIRO_ADPIM_SETDA_KALTIM'                 , 'Biro Administrasi Pimpinan Sekretariat Daerah Provinsi Kalimantan Timur'                   , 'Biro Adpim Setda Kaltim'                                 , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_PETERNAKAN_KESEHATAN_HEWAN_KALTIM' , 'Dinas Peternakan dan Kesehatan Hewan Provinsi Kalimantan Timur'                            , 'Dinas Peternakan & Kesehatan Hewan Kaltim'               , 'OPD_PROVINSI'         , 'Provinsi'),
  ('UPTD_BALAI_LATIHAN_KERJA_BLK'            , 'UPTD Balai Latihan Kerja Provinsi Kalimantan Timur'                                        , 'UPTD Balai Latihan Kerja (BLK)'                          , 'OPD_PROVINSI'         , 'Provinsi'),
  ('UPTD_PPA_KALTIM'                         , 'UPTD Perlindungan Perempuan dan Anak Provinsi Kalimantan Timur'                            , 'UPTD PPA Kaltim'                                         , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BIRO_HUKUM_SETDA_KALTIM'                 , 'Biro Hukum Sekretariat Daerah Provinsi Kalimantan Timur'                                   , 'Biro Hukum Setda Kaltim'                                 , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BIRO_PEREKONOMIAN_SETDA_KALTIM'          , 'Biro Perekonomian Sekretariat Daerah Provinsi Kalimantan Timur'                            , 'Biro Perekonomian Setda Kaltim'                          , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BIRO_UMUM_SETDA_KALTIM'                  , 'Biro Umum Sekretariat Daerah Provinsi Kalimantan Timur'                                    , 'Biro Umum Setda Kaltim'                                  , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_KELAUTAN_PERIKANAN_KALTIM'         , 'Dinas Kelautan dan Perikanan Provinsi Kalimantan Timur'                                    , 'Dinas Kelautan & Perikanan Kaltim'                       , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DISPORA_KALTIM'                          , 'Dinas Kepemudaan dan Olahraga Provinsi Kalimantan Timur'                                   , 'Dispora Kaltim'                                          , 'OPD_PROVINSI'         , 'Provinsi'),
  ('INSPEKTORAT_KALTIM'                      , 'Inspektorat Provinsi Kalimantan Timur'                                                     , 'Inspektorat Kaltim'                                      , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BADAN_KESBANGPOL_KALTIM'                 , 'Badan Kesatuan Bangsa dan Politik Provinsi Kalimantan Timur'                               , 'Badan Kesbangpol Kaltim'                                 , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BAPPERIDA_KALTIM'                        , 'Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah Provinsi Kalimantan Timur'         , 'Bapperida Kaltim'                                        , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BIRO_ORGANISASI_SETDA_KALTIM'            , 'Biro Organisasi Sekretariat Daerah Provinsi Kalimantan Timur'                              , 'Biro Organisasi Setda Kaltim'                            , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DPMPTSP_KALTIM'                          , 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Provinsi Kalimantan Timur'          , 'DPMPTSP Kaltim'                                          , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_ESDM_KALTIM'                       , 'Dinas Energi dan Sumber Daya Mineral Provinsi Kalimantan Timur'                            , 'Dinas ESDM Kaltim'                                       , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_KEHUTANAN_KALTIM'                  , 'Dinas Kehutanan Provinsi Kalimantan Timur'                                                 , 'Dinas Kehutanan Kaltim'                                  , 'OPD_PROVINSI'         , 'Provinsi'),
  ('DINAS_PERKEBUNAN_KALTIM'                 , 'Dinas Perkebunan Provinsi Kalimantan Timur'                                                , 'Dinas Perkebunan Kaltim'                                 , 'OPD_PROVINSI'         , 'Provinsi'),
  ('RSUD_PROVINSI_KAB_KOTA'                  , 'Rumah Sakit Umum Daerah Provinsi/Kabupaten/Kota'                                           , 'RSUD Provinsi/Kab/Kota'                                  , 'OPD_PROVINSI'         , 'Provinsi & Kab/Kota'),
  ('SATPOL_PP_KALTIM'                        , 'Satuan Polisi Pamong Praja Provinsi Kalimantan Timur'                                      , 'Satpol PP Kaltim'                                        , 'OPD_PROVINSI'         , 'Provinsi'),
  ('BAZNAS_KALTIM'                           , 'Badan Amil Zakat Nasional Provinsi Kalimantan Timur'                                       , 'Baznas Kaltim'                                           , 'ORG_MASYARAKAT'       , 'Provinsi'),
  ('BANK_SAMPAH_KAB_KOTA'                    , 'Bank Sampah Kabupaten/Kota'                                                                , 'Bank Sampah Kab/Kota'                                    , 'ORG_MASYARAKAT'       , 'Kab/Kota'),
  ('PKBM_KAB_KOTA'                           , 'Pusat Kegiatan Belajar Masyarakat'                                                         , 'PKBM Kab/Kota'                                           , 'ORG_MASYARAKAT'       , 'Kab/Kota'),
  ('KPA_KALTIM'                              , 'Komisi Penanggulangan AIDS Kalimantan Timur'                                               , 'KPA Kaltim'                                              , 'ORG_MASYARAKAT'       , 'Provinsi'),
  ('PPTI_KALTIM'                             , 'Perkumpulan Pemberantasan Tuberkulosis Indonesia Kalimantan Timur'                         , 'PPTI Kaltim'                                             , 'ORG_MASYARAKAT'       , 'Provinsi'),
  ('POKDARWIS_DESA'                          , 'Kelompok Sadar Wisata Desa'                                                                , 'Pokdarwis Desa'                                          , 'ORG_MASYARAKAT'       , 'Desa/Kelurahan'),
  ('YAYASAN_KANKER_INDONESIA_KALTIM'         , 'Yayasan Kanker Indonesia Cabang Kalimantan Timur'                                          , 'Yayasan Kanker Indonesia Kaltim'                         , 'ORG_MASYARAKAT'       , 'Provinsi'),
  ('PERSAGI_KALTIM'                          , 'Persatuan Ahli Gizi Indonesia DPD Kalimantan Timur'                                        , 'Persagi Kaltim'                                          , 'ORG_PROFESI'          , 'Provinsi'),
  ('HIMPAUDI_KALTIM'                         , 'Himpunan Pendidik dan Tenaga Kependidikan Anak Usia Dini Kalimantan Timur'                 , 'Himpaudi Kaltim'                                         , 'ORG_PROFESI'          , 'Provinsi'),
  ('DEKOPINWIL_KALTIM'                       , 'Dewan Koperasi Indonesia Wilayah Kalimantan Timur'                                         , 'Dekopinwil Kaltim'                                       , 'ORG_PROFESI'          , 'Provinsi'),
  ('APPMI_KALTIM'                            , 'Asosiasi Perancang Pengusaha Mode Indonesia Kalimantan Timur'                              , 'APPMI Kaltim'                                            , 'ORG_PROFESI'          , 'Provinsi'),
  ('HIMPSI_KALTIM'                           , 'Himpunan Psikologi Indonesia Wilayah Kalimantan Timur'                                     , 'HIMPSI Kaltim'                                           , 'ORG_PROFESI'          , 'Provinsi'),
  ('IAI_KALTIM'                              , 'Ikatan Arsitek Indonesia Kalimantan Timur'                                                 , 'IAI Kaltim'                                              , 'ORG_PROFESI'          , 'Provinsi'),
  ('IBI_KALTIM'                              , 'Ikatan Bidan Indonesia Pengda Kalimantan Timur'                                            , 'IBI Kaltim'                                              , 'ORG_PROFESI'          , 'Provinsi'),
  ('IDAI_KALTIM'                             , 'Ikatan Dokter Anak Indonesia Cabang Kalimantan Timur'                                      , 'IDAI Kaltim'                                             , 'ORG_PROFESI'          , 'Provinsi'),
  ('IDI_KALTIM'                              , 'Ikatan Dokter Indonesia Wilayah Kalimantan Timur'                                          , 'IDI Kaltim'                                              , 'ORG_PROFESI'          , 'Provinsi'),
  ('IGTKI_KALTIM'                            , 'Ikatan Guru Taman Kanak-Kanak Indonesia Kalimantan Timur'                                  , 'IGTKI Kaltim'                                            , 'ORG_PROFESI'          , 'Provinsi'),
  ('PEMERINTAH_DESA_KELURAHAN'               , 'Pemerintah Desa/Kelurahan'                                                                 , 'Pemerintah Desa/Kelurahan'                               , 'PEMERINTAH_DESA'      , 'Desa/Kelurahan'),
  ('PERUSAHAAN_TJSP_CSR'                     , 'Perusahaan pelaksana TJSP/CSR (tambang, migas, sawit)'                                     , 'Perusahaan TJSP/CSR'                                     , 'SWASTA_DUNIA_USAHA'   , 'Provinsi & Kab/Kota'),
  ('MEDIA_LOKAL'                             , 'Media massa lokal'                                                                         , 'Media lokal'                                             , 'SWASTA_DUNIA_USAHA'   , 'Provinsi'),
  ('NOTARIS'                                 , 'Notaris'                                                                                   , 'Notaris'                                                 , 'SWASTA_DUNIA_USAHA'   , 'Provinsi'),
  ('PLATFORM_E_COMMERCE'                     , 'Platform e-commerce nasional'                                                              , 'Platform e-commerce'                                     , 'SWASTA_DUNIA_USAHA'   , 'Nasional'),
  ('DESAINER_PELAKU_MODE_LOKAL'              , 'Desainer dan pelaku mode lokal'                                                            , 'Desainer/pelaku mode lokal'                              , 'SWASTA_DUNIA_USAHA'   , 'Provinsi'),
  ('KADIN_KALTIM'                            , 'Kamar Dagang dan Industri Kalimantan Timur'                                                , 'Kadin Kaltim'                                            , 'SWASTA_DUNIA_USAHA'   , 'Provinsi'),
  ('PENERBIT_TOKO_BUKU_LOKAL'                , 'Penerbit dan toko buku lokal'                                                              , 'Penerbit & toko buku lokal'                              , 'SWASTA_DUNIA_USAHA'   , 'Provinsi'),
  ('PENGELOLA_BANDARA_PELABUHAN_HOTEL_PUSAT_', 'Pengelola bandara, pelabuhan, hotel dan pusat perbelanjaan'                                , 'Pengelola bandara, pelabuhan, hotel & pusat perbelanjaan', 'SWASTA_DUNIA_USAHA'   , 'Provinsi'),
  ('PENYEDIA_JASA_TELEKOMUNIKASI'            , 'Penyedia jasa telekomunikasi'                                                              , 'Penyedia jasa telekomunikasi'                            , 'SWASTA_DUNIA_USAHA'   , 'Provinsi')
on conflict (nama) do update set
  kode     = excluded.kode,
  kategori = excluded.kategori,
  tingkat  = excluded.tingkat,
  -- Singkatan yang sudah diisi pengurus dipertahankan; yang masih kosong
  -- diisi dari daftar ini. Kolom aktif tidak disentuh sama sekali — mitra
  -- yang sengaja dinonaktifkan tidak boleh hidup lagi karena migrasi diulang.
  singkatan = coalesce(nullif(mitra.singkatan, ''), excluded.singkatan);

commit;

-- ── Verifikasi ──────────────────────────────────────────────────────────────
-- total minimal 102, berkode harus 102, tanpa_kategori harus 0.
select
  (select count(*) from mitra)                          as total,
  (select count(*) from mitra where kode <> '')         as berkode,
  (select count(*) from mitra where kategori = '')      as tanpa_kategori,
  (select count(distinct kategori) from mitra)          as jumlah_kategori,
  (select count(distinct tingkat)  from mitra)          as jumlah_tingkat;
