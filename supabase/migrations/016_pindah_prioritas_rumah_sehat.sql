-- Pindahkan "Penguatan Rumah Sehat dan Tatalaksana Rumah Tangga" ke unggulan
-- yang benar.
--
-- Baris 25 file master memberi Program Pokok "Perumahan dan Tata Laksana Rumah
-- Tangga" sebuah Program Unggulan milik Sandang: "Gerakan Memasyarakatkan
-- Sandang Lokal Beretika (GEMAS SANLOKA)". Tiga baris berikutnya untuk Program
-- Pokok yang sama memakai REHARTA BERSERI, dan prioritas baris 25 sendiri
-- berbunyi soal rumah, bukan sandang.
--
-- Migrasi 012 setia pada file, jadi kekeliruan itu ikut terbawa. Ini SENGAJA
-- MENYIMPANG dari file master, atas persetujuan pengurus.
--
-- Barisnya DIPINDAH, bukan dihapus lalu dibuat ulang: id program_prioritas
-- dipertahankan supaya kegiatan yang sudah menunjuk ke sana tidak terputus.

begin;

do $$
declare
  id_pokok    integer;
  id_sanloka  integer;
  id_reharta  integer;
  id_prio     integer;
  sisa        integer;
begin
  select id into id_pokok from program_pokok
  where pokja_id = 3 and name = 'Perumahan dan Tata Laksana Rumah Tangga';

  if id_pokok is null then
    raise exception 'Program Pokok "Perumahan dan Tata Laksana Rumah Tangga" tidak ditemukan.';
  end if;

  select id into id_sanloka from program_unggulan
  where program_pokok_id = id_pokok
    and name = 'Gerakan Memasyarakatkan Sandang Lokal Beretika (GEMAS SANLOKA)';

  select id into id_reharta from program_unggulan
  where program_pokok_id = id_pokok
    and name = 'Revitalisasi Rumah dan Tata Laksana Rumah Tangga Bersih, Sehat, Rapi, dan Inovatif (REHARTA BERSERI)';

  if id_sanloka is null then
    raise notice 'GEMAS SANLOKA tidak ada di bawah Perumahan — kemungkinan sudah diperbaiki. Tidak ada yang diubah.';
    return;
  end if;

  if id_reharta is null then
    raise exception 'REHARTA BERSERI tidak ditemukan di bawah Perumahan; pemindahan dibatalkan.';
  end if;

  select id into id_prio from program_prioritas
  where program_unggulan_id = id_sanloka
    and name = 'Penguatan Rumah Sehat dan Tatalaksana Rumah Tangga';

  if id_prio is null then
    raise exception 'Prioritas "Penguatan Rumah Sehat..." tidak ada di bawah GEMAS SANLOKA; pemindahan dibatalkan.';
  end if;

  -- Baris 25 mendahului 26-28 di file, jadi prioritas ini urutan pertama.
  -- Yang sudah ada digeser turun lebih dulu agar tidak ada urutan kembar.
  update program_prioritas
  set urutan = urutan + 1
  where program_unggulan_id = id_reharta;

  update program_prioritas
  set program_unggulan_id = id_reharta, urutan = 1
  where id = id_prio;

  -- Unggulan Sandang di bawah Perumahan kini kosong dan memang tidak
  -- semestinya ada. Dihapus hanya kalau benar-benar tidak menaungi apa pun.
  select count(*) into sisa from program_prioritas where program_unggulan_id = id_sanloka;
  if sisa = 0 then
    delete from program_unggulan where id = id_sanloka;
    raise notice 'Prioritas dipindah ke REHARTA BERSERI; GEMAS SANLOKA yang kosong dihapus dari Perumahan.';
  else
    raise notice 'Prioritas dipindah, tapi GEMAS SANLOKA di bawah Perumahan masih menaungi % prioritas lain — dibiarkan.', sisa;
  end if;
end $$;

commit;

-- Verifikasi: Perumahan harus punya SATU unggulan (REHARTA BERSERI) dengan
-- 4 prioritas berurutan 1-4. Sandang tetap punya 3 prioritasnya sendiri.
select pp.name as program_pokok, pu.name as program_unggulan,
       count(ppr.id) as jumlah_prioritas
from program_pokok pp
join program_unggulan pu on pu.program_pokok_id = pp.id
left join program_prioritas ppr on ppr.program_unggulan_id = pu.id
where pp.pokja_id = 3
group by pp.name, pu.name, pp.urutan
order by pp.urutan, pu.name;
