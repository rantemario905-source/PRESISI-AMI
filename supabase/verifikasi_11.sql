-- ==========================================================================
-- VERIFIKASI MIGRASI 11 — PENGATURAN KEPALA RUANGAN
-- Jalankan di Supabase SQL Editor SETELAH 11_kepala_ruangan.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_dan_kepala'
       and p.pronargs = 4
  ) as fungsi_perbarui_kepala_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_dan_kepala'
       and p.prosecdef
  ) as fungsi_security_definer,

  has_function_privilege(
    'authenticated',
    'public.perbarui_pegawai_dan_kepala(uuid,text,text,boolean)',
    'EXECUTE'
  ) as authenticated_bisa_memanggil,

  not has_function_privilege(
    'anon',
    'public.perbarui_pegawai_dan_kepala(uuid,text,text,boolean)',
    'EXECUTE'
  ) as anon_tidak_bisa_memanggil,

  exists (
    select 1
      from pg_indexes
     where schemaname = 'public'
       and tablename = 'pegawai'
       and indexname = 'uq_kepala_ruangan_unit'
  ) as index_satu_kepala_per_unit;
