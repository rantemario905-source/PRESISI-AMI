-- ==========================================================================
-- 08 — DATA PEGAWAI (FASE 3)
-- Syarat: 01 s.d. 07 sudah dijalankan.
--
-- Menambahkan RPC untuk memperbarui nama & unit kerja pegawai dari Portal
-- Super Admin. Role SENGAJA tidak dapat diubah lewat RPC ini — promosi
-- superadmin tetap hanya melalui SQL oleh Admin IT.
-- ==========================================================================

create or replace function public.perbarui_pegawai(
  p_id uuid,
  p_nama text,
  p_unit_kerja text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah data pegawai.';
  end if;

  if p_nama is null or length(trim(p_nama)) < 2 then
    raise exception 'Nama pegawai wajib diisi (minimal 2 karakter).';
  end if;

  if p_unit_kerja is null or length(trim(p_unit_kerja)) < 2 then
    raise exception 'Unit kerja wajib diisi (minimal 2 karakter).';
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = trim(p_unit_kerja)
   where id = p_id;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Data pegawai berhasil diperbarui.');
end;
$$;

revoke execute on function public.perbarui_pegawai(uuid, text, text) from public, anon;
grant execute on function public.perbarui_pegawai(uuid, text, text) to authenticated;
