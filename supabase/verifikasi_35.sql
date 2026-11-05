-- ==========================================================================
-- VERIFIKASI MIGRASI 35 - PENGADUAN PRESENSI MULTI-JENIS
-- Jalankan di Supabase SQL Editor SETELAH 35_pengaduan_masuk.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pengaduan_presensi'
       and column_name = 'jenis'
  ) as kolom_jenis_ada,

  exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pengaduan_presensi'
       and column_name = 'jam_masuk_diajukan'
  ) as kolom_jam_masuk_diajukan_ada,

  exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pengaduan_presensi'
       and column_name = 'jam_masuk_disetujui'
  ) as kolom_jam_masuk_disetujui_ada,

  exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pengaduan_presensi'
       and column_name = 'presensi_id'
       and is_nullable = 'YES'
  ) as presensi_id_boleh_kosong,

  exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pengaduan_presensi'
       and column_name = 'jam_pulang_diajukan'
       and is_nullable = 'YES'
  ) as jam_pulang_diajukan_boleh_kosong,

  exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and indexname = 'pengaduan_satu_menunggu'
       and indexdef like '%jenis%'
  ) as index_pending_per_jenis,

  to_regprocedure('public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)') is not null
    as fungsi_ajukan_ada,

  to_regprocedure('public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)') is not null
    as fungsi_putuskan_ada,

  to_regprocedure('public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)') is null
    as signature_lama_hilang,

  to_regprocedure('public.kandidat_pengaduan_presensi()') is not null
    as fungsi_kandidat_ada,

  (select prosecdef from pg_proc where oid = 'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure)
    as ajukan_security_definer,

  (select prosecdef from pg_proc where oid = 'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure)
    as putuskan_security_definer,

  (select prosecdef from pg_proc where oid = 'public.kandidat_pengaduan_presensi()'::regprocedure)
    as kandidat_security_definer,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%is_superadmin%' as putuskan_mengizinkan_superadmin,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%hitung_menit_terlambat%' as putuskan_menghitung_terlambat,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%tidak dapat menyetujui pengaduan sendiri%' as tetap_larang_acc_sendiri,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%jadwal_kerja%' as kandidat_memakai_jadwal,

  has_function_privilege(
    'authenticated',
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_tidak_untuk_anon,

  has_function_privilege(
    'authenticated',
    'public.kandidat_pengaduan_presensi()',
    'EXECUTE'
  ) as kandidat_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.kandidat_pengaduan_presensi()',
    'EXECUTE'
  ) as kandidat_tidak_untuk_anon;