-- ==========================================================================
-- VERIFIKASI MIGRASI 27 - JAM KERJA REGULER PER UNIT
-- Jalankan di Supabase SQL Editor SETELAH 27_jam_kerja_unit.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  to_regclass('public.jam_kerja_unit') is not null as tabel_jam_kerja_unit_ada,

  exists (
    select 1
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = 'jam_kerja_unit'
       and c.column_name in ('unit_kerja', 'hari', 'jam_mulai', 'jam_selesai', 'libur')
     group by c.table_name
    having count(*) = 5
  ) as kolom_lengkap,

  exists (
    select 1
      from pg_constraint k
     where k.conrelid = 'public.jam_kerja_unit'::regclass
       and k.contype = 'p'
       and pg_get_constraintdef(k.oid) like '%(unit_kerja, hari)%'
  ) as primary_key_unit_hari,

  exists (
    select 1
      from pg_constraint k
     where k.conrelid = 'public.jam_kerja_unit'::regclass
       and k.contype = 'f'
       and k.confrelid = 'public.grup_shift'::regclass
       and k.confupdtype = 'c'
       and k.confdeltype = 'c'
  ) as foreign_key_grup_cascade,

  exists (
    select 1
      from pg_constraint k
     where k.conrelid = 'public.jam_kerja_unit'::regclass
       and k.contype = 'c'
       and pg_get_constraintdef(k.oid) like '%jam_mulai < jam_selesai%'
  ) as constraint_jam_valid,

  (select relrowsecurity from pg_class where oid = 'public.jam_kerja_unit'::regclass) as rls_aktif,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'jam_kerja_unit'
       and policyname = 'jam_kerja_unit_baca'
  ) as policy_baca_ada,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'jam_kerja_unit'
       and policyname = 'jam_kerja_unit_kelola_admin'
  ) as policy_admin_ada,

  exists (
    select 1 from public.grup_shift where nama = 'ADMISI RAWAT JALAN'
  ) as unit_admisi_ada,

  (
    select count(*) = 7
      from public.jam_kerja_unit
     where unit_kerja = 'ADMISI RAWAT JALAN'
  ) as override_admisi_7_hari,

  (
    select count(*) = 5
      from public.jam_kerja_unit
     where unit_kerja = 'ADMISI RAWAT JALAN'
       and hari between 1 and 5
       and not libur
       and jam_mulai = time '07:00'
       and jam_selesai = time '15:00'
  ) as admisi_senin_jumat_0700_1500,

  (
    select count(*) = 2
      from public.jam_kerja_unit
     where unit_kerja = 'ADMISI RAWAT JALAN'
       and hari in (6, 7)
       and libur
  ) as admisi_sabtu_minggu_libur,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'jadwal_kerja'
       and pg_get_functiondef(p.oid) like '%jam_kerja_unit%'
       and pg_get_functiondef(p.oid) like '%v_pakai_override%'
       and pg_get_functiondef(p.oid) like '%libur_jadwal%'
  ) as jadwal_kerja_memakai_override,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'proses_alfa_otomatis'
       and pg_get_functiondef(p.oid) like '%jam_kerja_unit%'
       and pg_get_functiondef(p.oid) like '%coalesce(u.libur, j.libur)%'
  ) as alfa_memakai_override,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'jadwal_kerja'
       and pg_get_functiondef(p.oid) like '%jam_kerja_reguler%'
  ) as fallback_global_tetap,

  not exists (
    select 1
      from public.pegawai
     where unit_kerja = 'ADMISI RAWAT JALAN'
       and role = 'pegawai'
       and pola_kerja is distinct from 'reguler'
  ) as pegawai_admisi_reguler;
