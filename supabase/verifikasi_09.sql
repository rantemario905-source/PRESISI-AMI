  -- ==========================================================================
  -- VERIFIKASI MIGRASI 09 — DINAS & SAKIT / CUTI
  -- Jalankan di Supabase SQL Editor SETELAH 09_dinas_sakit_cuti.sql.
  -- Semua kolom hasil seharusnya bernilai true (kecuali yang diberi catatan).
  -- ==========================================================================

  with cek as (
    select
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'pegawai'
          and column_name = 'kepala_ruangan'
      ) as kolom_kepala_ruangan,

      exists (
        select 1 from pg_indexes
        where schemaname = 'public' and indexname = 'uq_kepala_ruangan_unit'
      ) as index_satu_kepala_per_unit,

      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'izin_cuti'
          and column_name = 'grup_id'
      ) as kolom_grup_id,

      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'izin_cuti'
          and column_name = 'dokumen_path'
      ) as kolom_dokumen,

      exists (
        select 1 from pg_constraint
        where conname = 'izin_cuti_jenis_check'
      ) as constraint_jenis,

      exists (
        select 1 from pg_constraint
        where conname = 'izin_cuti_dokumen_wajib_check'
      ) as constraint_dokumen_wajib,

      (select count(*) from pg_policies
        where schemaname = 'public' and tablename = 'izin_cuti' and cmd = 'SELECT') = 1
        as policy_baca_izin,

      (select count(*) from pg_policies
        where schemaname = 'public' and tablename = 'izin_cuti'
          and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')) = 0
        as tidak_ada_policy_tulis,

      not has_table_privilege('authenticated', 'public.izin_cuti', 'INSERT')
        as authenticated_tidak_bisa_insert,

      not has_table_privilege('authenticated', 'public.izin_cuti', 'UPDATE')
        as authenticated_tidak_bisa_update,

      not has_table_privilege('authenticated', 'public.izin_cuti', 'DELETE')
        as authenticated_tidak_bisa_delete,

      has_table_privilege('authenticated', 'public.izin_cuti', 'SELECT')
        as authenticated_bisa_select,

      (select count(*) from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in (
            'catat_izin_grup', 'ubah_izin_grup',
            'putuskan_izin_grup', 'batalkan_izin_grup'
          )) = 4 as empat_rpc_baru,

      (select count(*) from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in (
            'catat_izin_grup', 'ubah_izin_grup',
            'putuskan_izin_grup', 'batalkan_izin_grup'
          )
          and p.prosecdef) = 4 as rpc_security_definer,

      not has_function_privilege(
        'anon',
        'public.catat_izin_grup(uuid,text,uuid[],date,date,text,text,text,text,bigint)',
        'EXECUTE'
      ) as anon_tidak_bisa_catat,

      has_function_privilege(
        'authenticated',
        'public.catat_izin_grup(uuid,text,uuid[],date,date,text,text,text,text,bigint)',
        'EXECUTE'
      ) as authenticated_bisa_catat,

      exists (
        select 1 from storage.buckets
        where id = 'dokumen-izin'
          and public = false
          and file_size_limit = 1048576
          and allowed_mime_types @> array['image/jpeg', 'image/png']::text[]
          and allowed_mime_types <@ array['image/jpeg', 'image/png']::text[]
      ) as bucket_privat_benar,

      (select count(*) from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname in (
            'dokumen_izin_unggah', 'dokumen_izin_baca', 'dokumen_izin_hapus'
          )) = 3 as tiga_policy_storage
  )
  select * from cek;

  -- Cek tambahan: pastikan tidak ada lagi jenis "Izin" pada data.
  select count(*) as sisa_data_jenis_izin
    from public.izin_cuti
  where jenis = 'Izin';

  -- Cek tambahan: pastikan tidak ada lagi status presensi "Izin".
  select count(*) as sisa_presensi_status_izin
    from public.presensi
  where status_kehadiran = 'Izin';
