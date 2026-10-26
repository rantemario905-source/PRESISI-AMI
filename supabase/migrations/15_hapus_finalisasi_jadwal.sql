-- ==========================================================================
-- 15 - HAPUS FINALISASI JADWAL
-- Syarat: 01 s.d. 14 sudah dijalankan.
--
-- Ringkasan:
--   1. Finalisasi bulanan dihapus total: tabel, fungsi status, dan RPC.
--   2. Kepala ruangan dapat mengubah jadwal mulai hari ini (WITA) dan
--      tanggal setelahnya; tanggal lampau tetap hanya untuk Super Admin.
--   3. Impor template mengikuti batas tanggal yang sama tanpa cek finalisasi.
--   4. Sel kosong berarti belum dijadwalkan, bukan libur.
-- ==========================================================================

begin;

-- Policy lama bergantung pada fungsi jadwal_bulan_final, jadi policy harus
-- dilepas sebelum fungsinya dihapus.
drop policy if exists "jadwal_kelola_kepala_unit" on public.jadwal_shift;

drop function if exists public.finalisasi_jadwal_unit(text, date, boolean);
drop function if exists public.jadwal_bulan_final(uuid, date);

-- Impor tanpa pengecekan jadwal_shift_final dan tanpa penolakan tanggal hari ini.
create or replace function public.impor_jadwal_shift(
  p_unit text,
  p_periode date,
  p_baris jsonb
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_unit text := trim(coalesce(p_unit, ''));
  v_periode date;
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
  v_super boolean := public.is_superadmin();
  v_unit_saya text := public.unit_saya();
  v_input record;
  v_lama public.jadwal_shift%rowtype;
  v_jumlah integer := 0;
  v_dibuat integer := 0;
  v_diperbarui integer := 0;
  v_dihapus integer := 0;
  v_dilewati integer := 0;
  v_duplikat integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sesi login tidak valid.';
  end if;

  if v_unit = '' then
    raise exception 'Unit kerja wajib dipilih.';
  end if;

  if p_periode is null then
    raise exception 'Periode wajib dipilih.';
  end if;

  v_periode := date_trunc('month', p_periode)::date;

  if not exists (
    select 1 from public.grup_shift g where g.nama = v_unit
  ) then
    raise exception 'Grup shift tidak ditemukan.';
  end if;

  if p_baris is null or jsonb_typeof(p_baris) <> 'array' then
    raise exception 'Data impor tidak valid.';
  end if;

  if jsonb_array_length(p_baris) = 0 then
    raise exception 'Tidak ada baris jadwal yang akan diimpor.';
  end if;

  if jsonb_array_length(p_baris) > 10000 then
    raise exception 'Jumlah baris impor terlalu banyak (maksimal 10.000).';
  end if;

  if not v_super then
    if not public.is_kepala_ruangan()
       or v_unit_saya is distinct from v_unit then
      raise exception 'Anda hanya dapat mengimpor jadwal unit sendiri.';
    end if;

    if v_periode < date_trunc('month', v_hari_ini)::date then
      raise exception 'Jadwal bulan yang sudah lewat hanya dapat diimpor Super Admin.';
    end if;
  end if;

  -- Validasi seluruh baris sebelum menulis apa pun.
  for v_input in
    select *
      from jsonb_to_recordset(p_baris)
        as x(user_id uuid, tanggal date, shift_id uuid, aksi text)
  loop
    v_jumlah := v_jumlah + 1;

    if v_input.user_id is null then
      raise exception 'Baris %: user_id wajib diisi.', v_jumlah;
    end if;

    if v_input.tanggal is null then
      raise exception 'Baris %: tanggal wajib diisi.', v_jumlah;
    end if;

    if v_input.tanggal < v_periode
       or v_input.tanggal >= (v_periode + interval '1 month')::date then
      raise exception 'Baris %: tanggal % di luar periode %.',
        v_jumlah,
        v_input.tanggal,
        to_char(v_periode, 'YYYY-MM');
    end if;

    if lower(trim(coalesce(v_input.aksi, ''))) not in ('simpan', 'hapus') then
      raise exception 'Baris %: aksi harus simpan atau hapus.', v_jumlah;
    end if;

    if not exists (
      select 1
        from public.pegawai p
       where p.id = v_input.user_id
         and p.role = 'pegawai'
         and p.pola_kerja = 'shift'
         and p.unit_kerja = v_unit
    ) then
      raise exception 'Baris %: pegawai bukan pegawai shift di unit ini.', v_jumlah;
    end if;

    if lower(trim(v_input.aksi)) = 'simpan' then
      if v_input.shift_id is null then
        raise exception 'Baris %: shift wajib dipilih.', v_jumlah;
      end if;

      if not exists (
        select 1 from public.shift_master s where s.id = v_input.shift_id
      ) then
        raise exception 'Baris %: shift tidak ditemukan.', v_jumlah;
      end if;
    end if;

    if not v_super and v_input.tanggal < v_hari_ini then
      raise exception 'Baris %: tanggal sebelum hari ini hanya dapat diubah Super Admin.',
        v_jumlah;
    end if;
  end loop;

  select count(*) into v_duplikat
    from (
      select user_id, tanggal
        from jsonb_to_recordset(p_baris)
          as x(user_id uuid, tanggal date, shift_id uuid, aksi text)
       group by user_id, tanggal
      having count(*) > 1
    ) d;

  if v_duplikat > 0 then
    raise exception 'Terdapat % pasangan pegawai/tanggal ganda dalam file.', v_duplikat;
  end if;

  -- Semua valid: terapkan perubahan.
  for v_input in
    select *
      from jsonb_to_recordset(p_baris)
        as x(user_id uuid, tanggal date, shift_id uuid, aksi text)
  loop
    select * into v_lama
      from public.jadwal_shift js
     where js.user_id = v_input.user_id
       and js.tanggal = v_input.tanggal
     for update;

    if lower(trim(v_input.aksi)) = 'hapus' then
      if found then
        delete from public.jadwal_shift
         where user_id = v_input.user_id
           and tanggal = v_input.tanggal;
        v_dihapus := v_dihapus + 1;
      else
        v_dilewati := v_dilewati + 1;
      end if;
    elsif found then
      if v_lama.shift_id is distinct from v_input.shift_id then
        update public.jadwal_shift
           set shift_id = v_input.shift_id
         where user_id = v_input.user_id
           and tanggal = v_input.tanggal;
        v_diperbarui := v_diperbarui + 1;
      else
        v_dilewati := v_dilewati + 1;
      end if;
    else
      insert into public.jadwal_shift (user_id, tanggal, shift_id)
      values (v_input.user_id, v_input.tanggal, v_input.shift_id);
      v_dibuat := v_dibuat + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'status', 'ok',
    'unit_kerja', v_unit,
    'periode', v_periode,
    'dibuat', v_dibuat,
    'diperbarui', v_diperbarui,
    'dihapus', v_dihapus,
    'dilewati', v_dilewati
  );
end;
$$;

revoke execute on function public.impor_jadwal_shift(text, date, jsonb)
  from public, anon;
grant execute on function public.impor_jadwal_shift(text, date, jsonb)
  to authenticated;

drop table if exists public.jadwal_shift_final;

-- Kepala boleh melihat seluruh jadwal unit, tetapi hanya menulis mulai hari ini.
create policy "jadwal_kelola_kepala_unit" on public.jadwal_shift
  for all to authenticated
  using (
    public.is_kepala_ruangan()
    and public.bisa_kelola_jadwal(user_id)
    and tanggal >= (now() at time zone 'Asia/Makassar')::date
  )
  with check (
    public.is_kepala_ruangan()
    and public.bisa_kelola_jadwal(user_id)
    and tanggal >= (now() at time zone 'Asia/Makassar')::date
  );

commit;
