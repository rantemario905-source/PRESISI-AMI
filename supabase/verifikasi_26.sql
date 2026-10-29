-- ==========================================================================
-- VERIFIKASI MIGRASI 26 - JENDELA ABSEN BARU (SOSIALISASI)
-- Jalankan di Supabase SQL Editor SETELAH 26_batas_absen_baru.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and p.prosecdef
  ) as fungsi_submit_presensi_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%interval ''1 hour''%'
       and pg_get_functiondef(p.oid) like '%1 jam sebelum jam masuk%'
  ) as masuk_dibuka_1_jam_sebelum,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_batas_pulang%'
       and pg_get_functiondef(p.oid) like '%v_selesai + interval ''2 hours''%'
  ) as pulang_ditutup_2_jam_setelah,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_waktu >= v_batas_pulang then%'
       and pg_get_functiondef(p.oid) like '%2 jam setelah jam pulang%'
  ) as batas_pulang_ditegakkan,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%time ''12:00''%'
  ) as aturan_1200_hilang,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%interval ''20 minutes''%'
  ) as aturan_20_menit_hilang,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_jarak > 50 then%'
  ) as radius_50_tetap,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%-0.23805651650343132%'
       and pg_get_functiondef(p.oid) like '%117.41442516465149%'
  ) as koordinat_tetap,

  has_function_privilege(
    'authenticated',
    'public.submit_presensi(text, text, double precision, double precision, double precision, boolean)',
    'EXECUTE'
  ) as authenticated_bisa_absen,

  not has_function_privilege(
    'anon',
    'public.submit_presensi(text, text, double precision, double precision, double precision, boolean)',
    'EXECUTE'
  ) as anon_tidak_bisa_absen;
