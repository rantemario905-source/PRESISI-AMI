-- ==========================================================================
-- 11 — PENGATURAN KEPALA RUANGAN DARI DATA PEGAWAI
-- Syarat: 01 s.d. 09 sudah dijalankan (10 opsional).
--
-- Super Admin dapat memperbarui nama, unit kerja, dan status kepala ruangan
-- sekaligus dari menu Data Pegawai. Jika unit tujuan sudah memiliki kepala
-- ruangan, status kepala lama dipindahkan otomatis agar tetap satu kepala
-- per unit. Role tidak diubah di sini; promosi Super Admin tetap lewat SQL.
-- ==========================================================================

begin;

create or replace function public.perbarui_pegawai_dan_kepala(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_kepala_ruangan boolean
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_unit text;
  v_kepala boolean;
  v_kepala_lama text;
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

  v_unit := trim(p_unit_kerja);
  v_kepala := coalesce(p_kepala_ruangan, false);

  -- Serialisasi perubahan kepala pada unit yang sama.
  perform pg_advisory_xact_lock(hashtext('presisi-kepala-' || v_unit));

  select * into v_lama
    from public.pegawai
   where id = p_id
   for update;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  if v_lama.role <> 'pegawai' then
    raise exception 'Hanya akun pegawai yang dapat dijadikan kepala ruangan.';
  end if;

  if v_kepala then
    select string_agg(nama, ', ' order by nama)
      into v_kepala_lama
      from public.pegawai
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;

    update public.pegawai
       set kepala_ruangan = false
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = v_unit,
         kepala_ruangan = v_kepala
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'kepala_ruangan', v_kepala,
    'kepala_sebelumnya', v_kepala_lama,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_dan_kepala(uuid, text, text, boolean)
  from public, anon;
grant execute on function public.perbarui_pegawai_dan_kepala(uuid, text, text, boolean)
  to authenticated;

commit;
