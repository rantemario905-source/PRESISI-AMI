-- ==========================================================================
-- VERIFIKASI MIGRASI 32 - TUKAR SHIFT (AUDIT)
-- Jalankan di Supabase SQL Editor SETELAH 32_tukar_shift.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  (to_regclass('public.tukar_shift') is not null) as tabel_tukar_shift_ada,

  coalesce((
    select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'tukar_shift'
  ), false) as rls_tukar_shift_aktif,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'tukar_shift'
       and policyname = 'tukar_shift_baca'
       and cmd = 'SELECT'
  ) as policy_baca_ada,

  exists (
    select 1
      from pg_constraint
     where conname = 'tukar_shift_pegawai_beda'
  ) as constraint_pegawai_beda_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'tukar_shift'
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%for update%'
       and pg_get_functiondef(p.oid) like '%insert into public.tukar_shift%'
  ) as fungsi_tukar_shift_aman,

  has_function_privilege(
    'authenticated',
    'public.tukar_shift(uuid, uuid, date, text)',
    'EXECUTE'
  ) as tukar_shift_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.tukar_shift(uuid, uuid, date, text)',
    'EXECUTE'
  ) as tukar_shift_tidak_untuk_anon;
