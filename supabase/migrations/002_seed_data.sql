-- Seed data: Pokja
insert into pokja (id, name, description) values
  (1, 'Pokja I', 'Penguatan Pembentukan Karakter Keluarga — Penghayatan Pancasila, Gotong Royong, Karakter Keluarga'),
  (2, 'Pokja II', 'Gelari Pelangi — Pendidikan, PAUD, Literasi, UP2K, Koperasi'),
  (3, 'Pokja III', 'Ketahanan Keluarga — Pangan, Sandang, Papan, Tata Laksana Rumah Tangga'),
  (4, 'Pokja IV', 'Kesehatan & Perencanaan Sehat — Kesehatan, Lingkungan Sehat, Perencanaan Keuangan');

-- Reset sequence after manual id insert
select setval('pokja_id_seq', 4);

-- Seed data: Program Pokok
insert into program_pokok (id, pokja_id, name) values
  (1,  1, 'Penghayatan & Pengamalan Pancasila'),
  (2,  1, 'Gotong Royong'),
  (3,  1, 'Karakter Keluarga'),
  (4,  2, 'Pendidikan & PAUD'),
  (5,  2, 'Literasi'),
  (6,  2, 'UP2K & Koperasi'),
  (7,  3, 'Ketahanan Pangan'),
  (8,  3, 'Sandang & Papan'),
  (9,  3, 'Tata Laksana Rumah Tangga'),
  (10, 4, 'Kesehatan Keluarga'),
  (11, 4, 'Lingkungan Sehat'),
  (12, 4, 'Perencanaan Keuangan Keluarga');

select setval('program_pokok_id_seq', 12);
