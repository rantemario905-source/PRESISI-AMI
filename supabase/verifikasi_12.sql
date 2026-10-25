-- ==========================================================================
-- VERIFIKASI MIGRASI 12 — POLA KERJA, GRUP SHIFT, HARI LIBUR & ALFA
-- Jalankan di Supabase SQL Editor SETELAH 12_pola_kerja_jadwal_alfa.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'pegawai' and column_name = 'pola_kerja'
  ) as kolom_pola_kerja,

  exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'presensi' and column_name = 'menit_terlambat'
  ) as kolom_menit_terlambat,

  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'grup_shift') as tabel_grup_shift,
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'jam_kerja_reguler') as tabel_jam_kerja_reguler,
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'hari_libur') as tabel_hari_libur,
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'pengaturan_presensi') as tabel_pengaturan_presensi,

  exists (
    select 1 from pg_constraint
     where conname = 'pegawai_unit_kerja_fkey'
       and conrelid = 'public.pegawai'::regclass
       and confrelid = 'public.grup_shift'::regclass
       and confupdtype = 'c'
       and confdeltype = 'r'
       and convalidated
  ) as fk_grup_shift_cascade,

  exists (
    select 1 from pg_constraint
     where conname = 'pegawai_pola_kerja_check'
       and conrelid = 'public.pegawai'::regclass
       and convalidated
  ) as check_pola_kerja,

  exists (
    select 1 from pg_constraint
     where conname = 'presensi_menit_terlambat_check'
       and conrelid = 'public.presensi'::regclass
       and convalidated
  ) as check_menit_terlambat,

  (select count(*) from public.jam_kerja_reguler) = 7 as tujuh_hari_kerja,
  (select count(*) from public.jam_kerja_reguler where hari between 1 and 4 and not libur and jam_mulai = time '08:00' and jam_selesai = time '16:30') = 4 as senin_kamis,
  (select count(*) from public.jam_kerja_reguler where hari = 5 and not libur and jam_mulai = time '08:00' and jam_selesai = time '16:00') = 1 as jumat,
  (select count(*) from public.jam_kerja_reguler where hari in (6, 7) and libur) = 2 as sabtu_minggu_libur,

  exists (select 1 from public.pengaturan_presensi where id = 1) as pengaturan_singleton,
  exists (select 1 from public.grup_shift where nama = 'Belum ditentukan') as grup_default,
  (select count(*) from public.presensi where menit_terlambat < 0) = 0 as tidak_ada_menit_negatif,

  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'jadwal_kerja' and p.prosecdef
  ) as fungsi_jadwal_kerja,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'proses_alfa_otomatis' and p.prosecdef
  ) as fungsi_alfa_otomatis,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'hitung_menit_terlambat' and p.prosecdef
  ) as fungsi_hitung_terlambat,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'perbarui_pegawai_dan_jadwal' and p.pronargs = 5 and p.prosecdef
  ) as fungsi_data_pegawai,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'ubah_grup_shift' and p.pronargs = 3 and p.prosecdef
  ) as fungsi_rename_grup,

  has_function_privilege(
    'authenticated', 'public.jadwal_kerja(uuid,date)', 'EXECUTE'
  ) as authenticated_bisa_jadwal,
  has_function_privilege(
    'authenticated', 'public.proses_alfa_otomatis(date)', 'EXECUTE'
  ) as authenticated_bisa_alfa,
  has_function_privilege(
    'authenticated', 'public.ubah_grup_shift(text,text,text)', 'EXECUTE'
  ) as authenticated_bisa_rename,
  not has_function_privilege(
    'anon', 'public.proses_alfa_otomatis(date)', 'EXECUTE'
  ) as anon_tidak_bisa_alfa,

  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'grup_shift' and policyname = 'grup_shift_baca'
  ) as policy_grup_shift,
  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'hari_libur' and policyname = 'hari_libur_baca'
  ) as policy_hari_libur,
  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'jam_kerja_reguler' and policyname = 'jam_kerja_reguler_baca'
  ) as policy_jam_kerja,
  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'pengaturan_presensi' and policyname = 'pengaturan_presensi_baca'
  ) as policy_pengaturan,

  has_table_privilege('authenticated', 'public.grup_shift', 'SELECT') as authenticated_baca_grup,
  has_table_privilege('authenticated', 'public.hari_libur', 'SELECT') as authenticated_baca_libur,
  not has_table_privilege('authenticated', 'public.hari_libur', 'INSERT') as authenticated_tidak_insert_libur,
  not has_table_privilege('anon', 'public.grup_shift', 'SELECT') as anon_tidak_baca_grup,

  exists (
    select 1 from pg_indexes
     where schemaname = 'public' and tablename = 'presensi' and indexname = 'idx_presensi_open'
  ) as index_presensi_terbuka;
