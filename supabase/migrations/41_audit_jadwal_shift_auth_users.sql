-- ==========================================================================
-- 41 - AUDIT JADWAL SHIFT MENGACU KE AKUN (auth.users)
-- --------------------------------------------------------------------------
-- Masalah: trigger `set_audit_jadwal_shift()` mengisi `dibuat_oleh` /
-- `diperbarui_oleh` dengan `auth.uid()`, tetapi kolomnya ber-FK ke
-- `public.pegawai(id)`. Kepala unit ASN (metadata `jenis_akun = kepala_asn`)
-- tidak memiliki baris di `public.pegawai`, sehingga Tukar Shift / perubahan
-- jadwal gagal dengan:
--   "insert or update on table \"jadwal_shift\" violates foreign key
--    constraint \"jadwal_shift_diperbarui_oleh_fkey\""
-- Tabel `tukar_shift.dibuat_oleh` juga masih ber-FK ke `pegawai`, sehingga
-- riwayat tukar akan gagal walau jadwal lolos.
--
-- Perbaikan: ketiga FK diarahkan ke `auth.users(id)` seperti `izin_cuti`
-- (migrasi 23) dan `pengaduan_presensi`. Hanya definisi FK yang berubah.
-- ==========================================================================
begin;

do $$
begin
  if to_regclass('public.jadwal_shift') is null
     or to_regclass('public.tukar_shift') is null then
    raise exception 'Tabel jadwal_shift/tukar_shift tidak ditemukan. Jalankan migrasi 01-40 pada project Supabase yang benar.';
  end if;
  if to_regclass('auth.users') is null then
    raise exception 'Skema auth.users tidak ditemukan. Pastikan project Supabase benar.';
  end if;
end;
$$;

alter table public.jadwal_shift
  drop constraint if exists jadwal_shift_dibuat_oleh_fkey,
  drop constraint if exists jadwal_shift_diperbarui_oleh_fkey;

alter table public.jadwal_shift
  add constraint jadwal_shift_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references auth.users (id)
  on delete set null not valid;

alter table public.jadwal_shift
  add constraint jadwal_shift_diperbarui_oleh_fkey
  foreign key (diperbarui_oleh) references auth.users (id)
  on delete set null not valid;

alter table public.jadwal_shift validate constraint jadwal_shift_dibuat_oleh_fkey;
alter table public.jadwal_shift validate constraint jadwal_shift_diperbarui_oleh_fkey;

alter table public.tukar_shift
  drop constraint if exists tukar_shift_dibuat_oleh_fkey;

alter table public.tukar_shift
  add constraint tukar_shift_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references auth.users (id)
  on delete set null not valid;

alter table public.tukar_shift validate constraint tukar_shift_dibuat_oleh_fkey;

commit;
