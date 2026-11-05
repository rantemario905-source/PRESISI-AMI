-- ==========================================================================
-- VERIFIKASI MIGRASI 36 - KOREKSI JAM MASUK LEWAT PENGADUAN
-- Jalankan di Supabase SQL Editor SETELAH 36_koreksi_jam_masuk.sql.
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
  ) like '%60 minutes%' as ajukan_jendela_60_menit,

  pg_get_functiondef(
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure
  ) like '%harus lebih awal%' as ajukan_hanya_lebih_awal,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%60 minutes%' as putuskan_jendela_60_menit,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%harus lebih awal%' as putuskan_hanya_lebih_awal,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%Koreksi%' as putuskan_menandai_koreksi,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%hitung_menit_terlambat%' as putuskan_menghitung_terlambat,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%menit_terlambat%' as kandidat_memuat_terlambat,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%dikoreksi_oleh%' as kandidat_mengecualikan_terkoreksi,

  (select prosecdef from pg_proc
    where oid = 'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure)
    as ajukan_security_definer,

  (select prosecdef from pg_proc
    where oid = 'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure)
    as putuskan_security_definer,

  has_function_privilege(
    'authenticated',
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_tidak_untuk_anon;