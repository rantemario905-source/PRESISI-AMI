-- ==========================================================================
-- VERIFIKASI MIGRASI 15 - FINALISASI JADWAL DIHAPUS
-- Jalankan di Supabase SQL Editor SETELAH 15_hapus_finalisasi_jadwal.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'jadwal_shift_final'
  ) as tabel_finalisasi_dihapus,

  not exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'finalisasi_jadwal_unit'
  ) as rpc_finalisasi_dihapus,

  not exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'jadwal_bulan_final'
  ) as fungsi_status_final_dihapus,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'jadwal_shift'
       and policyname = 'jadwal_kelola_kepala_unit'
  ) as policy_kepala_ada,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'jadwal_shift'
       and policyname = 'jadwal_kelola_kepala_unit'
       and (
         coalesce(qual, '') ilike '%tanggal >= %'
         or coalesce(with_check, '') ilike '%tanggal >= %'
       )
  ) as kepala_boleh_hari_ini,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'jadwal_shift'
       and policyname = 'jadwal_kelola_kepala_unit'
       and coalesce(qual, '') not ilike '%jadwal_bulan_final%'
       and coalesce(with_check, '') not ilike '%jadwal_bulan_final%'
  ) as policy_tanpa_finalisasi,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and p.pronargs = 3
       and p.prosecdef
       and pg_get_functiondef(p.oid) not ilike '%jadwal_shift_final%'
  ) as impor_tanpa_finalisasi,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and pg_get_functiondef(p.oid) ilike '%v_input.tanggal < v_hari_ini%'
  ) as impor_boleh_hari_ini,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and pg_get_functiondef(p.oid) ilike '%tanggal <= v_hari_ini%'
  ) as impor_tidak_menolak_hari_ini,

  has_function_privilege(
    'authenticated',
    'public.impor_jadwal_shift(text,date,jsonb)',
    'EXECUTE'
  ) as authenticated_bisa_impor,

  not has_function_privilege(
    'anon',
    'public.impor_jadwal_shift(text,date,jsonb)',
    'EXECUTE'
  ) as anon_tidak_bisa_impor;
