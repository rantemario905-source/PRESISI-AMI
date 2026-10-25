-- ==========================================================================
-- VERIFIKASI MIGRASI 13 — KEPALA RUANGAN, FINALISASI & TANPA MODE TRANSISI
-- Jalankan di Supabase SQL Editor SETELAH 13_kepala_jadwal_final.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pengaturan_presensi'
       and column_name = 'kunci_shift_tanpa_jadwal'
  ) as mode_transisi_dihapus,

  exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'simpan_pengaturan_presensi'
       and p.pronargs = 2
       and p.prosecdef
  ) as fungsi_pengaturan_dua_parameter,

  not exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'simpan_pengaturan_presensi'
       and p.pronargs = 3
  ) as fungsi_pengaturan_lama_dihapus,

  exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'jadwal_kerja'
       and p.prosecdef
  ) as fungsi_jadwal_kerja,

  exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'jadwal_shift'
       and column_name = 'dibuat_oleh'
  ) as kolom_dibuat_oleh,
  exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'jadwal_shift'
       and column_name = 'diperbarui_oleh'
  ) as kolom_diperbarui_oleh,
  exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'jadwal_shift'
       and column_name = 'dibuat_pada'
  ) as kolom_dibuat_pada,
  exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'jadwal_shift'
       and column_name = 'diperbarui_pada'
  ) as kolom_diperbarui_pada,

  exists (
    select 1 from pg_trigger
     where tgname = 'trg_audit_jadwal_shift'
       and tgrelid = 'public.jadwal_shift'::regclass
       and not tgisinternal
  ) as trigger_audit_jadwal,

  exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'jadwal_shift_final'
  ) as tabel_finalisasi,
  exists (
    select 1 from pg_indexes
     where schemaname = 'public' and tablename = 'jadwal_shift_final'
       and indexname = 'idx_jadwal_shift_final_periode'
  ) as index_finalisasi,
  (select relrowsecurity from pg_class where oid = 'public.jadwal_shift_final'::regclass) as rls_finalisasi,

  exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_kelola_jadwal'
       and p.prosecdef
  ) as fungsi_bisa_kelola_jadwal,
  exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'jadwal_bulan_final'
       and p.prosecdef
  ) as fungsi_bulan_final,
  exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'finalisasi_jadwal_unit'
       and p.pronargs = 3
       and p.prosecdef
  ) as fungsi_finalisasi,

  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'jadwal_shift'
       and policyname = 'jadwal_baca_kepala_unit'
  ) as policy_baca_kepala,
  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'jadwal_shift'
       and policyname = 'jadwal_kelola_kepala_unit'
  ) as policy_kelola_kepala,
  exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'jadwal_shift_final'
       and policyname = 'jadwal_final_baca'
  ) as policy_final_baca,

  has_table_privilege('authenticated', 'public.jadwal_shift', 'SELECT') as authenticated_baca_jadwal,
  has_table_privilege('authenticated', 'public.jadwal_shift', 'INSERT') as authenticated_insert_jadwal,
  has_table_privilege('authenticated', 'public.jadwal_shift', 'UPDATE') as authenticated_update_jadwal,
  has_table_privilege('authenticated', 'public.jadwal_shift', 'DELETE') as authenticated_hapus_jadwal,
  has_table_privilege('authenticated', 'public.jadwal_shift_final', 'SELECT') as authenticated_baca_final,
  not has_table_privilege('authenticated', 'public.jadwal_shift_final', 'INSERT') as authenticated_tidak_insert_final,
  has_function_privilege(
    'authenticated', 'public.finalisasi_jadwal_unit(text,date,boolean)', 'EXECUTE'
  ) as authenticated_bisa_finalisasi,
  not has_function_privilege(
    'anon', 'public.finalisasi_jadwal_unit(text,date,boolean)', 'EXECUTE'
  ) as anon_tidak_bisa_finalisasi,
  has_function_privilege(
    'authenticated', 'public.simpan_pengaturan_presensi(boolean,date)', 'EXECUTE'
  ) as authenticated_bisa_simpan_pengaturan;
