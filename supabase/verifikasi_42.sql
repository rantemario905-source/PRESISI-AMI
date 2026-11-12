-- ==========================================================================
-- VERIFIKASI MIGRASI 42 - PENGADUAN ABSEN PULANG SETELAH JENDELA TUTUP
-- Jalankan di Supabase SQL Editor SETELAH 42_pengaduan_pulang_setelah_jendela.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  to_regprocedure('public.hitung_batas_absen_pulang(date, time, time)') is not null
    as helper_ada,

  (select provolatile = 'i' from pg_proc
    where oid = 'public.hitung_batas_absen_pulang(date, time, time)'::regprocedure)
    as helper_immutable,

  pg_get_functiondef(
    'public.hitung_batas_absen_pulang(date, time, time)'::regprocedure
  ) like '%2 hours%' as helper_memakai_dua_jam,

  pg_get_functiondef(
    'public.hitung_batas_absen_pulang(date, time, time)'::regprocedure
  ) like '%1 day%' as helper_mendukung_shift_malam,

  public.hitung_batas_absen_pulang(date '2026-11-12', time '08:00', time '16:30')
    = timestamptz '2026-11-12 18:30:00+08' as batas_reguler_benar,

  public.hitung_batas_absen_pulang(date '2026-11-11', time '20:00', time '08:00')
    = timestamptz '2026-11-12 10:00:00+08' as batas_shift_malam_benar,

  public.hitung_batas_absen_pulang(date '2026-11-12', null, time '16:30') is null
    as batas_kosong_tanpa_jadwal,

  to_regprocedure('public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)') is not null
    as fungsi_ajukan_ada,

  to_regprocedure('public.kandidat_pengaduan_presensi()') is not null
    as fungsi_kandidat_ada,

  pg_get_functiondef(
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure
  ) like '%hitung_batas_absen_pulang%' as ajukan_memakai_batas_pulang,

  pg_get_functiondef(
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure
  ) like '%baru dapat diajukan setelah pukul%' as ajukan_menolak_terlalu_awal,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%hitung_batas_absen_pulang%' as kandidat_memakai_batas_pulang,

  pg_get_functiondef('public.kandidat_pengaduan_presensi()'::regprocedure)
    like '%v_tutup%' as kandidat_memeriksa_batas,

  (select prosecdef from pg_proc
    where oid = 'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure)
    as ajukan_security_definer,

  (select prosecdef from pg_proc
    where oid = 'public.kandidat_pengaduan_presensi()'::regprocedure)
    as kandidat_security_definer,

  has_function_privilege(
    'authenticated',
    'public.kandidat_pengaduan_presensi()',
    'EXECUTE'
  ) as kandidat_dapat_dieksekusi,

  has_function_privilege(
    'authenticated',
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.kandidat_pengaduan_presensi()',
    'EXECUTE'
  ) as kandidat_tidak_untuk_anon,

  not has_function_privilege(
    'anon',
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)',
    'EXECUTE'
  ) as ajukan_tidak_untuk_anon;
