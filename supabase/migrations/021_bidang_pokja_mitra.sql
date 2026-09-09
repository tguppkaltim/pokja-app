-- Bidang pokja tiap mitra: pokja mana yang menggandeng lembaga itu.
--
-- Sumber: kolom bidang_pokja pada Rencana Program TP PKK Kaltim TA 2027,
-- pendamping daftar mitra yang diisikan migrasi 020.
--
-- KETERANGAN SAJA — tidak menyaring dan tidak membatasi apa pun.
--
-- Semula tabel ini dibuat untuk menyaring pilihan mitra menurut pokja yang
-- sedang menyusun kegiatan. Rencananya dibatalkan: satu mitra kerap masuk
-- bidang beberapa pokja sekaligus, dan menyembunyikan sisanya justru
-- mempersulit penyusun kegiatan menemukan mitra yang dia maksud. Seluruh
-- pokja melihat seluruh mitra.
--
-- Yang tersisa adalah gunanya sebagai catatan: Master Mitra menampilkan pokja
-- mana yang biasa menggandeng tiap lembaga, dan pengurus bisa menyuntingnya.
-- Tidak ada constraint yang menolak pasangan kegiatan-mitra di luar tabel ini.

begin;

create table if not exists mitra_pokja (
  mitra_id integer not null references mitra(id) on delete cascade,
  -- cascade di kedua sisi: baris ini hanya keterangan, bukan catatan kegiatan.
  -- Tidak ada riwayat yang hilang kalau ikut terhapus bersama induknya.
  pokja_id integer not null references pokja(id) on delete cascade,
  primary key (mitra_id, pokja_id)
);

create index if not exists mitra_pokja_pokja_idx on mitra_pokja (pokja_id);

comment on table mitra_pokja is
  'Pokja yang biasa menggandeng suatu mitra. Keterangan pada Master Mitra; tidak menyaring dan tidak membatasi pilihan di form kegiatan.';

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Sama seperti tabel mitra: dibaca semua yang login, dikelola super_admin.
alter table mitra_pokja enable row level security;

drop policy if exists "mitra_pokja_select" on mitra_pokja;
drop policy if exists "mitra_pokja_manage" on mitra_pokja;

create policy "mitra_pokja_select" on mitra_pokja
  for select to authenticated using (true);
