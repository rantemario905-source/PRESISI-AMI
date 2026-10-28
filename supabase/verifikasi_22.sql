-- ==========================================================================
-- VERIFIKASI MIGRASI 22 - KEPALA UNIT MULTI-UNIT & KEPALA ASN
-- Jalankan di Supabase SQL Editor SETELAH 22_kepala_unit_multi_unit.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  to_regclass('public.kepala_unit') is not null as tabel_kepala_unit_ada,

  exists (
    select 1
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = 'kepala_unit'
       and c.column_name = 'nama_kepala'
  ) as kolom_nama_kepala_ada,

  exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'kepala_unit'
       and c.conname = 'kepala_unit_unit_kerja_unik'
       and c.contype = 'u'
  ) as satu_unit_satu_kepala,

  not exists (
    select 1
      from pg_indexes
     where schemaname = 'public'
       and indexname = 'uq_kepala_ruangan_unit'
  ) as index_kepala_lama_dihapus,

  (
    select relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'kepala_unit'
  ) as rls_kepala_unit_aktif,

  not has_table_privilege('authenticated', 'public.kepala_unit', 'SELECT')
    as authenticated_tidak_baca_langsung,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'handle_new_pegawai'
       and pg_get_functiondef(p.oid) like '%kepala_asn%'
  ) as trigger_lewati_pegawai_asn,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'is_kepala_ruangan'
       and pg_get_functiondef(p.oid) like '%kepala_unit%'
  ) as is_kepala_dari_kepala_unit,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'unit_dikelola'
       and p.proretset
  ) as fungsi_unit_dikelola_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_kelola_unit'
       and pg_get_functiondef(p.oid) like '%kepala_unit%'
  ) as fungsi_bisa_kelola_unit_ada,

  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'profil_saya'
  ) as rpc_profil_saya_ada,

  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'daftar_kepala_unit'
  ) as rpc_daftar_kepala_ada,

  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'daftar_akun_kepala_asn'
  ) as rpc_akun_asn_ada,

  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'simpan_kepala_unit'
  ) as rpc_simpan_kepala_ada,

  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'nama_kepala_unit'
  ) as rpc_nama_kepala_ada,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'pegawai'
       and policyname = 'pegawai_baca_profil_sendiri'
       and coalesce(qual, '') like '%kepala_unit%'
       and coalesce(qual, '') not like '%unit_saya%'
  ) as policy_profil_pegawai_multi_unit,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'jadwal_shift'
       and policyname = 'jadwal_baca_kepala_unit'
       and coalesce(qual, '') like '%unit_dikelola%'
       and coalesce(qual, '') not like '%unit_saya%'
  ) as policy_baca_jadwal_multi_unit,

  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'jadwal_shift'
       and policyname = 'jadwal_kelola_kepala_unit'
       and coalesce(qual, '') like '%bisa_kelola_jadwal%'
  ) as policy_kelola_jadwal_ada,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'bisa_lihat_presensi'
       and pg_get_functiondef(p.oid) like '%kepala_unit%'
  ) as presensi_cakupan_multi_unit,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'catat_izin_grup', 'ubah_izin_grup', 'batalkan_izin_grup',
         'impor_jadwal_shift', 'hapus_grup_shift'
       )
       and pg_get_functiondef(p.oid) like '%unit_saya%'
  ) = false as rpc_unit_tidak_pakai_unit_saya,

  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'hapus_grup_shift'
       and pg_get_functiondef(p.oid) like '%kepala_unit%'
  ) as hapus_grup_cek_kepala,

  has_function_privilege('authenticated', 'public.profil_saya()', 'EXECUTE')
    as authenticated_bisa_profil_saya,

  has_function_privilege('authenticated', 'public.simpan_kepala_unit(uuid, text[], text)', 'EXECUTE')
    as authenticated_bisa_simpan_kepala,

  not has_function_privilege('anon', 'public.simpan_kepala_unit(uuid, text[], text)', 'EXECUTE')
    as anon_tidak_bisa_simpan_kepala,

  (
    select count(*)::int
      from public.pegawai p
      join auth.users u on u.id = p.id
     where u.raw_user_meta_data ->> 'jenis_akun' = 'kepala_asn'
  ) = 0 as kepala_asn_tidak_tercatat_pegawai,

  (
    select count(*)::int
      from public.pegawai p
     where p.kepala_ruangan is distinct from exists (
       select 1 from public.kepala_unit k where k.user_id = p.id
     )
  ) = 0 as cache_kepala_ruangan_sinkron;

select count(*) as jumlah_pegawai_tetap
  from public.pegawai
 where role = 'pegawai';

select k.unit_kerja,
       coalesce(p.nama, k.nama_kepala) as nama_kepala,
       case when p.id is null then 'ASN' else 'Non-ASN' end as jenis
  from public.kepala_unit k
  left join public.pegawai p on p.id = k.user_id
 order by k.unit_kerja;
