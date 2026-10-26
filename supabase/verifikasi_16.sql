-- ==========================================================================
-- VERIFIKASI MIGRASI 16 - SATU PERANGKAT AKTIF PER PEGAWAI
-- Jalankan di Supabase SQL Editor SETELAH 16_satu_perangkat.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and tablename = 'perangkat'
       and indexname = 'uq_perangkat_aktif'
       and indexdef ilike '%unique%'
       and indexdef ilike '%where%'
       and indexdef ilike '%pending%'
       and indexdef ilike '%approved%'
  ) as index_perangkat_aktif,

  not exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and tablename = 'perangkat'
       and indexname = 'uq_perangkat_disetujui'
  ) as index_lama_dihapus,

  exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'punya_perangkat_aktif'
       and p.prosecdef
  ) as helper_perangkat_aktif,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'perangkat'
       and policyname = 'perangkat_ajukan_pending'
       and coalesce(with_check, '') ilike '%punya_perangkat_aktif%'
  ) as policy_ajukan_dibatasi,

  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'perangkat'
       and policyname = 'perangkat_ajukan_ulang'
       and coalesce(qual, '') ilike '%punya_perangkat_aktif%'
  ) as policy_ulang_dibatasi,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'setujui_perangkat'
       and pg_get_functiondef(p.oid) ilike '%Reset perangkat lama terlebih dahulu%'
  ) as rpc_setujui_ketat,

  not exists (
    select 1
      from public.perangkat
     where status in ('pending', 'approved')
     group by user_id
    having count(*) > 1
  ) as tidak_ada_perangkat_ganda,

  has_function_privilege(
    'authenticated',
    'public.punya_perangkat_aktif(uuid)',
    'EXECUTE'
  ) as authenticated_bisa_helper,

  not has_function_privilege(
    'anon',
    'public.punya_perangkat_aktif(uuid)',
    'EXECUTE'
  ) as anon_tidak_bisa_helper,

  has_function_privilege(
    'authenticated',
    'public.setujui_perangkat(uuid)',
    'EXECUTE'
  ) as authenticated_bisa_setujui,

  not has_function_privilege(
    'anon',
    'public.setujui_perangkat(uuid)',
    'EXECUTE'
  ) as anon_tidak_bisa_setujui;
