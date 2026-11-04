-- ==========================================================================
-- MIGRASI 31 - PERSETUJUAN OTOMATIS OLEH SUPER ADMIN
-- --------------------------------------------------------------------------
-- Pengajuan baru (Sakit, Dinas Luar, Cuti) yang dicatat Super Admin langsung
-- berstatus disetujui dan presensi terkait langsung ditandai. Pengajuan yang
-- dicatat kepala ruangan tetap menunggu sampai diproses Super Admin.
-- Perubahan oleh Super Admin atas pengajuan yang masih menunggu juga langsung
-- disetujui. Validasi dokumen, unit kerja, dan penandaan presensi tetap
-- dijalankan oleh putuskan_izin_grup().
-- ==========================================================================

create or replace function public.catat_izin_grup(
  p_grup_id uuid,
  p_jenis text,
  p_user_ids uuid[],
  p_tanggal_mulai date,
  p_tanggal_selesai date,
  p_keterangan text default null,
  p_dokumen_path text default null,
  p_dokumen_nama text default null,
  p_dokumen_tipe text default null,
  p_dokumen_ukuran bigint default null
) returns jsonb
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_jumlah integer;
  v_uid uuid;
  v_path text := nullif(trim(p_dokumen_path), '');
  v_nama text;
  v_tipe text := nullif(trim(p_dokumen_tipe), '');
  v_ukuran bigint := p_dokumen_ukuran;
  v_otomatis boolean := public.is_superadmin();
begin
  if auth.uid() is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;

  if not (public.is_superadmin() or public.is_kepala_ruangan()) then
    raise exception 'Hanya kepala ruangan atau Super Admin yang dapat mencatat ketidakhadiran.';
  end if;

  if p_grup_id is null then
    raise exception 'ID grup pengajuan tidak valid.';
  end if;

  perform pg_advisory_xact_lock(hashtext('presisi-izin:' || p_grup_id::text));

  if p_jenis not in ('Sakit', 'Cuti', 'Dinas Luar') then
    raise exception 'Jenis ketidakhadiran tidak valid.';
  end if;

  if p_tanggal_mulai is null or p_tanggal_selesai is null
     or p_tanggal_selesai < p_tanggal_mulai then
    raise exception 'Rentang tanggal tidak valid.';
  end if;

  v_jumlah := coalesce(array_length(p_user_ids, 1), 0);
  if v_jumlah = 0 then
    raise exception 'Pilih minimal satu pegawai.';
  end if;
  if p_jenis in ('Sakit', 'Cuti') and v_jumlah <> 1 then
    raise exception 'Sakit dan Cuti hanya untuk satu pegawai.';
  end if;
  if p_jenis = 'Dinas Luar' and v_jumlah > 4 then
    raise exception 'Dinas Luar maksimal 4 pegawai per grup.';
  end if;
  if exists (select 1 from unnest(p_user_ids) as x where x is null) then
    raise exception 'Pegawai yang dipilih tidak boleh kosong.';
  end if;
  if (select count(distinct x) from unnest(p_user_ids) as x) <> v_jumlah then
    raise exception 'Pegawai yang dipilih tidak boleh duplikat.';
  end if;

  if exists (
    select 1
      from unnest(p_user_ids) as x
      left join public.pegawai p on p.id = x
     where p.id is null
  ) then
    raise exception 'Ada pegawai yang tidak ditemukan.';
  end if;

  if exists (
    select 1
      from unnest(p_user_ids) as x
      join public.pegawai p on p.id = x
     where p.role <> 'pegawai'
  ) then
    raise exception 'Hanya pegawai non-ASN yang dapat dicatat.';
  end if;

  if not public.is_superadmin()
     and p_jenis in ('Sakit', 'Cuti')
     and exists (
       select 1
         from unnest(p_user_ids) as x
         join public.pegawai p on p.id = x
        where not public.bisa_kelola_unit(p.unit_kerja)
     ) then
    raise exception 'Sakit dan Cuti hanya untuk pegawai dari unit yang Anda kelola.';
  end if;

  if exists (select 1 from public.izin_cuti where grup_id = p_grup_id) then
    raise exception 'ID grup sudah dipakai. Muat ulang halaman lalu coba lagi.';
  end if;

  if p_jenis <> 'Cuti' and v_path is null then
    raise exception 'Dokumen wajib diunggah untuk Sakit dan Dinas Luar.';
  end if;

  if v_path is not null then
    perform public.validasi_dokumen_izin(v_path, p_grup_id, v_tipe, v_ukuran);

    select coalesce(o.metadata ->> 'mimetype', v_tipe),
           coalesce(nullif(o.metadata ->> 'size', '')::bigint, v_ukuran)
      into v_tipe, v_ukuran
      from storage.objects o
     where o.bucket_id = 'dokumen-izin'
       and o.name = v_path;

    if v_tipe = 'image/jpg' then
      v_tipe := 'image/jpeg';
    end if;
    v_nama := coalesce(
      nullif(trim(p_dokumen_nama), ''),
      regexp_replace(v_path, '^.*/', '')
    );
  end if;

  foreach v_uid in array p_user_ids loop
    insert into public.izin_cuti (
      user_id,
      grup_id,
      jenis,
      tanggal_mulai,
      tanggal_selesai,
      alasan,
      status,
      dibuat_oleh,
      dokumen_path,
      dokumen_nama,
      dokumen_tipe,
      dokumen_ukuran
    ) values (
      v_uid,
      p_grup_id,
      p_jenis,
      p_tanggal_mulai,
      p_tanggal_selesai,
      nullif(trim(p_keterangan), ''),
      'menunggu',
      auth.uid(),
      v_path,
      case when v_path is null then null else v_nama end,
      case when v_path is null then null else v_tipe end,
      case when v_path is null then null else v_ukuran end
    );
  end loop;

  if v_otomatis then
    perform public.putuskan_izin_grup(
      p_grup_id,
      'disetujui',
      'Disetujui otomatis karena dicatat oleh Super Admin.'
    );
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'status_pengajuan', case when v_otomatis then 'disetujui' else 'menunggu' end,
    'otomatis_disetujui', v_otomatis,
    'pesan', case
      when v_otomatis then 'Ketidakhadiran berhasil dicatat dan langsung disetujui.'
      else 'Ketidakhadiran berhasil dicatat dengan status menunggu.'
    end
  );
