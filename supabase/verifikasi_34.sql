-- ==========================================================================
-- VERIFIKASI MIGRASI 34 - SUPER ADMIN MEMUTUSKAN PENGADUAN
-- Jalankan di Supabase SQL Editor SETELAH 34_superadmin_putuskan_pengaduan.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  (to_regprocedure('public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)') is not null)
    as fungsi_putuskan_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'putuskan_pengaduan_presensi'
       and p.prosecdef
  ) as fungsi_security_definer,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)'::regprocedure
  ) like '%is_superadmin%' as mengizinkan_superadmin,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)'::regprocedure
  ) like '%bisa_kelola_unit%' as tetap_cek_unit_kepala,

  pg_get_functiondef(
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)'::regprocedure
  ) like '%tidak dapat menyetujui pengaduan sendiri%' as tetap_larang_acc_sendiri,

  has_function_privilege(
    'authenticated',
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)',
    'EXECUTE'
  ) as dapat_dieksekusi_authenticated,

  not has_function_privilege(
    'anon',
    'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)',
    'EXECUTE'
  ) as tidak_untuk_anon;
