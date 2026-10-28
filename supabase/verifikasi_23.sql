-- ==========================================================================
-- VERIFIKASI MIGRASI 23 - DINAS LUAR LINTAS UNIT
-- Jalankan di Supabase SQL Editor SETELAH 23_dinas_luar_lintas_unit.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  to_regclass('public.izin_cuti') is not null as tabel_izin_cuti_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'daftar_pegawai_izin'
       and p.proretset
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%p.role = ''pegawai''%'
  ) as fungsi_daftar_pegawai_izin_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_akses_grup'
       and p.prosecdef
  ) as fungsi_bisa_akses_grup_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_akses_grup'
       and pg_get_functiondef(p.oid) like '%is_kepala_ruangan%'
       and pg_get_functiondef(p.oid) like '%dibuat_oleh = auth.uid()%'
  ) as akses_grup_butuh_jabatan_dan_pembuat,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_kelola_izin_grup'
       and p.proretset
       and p.prosecdef
       and pg_get_functiondef(p.oid) like '%semua_unit_dikelola%'
  ) as fungsi_bisa_kelola_grup_ada,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'izin_cuti'
       and policyname = 'izin_baca_terkait'
       and qual like '%bisa_akses_grup%'
  ) as policy_izin_baca_lintas_grup,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'pegawai'
       and policyname = 'pegawai_baca_profil_sendiri'
       and qual like '%dibuat_oleh%'
  ) as policy_pegawai_anggota_grup,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_baca_dokumen'
       and pg_get_functiondef(p.oid) like '%bisa_akses_grup%'
  ) as dokumen_mengikuti_akses_grup,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_baca_dokumen'
       and pg_get_functiondef(p.oid) like '%not exists%'
  ) as dokumen_pemilik_dibatasi_file_tertaut,

  exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'izin_cuti'
       and c.conname = 'izin_cuti_dibuat_oleh_fkey'
       and c.confrelid = 'auth.users'::regclass
  ) as fk_dibuat_oleh_auth_users,

  exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'izin_cuti'
       and c.conname = 'izin_cuti_dibatalkan_oleh_fkey'
       and c.confrelid = 'auth.users'::regclass
  ) as fk_dibatalkan_oleh_auth_users,

  exists (
    select 1
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = 'izin_cuti'
       and c.column_name = 'dibuat_oleh'
       and c.is_nullable = 'YES'
  ) as dibuat_oleh_boleh_null,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'catat_izin_grup'
       and pg_get_functiondef(p.oid) like '%p_jenis in (''Sakit'', ''Cuti'')%'
  ) as catat_dinas_luar_lintas_unit,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'catat_izin_grup'
       and pg_get_functiondef(p.oid) like '%p.role <> ''pegawai''%'
  ) as catat_hanya_pegawai_non_asn,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'ubah_izin_grup'
       and pg_get_functiondef(p.oid) like '%v_lama.jenis = ''Dinas Luar''%'
  ) as ubah_pembuat_dinas_luar,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'ubah_izin_grup'
       and pg_get_functiondef(p.oid) like '%p.role <> ''pegawai''%'
  ) as ubah_hanya_pegawai_non_asn,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'batalkan_izin_grup'
       and pg_get_functiondef(p.oid) like '%v_lama.jenis = ''Dinas Luar''%'
  ) as batal_pembuat_dinas_luar,

  has_function_privilege('authenticated', 'public.daftar_pegawai_izin()', 'EXECUTE')
    as authenticated_boleh_daftar_pegawai,

  has_function_privilege('authenticated', 'public.bisa_akses_grup(uuid)', 'EXECUTE')
    as authenticated_boleh_akses_grup,

  has_function_privilege('authenticated', 'public.bisa_kelola_izin_grup(uuid[])', 'EXECUTE')
    as authenticated_boleh_kelola_grup,

  not has_function_privilege('anon', 'public.daftar_pegawai_izin()', 'EXECUTE')
    as anon_tidak_boleh_daftar_pegawai,

  not has_function_privilege('anon', 'public.bisa_akses_grup(uuid)', 'EXECUTE')
    as anon_tidak_boleh_akses_grup;
