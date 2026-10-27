-- ==========================================================================
-- VERIFIKASI MIGRASI 19 - LAPORAN PRESENSI BULANAN PER PEGAWAI
-- Jalankan di Supabase SQL Editor SETELAH 19_laporan_presensi_kepala.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'is_superadmin'
       and p.pronargs = 0
       and p.prosecdef
  ) as fungsi_is_superadmin_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_lihat_presensi'
       and p.pronargs = 1
       and p.prosecdef
  ) as fungsi_bisa_lihat_presensi_ada,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'presensi'
       and policyname = 'presensi_baca_kepala_unit'
       and cmd = 'SELECT'
       and qual ilike '%bisa_lihat_presensi%'
  ) as policy_kepala_memakai_fungsi,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'presensi'
       and policyname = 'presensi_baca_sendiri'
  ) as policy_pegawai_tetap_ada,

  has_function_privilege(
    'authenticated',
    'public.bisa_lihat_presensi(uuid)',
    'EXECUTE'
  ) as authenticated_bisa_lihat,

  not has_function_privilege(
    'anon',
    'public.bisa_lihat_presensi(uuid)',
    'EXECUTE'
  ) as anon_tidak_bisa_lihat,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_lihat_presensi'
       and pg_get_functiondef(p.oid) ilike '%kepala_ruangan = true%'
       and pg_get_functiondef(p.oid) ilike '%target.unit_kerja = saya.unit_kerja%'
  ) as kepala_dibatasi_unit_sendiri;
