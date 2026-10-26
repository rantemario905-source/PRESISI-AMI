-- ==========================================================================
-- 18 - HAPUS GRUP KOSONG
-- Syarat: 01 s.d. 17 sudah dijalankan.
--
-- Ringkasan:
--   1. Semua grup tanpa pegawai dapat dihapus, termasuk "Belum ditentukan".
--   2. Grup yang masih memiliki pegawai tetap ditolak.
--   3. "Belum ditentukan" akan dibuat ulang otomatis oleh trigger akun baru
--      bila ada pegawai baru tanpa unit kerja.
-- ==========================================================================

begin;

create or replace function public.hapus_grup_shift(p_nama text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_jumlah integer;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menghapus grup shift.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  if length(v_nama) < 2 then
    raise exception 'Nama grup shift tidak valid.';
  end if;

  perform pg_advisory_xact_lock(hashtext('presisi-grup-' || v_nama));

  select count(*)::int into v_jumlah
    from public.pegawai p
   where p.unit_kerja = v_nama;

  if v_jumlah > 0 then
    raise exception 'Grup "%" masih memiliki % pegawai. Pindahkan pegawai terlebih dahulu.',
      v_nama, v_jumlah;
  end if;

  delete from public.grup_shift where nama = v_nama;
  if not found then
    raise exception 'Grup shift "%" tidak ditemukan.', v_nama;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'nama', v_nama,
    'pesan', 'Grup shift dihapus.'
  );
end;
$$;

revoke execute on function public.hapus_grup_shift(text) from public, anon;
grant execute on function public.hapus_grup_shift(text) to authenticated;

commit;
