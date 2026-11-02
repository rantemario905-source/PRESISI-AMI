-- ==========================================================================
-- VERIFIKASI MIGRASI 28 - PENGECUALIAN RADIUS TERTENTU
-- Jalankan di Supabase SQL Editor SETELAH 28_bebas_radius.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = 'pegawai'
       and c.column_name = 'bebas_radius'
       and c.data_type = 'boolean'
       and c.is_nullable = 'NO'
       and c.column_default like '%false%'
  ) as kolom_bebas_radius_ada,

  exists (
    select 1
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = 'pegawai'
       and c.column_name = 'bebas_radius_diubah_pada'
  ) as kolom_audit_waktu_ada,

  exists (
    select 1
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = 'pegawai'
       and c.column_name = 'bebas_radius_diubah_oleh'
  ) as kolom_audit_oleh_ada,

  (select count(*) from public.pegawai where bebas_radius is null) = 0 as tidak_ada_nilai_null,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and pg_get_function_identity_arguments(p.oid) =
           'text, text, double precision, double precision, double precision, boolean'
  ) as fungsi_submit_presensi_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and pg_get_functiondef(p.oid) like '%bebas_radius%'
       and pg_get_functiondef(p.oid) like '%v_jarak > 50 and not coalesce(v_bebas_radius, false)%'
  ) as submit_presensi_memakai_pengecualian,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'submit_presensi'
       and pg_get_functiondef(p.oid) like '%Terdeteksi menggunakan Fake GPS%'
       and pg_get_functiondef(p.oid) like '%Akurasi GPS tidak wajar%'
  ) as validasi_keamanan_tetap_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'profil_saya'
       and pg_get_functiondef(p.oid) like '%bebas_radius%'
  ) as profil_saya_memuat_bebas_radius,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_dan_jadwal'
       and pg_get_function_identity_arguments(p.oid) =
           'uuid, text, text, boolean, text, boolean'
  ) as fungsi_perbarui_6_argumen_ada,

  not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_dan_jadwal'
       and pg_get_function_identity_arguments(p.oid) =
           'uuid, text, text, boolean, text'
  ) as fungsi_lama_5_argumen_sudah_dihapus,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_dan_jadwal'
       and pg_get_functiondef(p.oid) like '%is_superadmin()%'
  ) as hanya_superadmin,

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
