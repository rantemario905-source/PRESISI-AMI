-- ==========================================================================
-- 16 - SATU PERANGKAT AKTIF PER PEGAWAI
-- Syarat: 01 s.d. 15 sudah dijalankan.
--
-- Ringkasan:
--   1. Seluruh data perangkat lama dikosongkan karena masih data uji.
--   2. Database menjamin maksimal satu perangkat aktif (pending/approved)
--      untuk setiap pegawai.
--   3. Pegawai tidak dapat mengajukan perangkat kedua bila sudah punya
--      perangkat aktif; Admin IT harus mereset perangkat lama.
--   4. Persetujuan perangkat ditolak bila pegawai masih punya perangkat
--      approved lain.
-- ==========================================================================

begin;

-- Data perangkat saat ini adalah data uji. Kosongkan agar semua pegawai
-- mengikuti alur verifikasi dari awal dengan aturan satu perangkat.
delete from public.perangkat;

drop index if exists public.uq_perangkat_disetujui;

create unique index if not exists uq_perangkat_aktif
  on public.perangkat (user_id)
  where status in ('pending', 'approved');

-- Helper SECURITY DEFINER agar policy tidak membaca tabel perangkat secara
-- rekursif dan tetap dapat memeriksa perangkat aktif milik user.
create or replace function public.punya_perangkat_aktif(p_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.perangkat
     where user_id = p_user
       and status in ('pending', 'approved')
  );
$$;

revoke execute on function public.punya_perangkat_aktif(uuid) from public, anon;
grant execute on function public.punya_perangkat_aktif(uuid) to authenticated;

-- Pegawai hanya boleh membuat pengajuan bila belum punya perangkat aktif.
drop policy if exists "perangkat_ajukan_pending" on public.perangkat;
create policy "perangkat_ajukan_pending" on public.perangkat
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and not public.punya_perangkat_aktif(auth.uid())
  );

-- Pengajuan ulang hanya untuk baris yang ditolak dan hanya bila tidak ada
-- perangkat aktif lain. Unique index tetap menjadi pengaman terakhir.
drop policy if exists "perangkat_ajukan_ulang" on public.perangkat;
create policy "perangkat_ajukan_ulang" on public.perangkat
  for update to authenticated
  using (
    user_id = auth.uid()
    and status <> 'approved'
    and not public.punya_perangkat_aktif(auth.uid())
  )
  with check (user_id = auth.uid() and status = 'pending');

-- Persetujuan hanya untuk pengajuan pending dan tidak boleh menimpa perangkat
-- approved lain. Untuk pindah perangkat, Admin IT harus reset terlebih dahulu.
create or replace function public.setujui_perangkat(p_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_status text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menyetujui perangkat.';
  end if;

  select user_id, status
    into v_user, v_status
    from public.perangkat
   where id = p_id
   for update;

  if v_user is null then
    raise exception 'Pengajuan perangkat tidak ditemukan.';
  end if;

  if v_status <> 'pending' then
    raise exception 'Hanya pengajuan yang masih menunggu yang dapat disetujui.';
  end if;

  if exists (
    select 1
      from public.perangkat
     where user_id = v_user
       and status = 'approved'
       and id <> p_id
  ) then
    raise exception 'Pegawai masih memiliki perangkat aktif. Reset perangkat lama terlebih dahulu.';
  end if;

  update public.perangkat
     set status = 'rejected',
         catatan = coalesce(catatan, 'Ditolak karena ada pengajuan perangkat lain')
   where user_id = v_user
     and status = 'pending'
     and id <> p_id;

  update public.perangkat
     set status = 'approved',
         disetujui_pada = now(),
         disetujui_oleh = auth.uid(),
         catatan = null
   where id = p_id;

  return jsonb_build_object('status', 'ok', 'pesan', 'Perangkat disetujui.');
end;
$$;

revoke execute on function public.setujui_perangkat(uuid) from public, anon;
grant execute on function public.setujui_perangkat(uuid) to authenticated;

commit;
