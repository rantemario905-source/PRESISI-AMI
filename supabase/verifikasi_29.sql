-- ==========================================================================
-- VERIFIKASI MIGRASI 29 - TOLERANSI TERLAMBAT & JAM PULANG TEPAT WAKTU
-- Jalankan di Supabase SQL Editor SETELAH 29_toleransi_terlambat_dan_jam_pulang.sql.
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
  ) as fungsi_submit_presensi_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%floor(extract(epoch from (v_waktu - v_mulai)) / 60.0)%'
  ) as terlambat_dihitung_per_menit_penuh,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%ceil(extract(epoch from (v_waktu - v_mulai)) / 60.0)%'
  ) as pembulatan_ke_atas_hilang,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%if v_waktu < v_selesai then%'
       and pg_get_functiondef(p.oid) like '%(jam pulang)%'
  ) as pulang_dibuka_tepat_jam_pulang,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%interval ''1 minute''%'
  ) as jeda_satu_menit_hilang,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_selesai + interval ''2 hours''%'
  ) as pulang_tetap_ditutup_2_jam,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%interval ''1 hour''%'
  ) as masuk_tetap_dibuka_1_jam_sebelum,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%v_jarak > 50 and not coalesce(v_bebas_radius, false)%'
  ) as pengecualian_radius_tetap_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and p.pronargs = 6
       and pg_get_functiondef(p.oid) like '%-0.23805651650343132%'
       and pg_get_functiondef(p.oid) like '%117.41442516465149%'
  ) as koordinat_tetap,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'hitung_menit_terlambat'
       and pg_get_functiondef(p.oid) like '%floor(extract(epoch from (p_waktu - v_mulai)) / 60.0)%'
  ) as koreksi_pakai_menit_penuh,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'hitung_menit_terlambat'
       and pg_get_functiondef(p.oid) like '%ceil(extract(epoch from (p_waktu - v_mulai)) / 60.0)%'
  ) as koreksi_tanpa_pembulatan_ke_atas,

  coalesce(
    has_function_privilege(
      'authenticated',
      'public.submit_presensi(text, text, double precision, double precision, double precision, boolean)',
      'EXECUTE'
    ),
    false
  ) as authenticated_boleh_absen,

  coalesce(
    has_function_privilege(
      'anon',
      'public.submit_presensi(text, text, double precision, double precision, double precision, boolean)',
      'EXECUTE'
    ),
    false
  ) = false as anon_tidak_boleh_absen;
