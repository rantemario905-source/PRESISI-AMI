-- ==========================================================================
-- VERIFIKASI MIGRASI 20 - TITIK KOORDINAT RSUD AMI
-- Jalankan di Supabase SQL Editor SETELAH 20_koordinat_rsud.sql.
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
       and pg_get_functiondef(p.oid) like '%-0.23781156083888882%'
       and pg_get_functiondef(p.oid) like '%117.41437950820705%'
  ) as koordinat_baru_dipakai,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%-0.23795851007230442%'
  ) as koordinat_lama_hilang,

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
