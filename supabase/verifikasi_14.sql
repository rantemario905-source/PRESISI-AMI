-- ==========================================================================
-- VERIFIKASI MIGRASI 14 — IMPOR JADWAL SHIFT CSV/XLSX
-- Jalankan di Supabase SQL Editor SETELAH 14_impor_jadwal_shift.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and p.pronargs = 3
       and p.prosecdef
  ) as fungsi_impor_jadwal,

  has_function_privilege(
    'authenticated',
    'public.impor_jadwal_shift(text,date,jsonb)',
    'EXECUTE'
  ) as authenticated_bisa_impor,

  not has_function_privilege(
    'anon',
    'public.impor_jadwal_shift(text,date,jsonb)',
    'EXECUTE'
  ) as anon_tidak_bisa_impor,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and pg_get_functiondef(p.oid) ilike '%jadwal_shift_final%'
  ) as memeriksa_status_final,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and pg_get_functiondef(p.oid) ilike '%pola_kerja = ''shift''%'
  ) as memeriksa_pola_shift,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and pg_get_functiondef(p.oid) ilike '%tanggal <= v_hari_ini%'
  ) as membatasi_tanggal_kepala,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'impor_jadwal_shift'
       and pg_get_functiondef(p.oid) ilike '%jsonb_to_recordset%'
  ) as memakai_jsonb_recordset;
