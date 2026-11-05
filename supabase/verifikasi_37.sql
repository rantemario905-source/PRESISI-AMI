-- ==========================================================================
-- VERIFIKASI MIGRASI 37 - BATASI PENGADUAN SEBELUM GO-LIVE
-- Jalankan di Supabase SQL Editor SETELAH 37_batasi_pengaduan_sebelum_golive.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  to_regprocedure('public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)') is not null
    as fungsi_ajukan_ada,

  to_regprocedure('public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)') is not null
    as fungsi_putuskan_ada,

  to_regprocedure('public.kandidat_pengaduan_presensi()') is not null
    as fungsi_kandidat_ada,

  pg_get_functiondef(
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure
  ) like '%2026-11-01%' as ajukan_memakai_batas_golive,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%2026-11-01%' as putuskan_memakai_batas_golive,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%2026-11-01%' as kandidat_memakai_batas_golive,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%continue%' as kandidat_melewati_tanggal_lama,

  (select prosecdef from pg_proc
    where oid = 'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure)
    as ajukan_security_definer,

  (select prosecdef from pg_proc
    where oid = 'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure)
    as putuskan_security_definer,

  (select prosecdef from pg_proc
    where oid = 'public.kandidat_pengaduan_presensi()'::regprocedure)
    as kandidat_security_definer,

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