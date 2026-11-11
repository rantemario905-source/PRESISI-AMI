-- ==========================================================================
-- VERIFIKASI MIGRASI 38 - JENIS KETIDAKHADIRAN IZIN
-- Jalankan di Supabase SQL Editor SETELAH 38_jenis_izin.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.izin_cuti'::regclass
      and conname = 'izin_cuti_jenis_check') like '%Izin%'
    as izin_cuti_menerima_izin,

  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.presensi'::regclass
      and conname = 'presensi_status_kehadiran_check') like '%Izin%'
    as presensi_menerima_izin,

  pg_get_functiondef(
    'public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as catat_menerima_izin,

  pg_get_functiondef(
    'public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as ubah_menerima_izin,

  pg_get_functiondef(
    'public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as koreksi_menerima_izin,

  pg_get_functiondef(
    'public.submit_presensi(text, text, double precision, double precision, double precision, boolean)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as submit_menolak_izin,

  pg_get_functiondef(
    'public.proses_alfa_otomatis(date)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as alfa_melewati_izin,

  pg_get_functiondef(
    'public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as pengaduan_menolak_izin,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
  ) like '%Dinas Luar'', ''Izin%' as putuskan_pengaduan_menolak_izin,

  (select prosecdef from pg_proc
    where oid = 'public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)'::regprocedure)
    as catat_security_definer,

  (select prosecdef from pg_proc
    where oid = 'public.submit_presensi(text, text, double precision, double precision, double precision, boolean)'::regprocedure)
    as submit_security_definer,

  has_function_privilege(
    'authenticated',
    'public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)',
    'EXECUTE'
  ) as catat_dapat_dieksekusi,

  not has_function_privilege(
    'anon',
    'public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)',
    'EXECUTE'
  ) as catat_tidak_untuk_anon;
