-- ==========================================================================
-- VERIFIKASI MIGRASI 41 - AUDIT JADWAL SHIFT MENGACU KE AKUN (auth.users)
-- Jalankan di Supabase SQL Editor SETELAH 41_audit_jadwal_shift_auth_users.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1 from pg_constraint c
     where c.conname = 'jadwal_shift_dibuat_oleh_fkey'
       and c.conrelid = 'public.jadwal_shift'::regclass
       and c.confrelid = 'auth.users'::regclass
       and c.convalidated
  ) as jadwal_shift_dibuat_oleh_ke_auth_users,

  exists (
    select 1 from pg_constraint c
     where c.conname = 'jadwal_shift_diperbarui_oleh_fkey'
       and c.conrelid = 'public.jadwal_shift'::regclass
       and c.confrelid = 'auth.users'::regclass
       and c.convalidated
  ) as jadwal_shift_diperbarui_oleh_ke_auth_users,

  exists (
    select 1 from pg_constraint c
     where c.conname = 'tukar_shift_dibuat_oleh_fkey'
       and c.conrelid = 'public.tukar_shift'::regclass
       and c.confrelid = 'auth.users'::regclass
       and c.convalidated
  ) as tukar_shift_dibuat_oleh_ke_auth_users,

  not exists (
    select 1 from pg_constraint c
     where c.conname in (
             'jadwal_shift_dibuat_oleh_fkey',
             'jadwal_shift_diperbarui_oleh_fkey',
             'tukar_shift_dibuat_oleh_fkey'
           )
       and c.confrelid = 'public.pegawai'::regclass
  ) as tidak_ada_fk_ke_pegawai,

  exists (
    select 1 from pg_trigger
     where tgrelid = 'public.jadwal_shift'::regclass
       and tgname = 'trg_audit_jadwal_shift'
       and not tgisinternal
  ) as trigger_audit_jadwal_shift_ada,

  exists (
    select 1 from pg_proc
     where oid = 'public.tukar_shift(uuid, uuid, date, text)'::regprocedure
       and prosecdef
  ) as tukar_shift_security_definer;

-- Uji manual cepat: login sebagai kepala unit (termasuk kepala ASN yang tidak
-- punya baris public.pegawai), lalu Tukar Shift dua pegawai pada satu tanggal.
-- Sebelum migrasi 41 muncul
--   "insert or update on table \"jadwal_shift\" violates foreign key constraint
--    \"jadwal_shift_diperbarui_oleh_fkey\"";
-- sesudah migrasi tukar shift harus tersimpan dan tercatat di public.tukar_shift.
