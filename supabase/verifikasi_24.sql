-- ==========================================================================
-- VERIFIKASI MIGRASI 24 - RADIUS ABSENSI 50 METER
-- Jalankan di Supabase SQL Editor SETELAH 24_radius_50_meter.sql.
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
       and pg_get_functiondef(p.oid) like '%v_jarak > 50 then%'
  ) as radius_50_dipakai,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%radius 50 meter%'
  ) as pesan_radius_50,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_jarak > 100 then%'
  ) as radius_100_hilang,

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
