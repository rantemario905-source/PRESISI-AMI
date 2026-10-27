-- ==========================================================================
-- 19 - LAPORAN PRESENSI BULANAN PER PEGAWAI
-- Syarat: 01 s.d. 18 sudah dijalankan.
--
-- Kepala ruangan perlu membaca presensi seluruh pegawai unitnya agar dapat
-- mencetak laporan presensi bulanan per pegawai. Policy lama
-- "presensi_baca_sendiri" hanya mengizinkan baris milik sendiri atau Super
-- Admin, sehingga laporan kepala ruangan akan kosong tanpa policy tambahan.
--
-- Catatan kompatibilitas: sebagian instalasi lama kehilangan fungsi inti
-- public.is_superadmin() sehingga policy lain ikut gagal. Fungsi tersebut
-- dibuat ulang di sini dengan definisi yang sama seperti migrasi 02.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pegawai') is null
     or to_regclass('public.presensi') is null then
    raise exception 'Tabel public.pegawai/presensi tidak ditemukan. Jalankan migrasi 01-18 pada project Supabase yang benar.';
  end if;
end;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pegawai
    where id = auth.uid() and role = 'superadmin'
  );
$$;

create or replace function public.bisa_lihat_presensi(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.pegawai saya
     where saya.id = auth.uid()
       and (
         saya.role = 'superadmin'
         or saya.id = p_user_id
         or (
           saya.kepala_ruangan = true
           and exists (
             select 1
               from public.pegawai target
              where target.id = p_user_id
                and target.unit_kerja = saya.unit_kerja
           )
         )
       )
  );
$$;

revoke execute on function public.bisa_lihat_presensi(uuid) from public, anon;
grant execute on function public.bisa_lihat_presensi(uuid) to authenticated;

drop policy if exists "presensi_baca_kepala_unit" on public.presensi;
create policy "presensi_baca_kepala_unit" on public.presensi
  for select to authenticated
  using (public.bisa_lihat_presensi(user_id));

commit;
