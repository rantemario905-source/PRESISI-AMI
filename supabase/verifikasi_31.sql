-- ==========================================================================
-- VERIFIKASI MIGRASI 31 - PERSETUJUAN OTOMATIS OLEH SUPER ADMIN
-- Jalankan di Supabase SQL Editor SETELAH 31_auto_setujui_superadmin.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'catat_izin_grup'
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%otomatis_disetujui%'
       and pg_get_functiondef(p.oid) like '%putuskan_izin_grup%'
  ) as catat_izin_otomatis_disetujui,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'ubah_izin_grup'
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%otomatis_disetujui%'
       and pg_get_functiondef(p.oid) like '%putuskan_izin_grup%'
  ) as ubah_izin_otomatis_disetujui,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'catat_izin_grup'
       and pg_get_functiondef(p.oid) like '%status_pengajuan%'
  ) as catat_izin_mengirim_status_pengajuan,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'ubah_izin_grup'
       and pg_get_functiondef(p.oid) like '%status_pengajuan%'
  ) as ubah_izin_mengirim_status_pengajuan,

  has_function_privilege(
    'authenticated',
    'public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)',
    'EXECUTE'
  ) as catat_izin_dapat_dieksekusi,

  has_function_privilege(
    'authenticated',
    'public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)',
    'EXECUTE'
  ) as ubah_izin_dapat_dieksekusi;
