-- ==========================================================================
-- VERIFIKASI MIGRASI 25 - BATAS AKHIR ABSEN PULANG
-- Jalankan di Supabase SQL Editor SETELAH 25_batas_absen_pulang.sql.
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
       and pg_get_functiondef(p.oid) like '%v_batas_pulang%'
  ) as batas_pulang_didefinisikan,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_waktu >= v_batas_pulang then%'
  ) as batas_pulang_ditegakkan,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%time ''12:00''%'
  ) as batas_shift_malam_1200,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%waktu_wita(v_row.tanggal + 1, time ''00:00'')%'
  ) as batas_akhir_hari_kerja,

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
