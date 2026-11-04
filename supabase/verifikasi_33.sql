-- ==========================================================================
-- VERIFIKASI MIGRASI 33 - PENGADUAN PRESENSI
-- Jalankan di Supabase SQL Editor SETELAH 33_pengaduan_presensi.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  (to_regclass('public.pengaduan_presensi') is not null) as tabel_pengaduan_ada,

  coalesce((
    select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'pengaduan_presensi'
  ), false) as rls_pengaduan_aktif,

  exists (
    select 1
      from pg_indexes
     where schemaname = 'public'
       and tablename = 'pengaduan_presensi'
       and indexname = 'pengaduan_satu_menunggu'
  ) as indeks_satu_menunggu_ada,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'pengaduan_presensi'
       and policyname = 'pengaduan_baca'
       and cmd = 'SELECT'
  ) as policy_baca_ada,

  exists (
    select 1
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'dokumen_pengaduan_unggah'
       and cmd = 'INSERT'
  ) as policy_unggah_foto_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'ajukan_pengaduan_presensi'
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%validasi_dokumen_pengaduan%'
  ) as fungsi_ajukan_aman,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'putuskan_pengaduan_presensi'
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%status_kehadiran = ''Koreksi''%'
  ) as fungsi_putuskan_aman,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'daftar_pengaduan_presensi'
       and p.prosecdef
  ) as fungsi_daftar_ada,

  has_function_privilege(
    'authenticated',
    'public.ajukan_pengaduan_presensi(uuid, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.ajukan_pengaduan_presensi(uuid, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_tidak_untuk_anon,

  has_function_privilege(
    'authenticated',
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)',
    'EXECUTE'
  ) as putuskan_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)',
    'EXECUTE'
  ) as putuskan_tidak_untuk_anon,

  pg_get_functiondef('public.bisa_baca_dokumen(text)'::regprocedure)
    like '%pengaduan_presensi%' as dokumen_pengaduan_terbaca;
