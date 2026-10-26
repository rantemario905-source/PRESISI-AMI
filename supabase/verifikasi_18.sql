-- ==========================================================================
-- VERIFIKASI MIGRASI 18 - HAPUS GRUP KOSONG
-- Jalankan di Supabase SQL Editor SETELAH 18_hapus_grup_kosong.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'hapus_grup_shift'
       and p.pronargs = 1
       and p.prosecdef
       and pg_get_functiondef(p.oid) not ilike '%Belum ditentukan%tidak dapat dihapus%'
  ) as grup_kosong_bisa_dihapus,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'hapus_grup_shift'
       and p.pronargs = 1
       and pg_get_functiondef(p.oid) ilike '%masih memiliki%pegawai%'
  ) as grup_berisi_pegawai_ditolak,

  has_function_privilege(
    'authenticated',
    'public.hapus_grup_shift(text)',
    'EXECUTE'
  ) as authenticated_bisa_hapus,

  not has_function_privilege(
    'anon',
    'public.hapus_grup_shift(text)',
    'EXECUTE'
  ) as anon_tidak_bisa_hapus;
