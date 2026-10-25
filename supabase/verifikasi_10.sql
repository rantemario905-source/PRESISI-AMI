-- ==========================================================================
-- VERIFIKASI MIGRASI 10 — KELOLA ROLE DARI DATA PEGAWAI
-- Jalankan di Supabase SQL Editor SETELAH 10_kelola_role.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_lengkap'
       and pg_get_function_identity_arguments(p.oid)
           = 'p_id uuid, p_nama text, p_unit_kerja text, p_role text'
  ) as fungsi_perbarui_lengkap_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'perbarui_pegawai_lengkap'
       and p.prosecdef
  ) as fungsi_security_definer,

  has_function_privilege(
    'authenticated',
    'public.perbarui_pegawai_lengkap(uuid,text,text,text)',
    'EXECUTE'
  ) as authenticated_bisa_memanggil,

  not has_function_privilege(
    'anon',
    'public.perbarui_pegawai_lengkap(uuid,text,text,text)',
    'EXECUTE'
  ) as anon_tidak_bisa_memanggil;