end;
$$;

create or replace function public.ubah_izin_grup(
  p_grup_id uuid,
  p_jenis text,
  p_user_ids uuid[],
  p_tanggal_mulai date,
  p_tanggal_selesai date,
  p_keterangan text default null,
  p_dokumen_path text default null,
  p_dokumen_nama text default null,
  p_dokumen_tipe text default null,
  p_dokumen_ukuran bigint default null
) returns jsonb
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_lama public.izin_cuti%rowtype;
  v_jumlah integer;
  v_uid uuid;
  v_path text;
  v_nama text;
  v_tipe text;
  v_ukuran bigint;
  v_dibuat_pada timestamptz;
  v_dibuat_oleh uuid;
  v_otomatis boolean := public.is_superadmin();
begin
  if auth.uid() is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;

  if not (public.is_superadmin() or public.is_kepala_ruangan()) then
    raise exception 'Hanya kepala ruangan atau Super Admin yang dapat mengubah pengajuan.';
  end if;

  if p_grup_id is null then
    raise exception 'ID grup pengajuan tidak valid.';
  end if;

  perform pg_advisory_xact_lock(hashtext('presisi-izin:' || p_grup_id::text));

  select * into v_lama
    from public.izin_cuti
   where grup_id = p_grup_id
   limit 1;

  if not found then
    raise exception 'Pengajuan tidak ditemukan.';
  end if;

  if exists (
    select 1 from public.izin_cuti
     where grup_id = p_grup_id and status <> 'menunggu'
  ) then
    raise exception 'Hanya pengajuan berstatus menunggu yang dapat diubah.';
  end if;

  if not public.is_superadmin()
     and not (
       v_lama.jenis = 'Dinas Luar'
       and public.is_kepala_ruangan()
       and v_lama.dibuat_oleh = auth.uid()
     )
     and exists (
       select 1
         from public.izin_cuti i
         join public.pegawai p on p.id = i.user_id
        where i.grup_id = p_grup_id
          and not public.bisa_kelola_unit(p.unit_kerja)
     ) then
    raise exception 'Anda hanya dapat mengubah pengajuan dari unit yang Anda kelola.';
  end if;

  if p_jenis not in ('Sakit', 'Cuti', 'Dinas Luar') then
    raise exception 'Jenis ketidakhadiran tidak valid.';
  end if;

  if p_tanggal_mulai is null or p_tanggal_selesai is null
     or p_tanggal_selesai < p_tanggal_mulai then
    raise exception 'Rentang tanggal tidak valid.';
  end if;

  v_jumlah := coalesce(array_length(p_user_ids, 1), 0);
  if v_jumlah = 0 then
    raise exception 'Pilih minimal satu pegawai.';
  end if;
  if p_jenis in ('Sakit', 'Cuti') and v_jumlah <> 1 then
    raise exception 'Sakit dan Cuti hanya untuk satu pegawai.';
  end if;
  if p_jenis = 'Dinas Luar' and v_jumlah > 4 then
    raise exception 'Dinas Luar maksimal 4 pegawai per grup.';
  end if;
  if exists (select 1 from unnest(p_user_ids) as x where x is null) then
    raise exception 'Pegawai yang dipilih tidak boleh kosong.';
  end if;
  if (select count(distinct x) from unnest(p_user_ids) as x) <> v_jumlah then
    raise exception 'Pegawai yang dipilih tidak boleh duplikat.';
  end if;

  if exists (
    select 1
      from unnest(p_user_ids) as x
      left join public.pegawai p on p.id = x
     where p.id is null
  ) then
    raise exception 'Ada pegawai yang tidak ditemukan.';
  end if;

  if exists (
    select 1
      from unnest(p_user_ids) as x
      join public.pegawai p on p.id = x
     where p.role <> 'pegawai'
  ) then
    raise exception 'Hanya pegawai non-ASN yang dapat dicatat.';
  end if;

  if not public.is_superadmin()
     and p_jenis in ('Sakit', 'Cuti')
     and exists (
       select 1
         from unnest(p_user_ids) as x
         join public.pegawai p on p.id = x
        where not public.bisa_kelola_unit(p.unit_kerja)
     ) then
    raise exception 'Sakit dan Cuti hanya untuk pegawai dari unit yang Anda kelola.';
  end if;

  v_path := nullif(trim(p_dokumen_path), '');
  if v_path is null then
    v_path := v_lama.dokumen_path;
    v_nama := v_lama.dokumen_nama;
    v_tipe := v_lama.dokumen_tipe;
    v_ukuran := v_lama.dokumen_ukuran;
  else
    v_tipe := nullif(trim(p_dokumen_tipe), '');
    v_ukuran := p_dokumen_ukuran;
    perform public.validasi_dokumen_izin(v_path, p_grup_id, v_tipe, v_ukuran);

    select coalesce(o.metadata ->> 'mimetype', v_tipe),
           coalesce(nullif(o.metadata ->> 'size', '')::bigint, v_ukuran)
      into v_tipe, v_ukuran
      from storage.objects o
     where o.bucket_id = 'dokumen-izin'
       and o.name = v_path;

    if v_tipe = 'image/jpg' then
      v_tipe := 'image/jpeg';
    end if;
    v_nama := coalesce(
      nullif(trim(p_dokumen_nama), ''),
      regexp_replace(v_path, '^.*/', '')
    );
  end if;

  if p_jenis <> 'Cuti' and v_path is null then
    raise exception 'Dokumen wajib ada untuk Sakit dan Dinas Luar.';
  end if;

  if p_jenis <> 'Cuti' and v_path is not null then
    perform public.validasi_dokumen_izin(v_path, p_grup_id, v_tipe, v_ukuran);
  end if;

  v_dibuat_pada := v_lama.dibuat_pada;
  v_dibuat_oleh := v_lama.dibuat_oleh;

  delete from public.izin_cuti where grup_id = p_grup_id;

  foreach v_uid in array p_user_ids loop
    insert into public.izin_cuti (
      user_id,
      grup_id,
      jenis,
      tanggal_mulai,
      tanggal_selesai,
      alasan,
      status,
      dibuat_oleh,
      dibuat_pada,
      dokumen_path,
      dokumen_nama,
      dokumen_tipe,
      dokumen_ukuran
    ) values (
      v_uid,
      p_grup_id,
      p_jenis,
      p_tanggal_mulai,
      p_tanggal_selesai,
      nullif(trim(p_keterangan), ''),
      'menunggu',
      v_dibuat_oleh,
      v_dibuat_pada,
      v_path,
      case when v_path is null then null else v_nama end,
      case when v_path is null then null else v_tipe end,
      case when v_path is null then null else v_ukuran end
    );
  end loop;

  if v_otomatis then
    perform public.putuskan_izin_grup(
      p_grup_id,
      'disetujui',
      'Disetujui otomatis setelah diubah oleh Super Admin.'
    );
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'status_pengajuan', case when v_otomatis then 'disetujui' else 'menunggu' end,
    'otomatis_disetujui', v_otomatis,
    'pesan', case
      when v_otomatis then 'Pengajuan berhasil diperbarui dan langsung disetujui.'
      else 'Pengajuan berhasil diperbarui.'
    end
  );
end;
$$;

revoke execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)
  from public, anon;
revoke execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)
  from public, anon;
grant execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)
  to authenticated;
grant execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint)
  to authenticated;
