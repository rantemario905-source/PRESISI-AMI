-- ==========================================================================
-- VERIFIKASI MIGRASI 17 - BATAS WAKTU ABSEN
-- Jalankan di Supabase SQL Editor SETELAH 17_batas_waktu_absen.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and p.prosecdef
       and pg_get_functiondef(p.oid) ilike '%interval ''20 minutes''%'
       and pg_get_functiondef(p.oid) ilike '%Absen masuk baru dapat dilakukan mulai pukul%'
  ) as batas_absen_masuk,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and p.prosecdef
       and pg_get_functiondef(p.oid) ilike '%interval ''1 minute''%'
       and pg_get_functiondef(p.oid) ilike '%Absen pulang baru dapat dilakukan mulai pukul%'
  ) as batas_absen_pulang,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and pg_get_functiondef(p.oid) ilike '%jadwal_kerja(v_user, v_row.tanggal)%'
  ) as pulang_mengikuti_jadwal,

  has_function_privilege(
    'authenticated',
    'public.submit_presensi(text,text,double precision,double precision,double precision,boolean)',
    'EXECUTE'
  ) as authenticated_bisa_absen,

  not has_function_privilege(
    'anon',
    'public.submit_presensi(text,text,double precision,double precision,double precision,boolean)',
    'EXECUTE'
  ) as anon_tidak_bisa_absen;