create policy "mitra_pokja_manage" on mitra_pokja
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- ── Isi ─────────────────────────────────────────────────────────────────────
-- Dicocokkan lewat mitra.kode dan pokja.name, bukan id: id serial berbeda-beda
-- antar pemasangan basis data, sedangkan keduanya tetap.
--
-- on conflict do nothing, bukan hapus-lalu-isi-ulang: penyesuaian yang sudah
-- dilakukan pengurus lewat Master Mitra tidak boleh hilang karena migrasi
-- dijalankan ulang.
insert into mitra_pokja (mitra_id, pokja_id)
select m.id, p.id
from (values
  ('UNIVERSITAS_MULAWARMAN_UNMUL'            , 'Sekretariat'),
  ('UNIVERSITAS_MULAWARMAN_UNMUL'            , 'Pokja I'),
  ('UNIVERSITAS_MULAWARMAN_UNMUL'            , 'Pokja II'),
  ('UNIVERSITAS_MULAWARMAN_UNMUL'            , 'Pokja III'),
  ('UNIVERSITAS_MUHAMMADIYAH_KALIMANTAN_TIMU', 'Sekretariat'),
  ('UNIVERSITAS_MUHAMMADIYAH_KALIMANTAN_TIMU', 'Pokja III'),
  ('POLITEKNIK_NEGERI_BALIKPAPAN'            , 'Pokja III'),
  ('POLITEKNIK_NEGERI_SAMARINDA'             , 'Pokja III'),
  ('BANKALTIMTARA'                           , 'Pokja II'),
  ('BANKALTIMTARA'                           , 'Pokja IV'),
  ('BUMD_PERUSDA_KALTIM'                     , 'Pokja II'),
  ('BUMDES_BUMDESA'                          , 'Pokja II'),
  ('BUMDES_BUMDESA'                          , 'Pokja III'),
  ('KOPERASI_DESA_KELURAHAN'                 , 'Pokja II'),
  ('PLN_UIW_KALTIMRA'                        , 'Pokja III'),
  ('PT_PEGADAIAN'                            , 'Pokja II'),
  ('PT_PERMODALAN_NASIONAL_MADANI_PNM'       , 'Pokja II'),
  ('PERTAMINA'                               , 'Pokja III'),
  ('PERUMDA_AIR_MINUM'                       , 'Pokja III'),
  ('BKKBN_KALTIM'                            , 'Pokja I'),
  ('BKKBN_KALTIM'                            , 'Pokja II'),
  ('BKKBN_KALTIM'                            , 'Pokja III'),
  ('BKKBN_KALTIM'                            , 'Pokja IV'),
  ('KANWIL_KEMENAG_KALTIM'                   , 'Pokja I'),
  ('KANWIL_KEMENAG_KALTIM'                   , 'Pokja II'),
  ('KANWIL_KEMENAG_KALTIM'                   , 'Pokja IV'),
  ('POLDA_KALTIM'                            , 'Pokja I'),
  ('BPJS_KESEHATAN'                          , 'Pokja IV'),
  ('BPOM_SAMARINDA'                          , 'Pokja II'),
  ('BPOM_SAMARINDA'                          , 'Pokja III'),
  ('BPOM_SAMARINDA'                          , 'Pokja IV'),
  ('KANWIL_KEMENKUM_KALTIM'                  , 'Pokja I'),
  ('KANWIL_KEMENKUM_KALTIM'                  , 'Pokja II'),
  ('KANWIL_KEMENKUM_KALTIM'                  , 'Pokja III'),
  ('BADAN_GIZI_NASIONAL'                     , 'Pokja III'),
  ('BADAN_GIZI_NASIONAL'                     , 'Pokja IV'),
  ('BANK_INDONESIA_KPW_KALTIM'               , 'Pokja II'),
  ('BANK_INDONESIA_KPW_KALTIM'               , 'Pokja III'),
  ('OJK_KALTIM'                              , 'Pokja I'),
  ('OJK_KALTIM'                              , 'Pokja IV'),
  ('PENGADILAN_AGAMA'                        , 'Pokja I'),
  ('BMKG_STASIUN_KALTIM'                     , 'Pokja IV'),
  ('BNN_PROVINSI_KALTIM'                     , 'Pokja I'),
  ('BAPANAS'                                 , 'Pokja III'),
  ('KEJAKSAAN_TINGGI_KALTIM'                 , 'Pokja I'),
  ('LSP_BNSP'                                , 'Pokja II'),
  ('DEKRANASDA_KALTIM'                       , 'Pokja II'),
  ('DEKRANASDA_KALTIM'                       , 'Pokja III'),
  ('TP_PKK_KAB_KOTA'                         , 'Sekretariat'),
  ('TP_PKK_KAB_KOTA'                         , 'Pokja I'),
  ('TP_PKK_KAB_KOTA'                         , 'Pokja II'),
  ('BUNDA_PAUD_KALTIM'                       , 'Pokja I'),
  ('BUNDA_PAUD_KALTIM'                       , 'Pokja II'),
  ('TP_PKK_PUSAT'                            , 'Sekretariat'),
  ('TP_PKK_PUSAT'                            , 'Pokja II'),
  ('BUNDA_LITERASI_KALTIM'                   , 'Pokja II'),
  ('PUSKESMAS_KAB_KOTA'                      , 'Pokja I'),
  ('PUSKESMAS_KAB_KOTA'                      , 'Pokja IV'),
  ('DISDUKCAPIL_KAB_KOTA'                    , 'Pokja I'),
  ('SKB_KAB_KOTA'                            , 'Pokja II'),
  ('DLH_KAB_KOTA'                            , 'Pokja III'),
  ('DLH_KAB_KOTA'                            , 'Pokja IV'),
  ('DINAS_PEMADAM_KEBAKARAN_PENYELAMATAN_KAB', 'Pokja III'),
  ('DINAS_PEMADAM_KEBAKARAN_PENYELAMATAN_KAB', 'Pokja IV'),
  ('PENYULUH_PERTANIAN_BPP_KECAMATAN'        , 'Pokja III'),
  ('DINAS_KESEHATAN_KAB_KOTA'                , 'Pokja IV'),
  ('DINAS_KESEHATAN_KALTIM'                  , 'Pokja I'),
  ('DINAS_KESEHATAN_KALTIM'                  , 'Pokja II'),
  ('DINAS_KESEHATAN_KALTIM'                  , 'Pokja III'),
  ('DINAS_KESEHATAN_KALTIM'                  , 'Pokja IV'),
  ('DPMPD_KALTIM'                            , 'Sekretariat'),
  ('DPMPD_KALTIM'                            , 'Pokja I'),
  ('DPMPD_KALTIM'                            , 'Pokja II'),
  ('DPMPD_KALTIM'                            , 'Pokja III'),
  ('DPMPD_KALTIM'                            , 'Pokja IV'),
  ('DISDIKBUD_KALTIM'                        , 'Pokja I'),
  ('DISDIKBUD_KALTIM'                        , 'Pokja II'),
  ('DISDIKBUD_KALTIM'                        , 'Pokja III'),
  ('DISPERINDAGKOP_UKM_KALTIM'               , 'Pokja II'),
  ('DISPERINDAGKOP_UKM_KALTIM'               , 'Pokja III'),
  ('DINAS_PANGAN_TPH_KALTIM'                 , 'Pokja II'),
  ('DINAS_PANGAN_TPH_KALTIM'                 , 'Pokja III'),
  ('DINAS_PANGAN_TPH_KALTIM'                 , 'Pokja IV'),
  ('DISKOMINFO_KALTIM'                       , 'Sekretariat'),
  ('DISKOMINFO_KALTIM'                       , 'Pokja I'),
  ('DISKOMINFO_KALTIM'                       , 'Pokja II'),
  ('DISKOMINFO_KALTIM'                       , 'Pokja III'),
  ('DLH_KALTIM'                              , 'Pokja III'),
  ('DLH_KALTIM'                              , 'Pokja IV'),
  ('DKP3A_KALTIM'                            , 'Pokja I'),
  ('DKP3A_KALTIM'                            , 'Pokja II'),
  ('DKP3A_KALTIM'                            , 'Pokja IV'),
  ('DINAS_SOSIAL_KALTIM'                     , 'Sekretariat'),
  ('DINAS_SOSIAL_KALTIM'                     , 'Pokja I'),
  ('DINAS_SOSIAL_KALTIM'                     , 'Pokja II'),
  ('DINAS_SOSIAL_KALTIM'                     , 'Pokja III'),
  ('DINAS_SOSIAL_KALTIM'                     , 'Pokja IV'),
  ('BAPPEDA_KALTIM'                          , 'Sekretariat'),
  ('BAPPEDA_KALTIM'                          , 'Pokja I'),
  ('BAPPEDA_KALTIM'                          , 'Pokja II'),
  ('DINAS_PARIWISATA_KALTIM'                 , 'Sekretariat'),
  ('DINAS_PARIWISATA_KALTIM'                 , 'Pokja I'),
  ('DINAS_PARIWISATA_KALTIM'                 , 'Pokja II'),
  ('DINAS_PARIWISATA_KALTIM'                 , 'Pokja III'),
  ('DISNAKERTRANS_KALTIM'                    , 'Pokja I'),
  ('DISNAKERTRANS_KALTIM'                    , 'Pokja II'),
  ('DISNAKERTRANS_KALTIM'                    , 'Pokja III'),
  ('DISPERKIM_KALTIM'                        , 'Pokja III'),
  ('DISPUSIP_KALTIM'                         , 'Pokja I'),
  ('DISPUSIP_KALTIM'                         , 'Pokja II'),
  ('DINAS_PUPR_KALTIM'                       , 'Pokja III'),
  ('DINAS_PUPR_KALTIM'                       , 'Pokja IV'),
  ('BPBD_KALTIM'                             , 'Pokja III'),
  ('BPBD_KALTIM'                             , 'Pokja IV'),
  ('BIRO_ADPIM_SETDA_KALTIM'                 , 'Sekretariat'),
  ('BIRO_ADPIM_SETDA_KALTIM'                 , 'Pokja I'),
  ('BIRO_ADPIM_SETDA_KALTIM'                 , 'Pokja III'),
  ('DINAS_PETERNAKAN_KESEHATAN_HEWAN_KALTIM' , 'Pokja III'),
  ('UPTD_BALAI_LATIHAN_KERJA_BLK'            , 'Pokja II'),
  ('UPTD_BALAI_LATIHAN_KERJA_BLK'            , 'Pokja III'),
  ('UPTD_PPA_KALTIM'                         , 'Pokja I'),
  ('BIRO_HUKUM_SETDA_KALTIM'                 , 'Sekretariat'),
  ('BIRO_HUKUM_SETDA_KALTIM'                 , 'Pokja I'),
  ('BIRO_PEREKONOMIAN_SETDA_KALTIM'          , 'Pokja II'),
  ('BIRO_PEREKONOMIAN_SETDA_KALTIM'          , 'Pokja III'),
  ('BIRO_UMUM_SETDA_KALTIM'                  , 'Sekretariat'),
  ('DINAS_KELAUTAN_PERIKANAN_KALTIM'         , 'Pokja III'),
  ('DISPORA_KALTIM'                          , 'Pokja I'),
  ('DISPORA_KALTIM'                          , 'Pokja II'),
  ('INSPEKTORAT_KALTIM'                      , 'Sekretariat'),
  ('INSPEKTORAT_KALTIM'                      , 'Pokja I'),
  ('BADAN_KESBANGPOL_KALTIM'                 , 'Pokja I'),
  ('BAPPERIDA_KALTIM'                        , 'Pokja III'),
  ('BIRO_ORGANISASI_SETDA_KALTIM'            , 'Pokja III'),
  ('DPMPTSP_KALTIM'                          , 'Pokja II'),
  ('DINAS_ESDM_KALTIM'                       , 'Pokja III'),
  ('DINAS_KEHUTANAN_KALTIM'                  , 'Pokja IV'),
  ('DINAS_PERKEBUNAN_KALTIM'                 , 'Pokja III'),
  ('RSUD_PROVINSI_KAB_KOTA'                  , 'Pokja IV'),
  ('SATPOL_PP_KALTIM'                        , 'Pokja IV'),
  ('BAZNAS_KALTIM'                           , 'Sekretariat'),
  ('BAZNAS_KALTIM'                           , 'Pokja III'),
  ('BAZNAS_KALTIM'                           , 'Pokja IV'),
  ('BANK_SAMPAH_KAB_KOTA'                    , 'Pokja III'),
  ('PKBM_KAB_KOTA'                           , 'Pokja II'),
  ('KPA_KALTIM'                              , 'Pokja IV'),
  ('PPTI_KALTIM'                             , 'Pokja IV'),
  ('POKDARWIS_DESA'                          , 'Pokja I'),
  ('YAYASAN_KANKER_INDONESIA_KALTIM'         , 'Pokja IV'),
  ('PERSAGI_KALTIM'                          , 'Pokja I'),
  ('PERSAGI_KALTIM'                          , 'Pokja III'),
  ('PERSAGI_KALTIM'                          , 'Pokja IV'),
  ('HIMPAUDI_KALTIM'                         , 'Pokja I'),
  ('HIMPAUDI_KALTIM'                         , 'Pokja II'),
  ('DEKOPINWIL_KALTIM'                       , 'Pokja II'),
  ('APPMI_KALTIM'                            , 'Pokja III'),
  ('HIMPSI_KALTIM'                           , 'Pokja II'),
  ('IAI_KALTIM'                              , 'Pokja III'),
  ('IBI_KALTIM'                              , 'Pokja IV'),
  ('IDAI_KALTIM'                             , 'Pokja IV'),
  ('IDI_KALTIM'                              , 'Pokja IV'),
  ('IGTKI_KALTIM'                            , 'Pokja I'),
  ('PEMERINTAH_DESA_KELURAHAN'               , 'Sekretariat'),
  ('PEMERINTAH_DESA_KELURAHAN'               , 'Pokja I'),
  ('PEMERINTAH_DESA_KELURAHAN'               , 'Pokja II'),
  ('PEMERINTAH_DESA_KELURAHAN'               , 'Pokja III'),
  ('PERUSAHAAN_TJSP_CSR'                     , 'Sekretariat'),
  ('PERUSAHAAN_TJSP_CSR'                     , 'Pokja II'),
  ('PERUSAHAAN_TJSP_CSR'                     , 'Pokja III'),
  ('PERUSAHAAN_TJSP_CSR'                     , 'Pokja IV'),
  ('MEDIA_LOKAL'                             , 'Sekretariat'),
  ('MEDIA_LOKAL'                             , 'Pokja III'),
  ('NOTARIS'                                 , 'Pokja II'),
  ('PLATFORM_E_COMMERCE'                     , 'Pokja II'),
  ('DESAINER_PELAKU_MODE_LOKAL'              , 'Pokja III'),
  ('KADIN_KALTIM'                            , 'Pokja II'),
  ('PENERBIT_TOKO_BUKU_LOKAL'                , 'Pokja II'),
  ('PENGELOLA_BANDARA_PELABUHAN_HOTEL_PUSAT_', 'Pokja II'),
  ('PENYEDIA_JASA_TELEKOMUNIKASI'            , 'Pokja II')
) as s(kode, pokja)
join mitra m on m.kode = s.kode
join pokja p on p.name = s.pokja
on conflict do nothing;

commit;

-- ── Verifikasi ──────────────────────────────────────────────────────────────
-- kaitan harus 179, mitra_tanpa_bidang harus 0.
select
  (select count(*) from mitra_pokja)                                   as kaitan,
  (select count(*) from mitra m
     where m.kode <> ''
       and not exists (select 1 from mitra_pokja mp where mp.mitra_id = m.id)) as mitra_tanpa_bidang,
  (select count(*) from mitra_pokja mp join pokja p on p.id = mp.pokja_id
     where p.name = 'Sekretariat')                                     as bidang_sekretariat;
