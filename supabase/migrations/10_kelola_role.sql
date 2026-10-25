-- ==========================================================================
-- 10 — KELOLA ROLE DARI DATA PEGAWAI
-- Syarat: 01 s.d. 09 sudah dijalankan.
--
-- Super Admin dapat memperbarui nama, unit kerja, dan role sekaligus dari
-- menu Data Pegawai. Pengaman:
--   - hanya Super Admin yang boleh memanggil RPC;
--   - role hanya 'pegawai' atau 'superadmin';
--   - Super Admin tidak dapat menurunkan role akunnya sendiri;
--   - minimal satu Super Admin harus tetap ada;
--   - pegawai yang dipromosikan menjadi Super Admin otomatis dilepas dari
--     status kepala ruangan agar tidak mengunci slot kepala unit.
--
-- Flag kepala_ruangan tetap hanya dapat diubah lewat SQL oleh Admin IT.
-- ==========================================================================

begin;

create or replace function public.perbarui_pegawai_lengkap(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_role text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_role text;
  v_jumlah_superadmin integer;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah data pegawai.';
  end if;

  if p_id is null then
    raise exception 'ID pegawai tidak valid.';
  end if;

  if p_nama is null or length(trim(p_nama)) < 2 then
    raise exception 'Nama pegawai wajib diisi (minimal 2 karakter).';
  end if;

  if p_unit_kerja is null or length(trim(p_unit_kerja)) < 2 then
    raise exception 'Unit kerja wajib diisi (minimal 2 karakter).';
  end if;

  v_role := lower(trim(coalesce(p_role, '')));
  if v_role not in ('pegawai', 'superadmin') then
    raise exception 'Role pegawai tidak valid.';
  end if;

  -- Serialisasi perubahan role agar dua Super Admin tidak saling menurunkan
  -- secara bersamaan sampai tidak tersisa satu pun.
  perform pg_advisory_xact_lock(hashtext('presisi-role-pegawai'));

  select * into v_lama
    from public.pegawai
   where id = p_id
   for update;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  if p_id = auth.uid() and v_role <> v_lama.role then
    raise exception 'Role akun sendiri tidak dapat diubah dari aplikasi.';
  end if;

  if v_lama.role = 'superadmin' and v_role <> 'superadmin' then
    select count(*) into v_jumlah_superadmin
      from public.pegawai
     where role = 'superadmin';

    if v_jumlah_superadmin <= 1 then
      raise exception 'Minimal harus ada satu Super Admin aktif.';
    end if;
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = trim(p_unit_kerja),
         role = v_role,
         kepala_ruangan = case
           when v_role = 'superadmin' then false
           else kepala_ruangan
         end
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'role', v_role,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_lengkap(uuid, text, text, text)
  from public, anon;
grant execute on function public.perbarui_pegawai_lengkap(uuid, text, text, text)
  to authenticated;

commit;
