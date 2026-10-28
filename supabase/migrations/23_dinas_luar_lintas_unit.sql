-- ==========================================================================
-- 23 - DINAS LUAR LINTAS UNIT
-- Syarat: 01 s.d. 22 sudah dijalankan.
--
-- Ringkasan:
--   1. Kepala unit dapat mencatat Dinas Luar untuk pegawai lintas unit.
--      Sakit dan Cuti tetap terbatas pada unit yang dikelola.
--   2. Pembuat grup dapat membaca seluruh anggota (termasuk profil pegawai)
--      dan dokumen grup Dinas Luar lintas unit selama masih menjabat kepala
--      unit. Akses otomatis dicabut ketika penugasan kepala unit berakhir.
--   3. dibuat_oleh dan dibatalkan_oleh mengacu ke auth.users agar kepala ASN
--      (tanpa baris public.pegawai) dapat mencatat dan membatalkan.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.izin_cuti') is null
     or to_regclass('public.pegawai') is null
     or to_regclass('public.kepala_unit') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-22 pada project Supabase yang benar.';
  end if;
  if to_regclass('auth.users') is null then
    raise exception 'Skema auth.users tidak ditemukan. Pastikan project Supabase benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Kepemilikan pengajuan oleh akun, bukan hanya baris pegawai
-- --------------------------------------------------------------------------

alter table public.izin_cuti
  drop constraint if exists izin_cuti_dibuat_oleh_fkey,
  drop constraint if exists izin_cuti_dibatalkan_oleh_fkey;

alter table public.izin_cuti alter column dibuat_oleh drop not null;

alter table public.izin_cuti
  add constraint izin_cuti_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references auth.users (id)
  on delete set null not valid;

alter table public.izin_cuti
  add constraint izin_cuti_dibatalkan_oleh_fkey
  foreign key (dibatalkan_oleh) references auth.users (id)
  on delete set null not valid;

alter table public.izin_cuti validate constraint izin_cuti_dibuat_oleh_fkey;
alter table public.izin_cuti validate constraint izin_cuti_dibatalkan_oleh_fkey;

-- --------------------------------------------------------------------------
-- 2. Daftar pegawai untuk form izin (lintas unit)
-- --------------------------------------------------------------------------

create or replace function public.daftar_pegawai_izin()
returns table (id uuid, nama text, unit_kerja text)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.nama, p.unit_kerja
    from public.pegawai p
   where p.role = 'pegawai'
     and (public.is_superadmin() or public.is_kepala_ruangan())
   order by p.nama;
$$;

revoke execute on function public.daftar_pegawai_izin() from public, anon;
grant execute on function public.daftar_pegawai_izin() to authenticated;

-- --------------------------------------------------------------------------
-- 3. Akses grup & dokumen oleh pembuat grup yang masih menjabat
-- --------------------------------------------------------------------------

create or replace function public.bisa_akses_grup(p_grup_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or (
        public.is_kepala_ruangan()
        and exists (
          select 1
            from public.izin_cuti i
           where i.grup_id = p_grup_id
             and i.dibuat_oleh = auth.uid()
        )
      );
$$;

create or replace function public.bisa_kelola_izin_grup(p_grup_ids uuid[])
returns table (grup_id uuid, boleh boolean)
language sql stable security definer
set search_path = public
as $$
  with diminta as (
    select distinct x as grup_id
      from unnest(coalesce(p_grup_ids, '{}'::uuid[])) as x
     where x is not null
  ), info as (
    select i.grup_id,
           min(i.jenis) as jenis,
           (array_agg(i.dibuat_oleh))[1] as dibuat_oleh,
           bool_and(public.bisa_kelola_unit(p.unit_kerja)) as semua_unit_dikelola
      from public.izin_cuti i
      join public.pegawai p on p.id = i.user_id
     where i.grup_id in (select d.grup_id from diminta d)
     group by i.grup_id
  )
  select d.grup_id,
         (
           public.is_superadmin()
           or (
             i.jenis = 'Dinas Luar'
             and public.is_kepala_ruangan()
             and i.dibuat_oleh = auth.uid()
           )
           or coalesce(i.semua_unit_dikelola, false)
         ) as boleh
    from diminta d
    left join info i on i.grup_id = d.grup_id;
$$;

drop policy if exists "izin_baca_terkait" on public.izin_cuti;
create policy "izin_baca_terkait" on public.izin_cuti
  for select to authenticated
  using (
    public.bisa_akses_izin(user_id)
    or public.bisa_akses_grup(grup_id)
  );

-- Pembuat grup perlu membaca profil pegawai lintas unit yang ia catat agar
-- nama dan unit kerja anggota tampil di daftar pengajuan.
drop policy if exists "pegawai_baca_profil_sendiri" on public.pegawai;
create policy "pegawai_baca_profil_sendiri" on public.pegawai
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (
      public.is_kepala_ruangan()
      and (
        unit_kerja in (select public.unit_dikelola())
        or exists (
          select 1
            from public.izin_cuti i
           where i.user_id = pegawai.id
             and i.dibuat_oleh = auth.uid()
        )
      )
    )
  );

create or replace function public.bisa_baca_dokumen(p_path text)
returns boolean
language sql stable security definer
set search_path = public, storage
as $$
  select exists (
    select 1
      from public.izin_cuti i
     where i.dokumen_path = p_path
       and (
         public.bisa_akses_izin(i.user_id)
         or public.bisa_akses_grup(i.grup_id)
       )
  )
  or exists (
    select 1
      from storage.objects o
     where o.bucket_id = 'dokumen-izin'
       and o.name = p_path
       and o.owner::text = auth.uid()::text
       and not exists (
         select 1 from public.izin_cuti i where i.dokumen_path = p_path
       )
  );
$$;

revoke execute on function public.bisa_akses_grup(uuid) from public, anon;
revoke execute on function public.bisa_kelola_izin_grup(uuid[]) from public, anon;
revoke execute on function public.bisa_baca_dokumen(text) from public, anon;
grant execute on function public.bisa_akses_grup(uuid) to authenticated;
grant execute on function public.bisa_kelola_izin_grup(uuid[]) to authenticated;
grant execute on function public.bisa_baca_dokumen(text) to authenticated;

-- --------------------------------------------------------------------------
-- 4. RPC catat: Dinas Luar boleh lintas unit
-- --------------------------------------------------------------------------

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

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'pesan', 'Ketidakhadiran berhasil dicatat dengan status menunggu.'
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 5. RPC ubah: pembuat grup Dinas Luar boleh mengubah
-- --------------------------------------------------------------------------

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

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'pesan', 'Pengajuan berhasil diperbarui.'
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 6. RPC batalkan: pembuat grup Dinas Luar boleh membatalkan
-- --------------------------------------------------------------------------

create or replace function public.batalkan_izin_grup(
  p_grup_id uuid,
  p_alasan text default null
) returns jsonb
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_lama public.izin_cuti%rowtype;
  v_baris public.izin_cuti%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;

  if not (public.is_superadmin() or public.is_kepala_ruangan()) then
    raise exception 'Anda tidak berhak membatalkan pengajuan.';
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

  if v_lama.status not in ('menunggu', 'disetujui') then
    raise exception 'Pengajuan ini tidak dapat dibatalkan.';
  end if;

  if v_lama.status = 'disetujui' and not public.is_superadmin() then
    raise exception 'Setelah disetujui, hanya Super Admin yang dapat membatalkan pengajuan.';
  end if;

  if not public.is_superadmin()
     and not (
       v_lama.jenis = 'Dinas Luar'
       and v_lama.status = 'menunggu'
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
    raise exception 'Anda hanya dapat membatalkan pengajuan dari unit yang Anda kelola.';
  end if;

  if v_lama.status = 'disetujui' then
    for v_baris in
      select * from public.izin_cuti where grup_id = p_grup_id
    loop
      delete from public.presensi
       where user_id = v_baris.user_id
         and tanggal between v_baris.tanggal_mulai and v_baris.tanggal_selesai
         and jam_masuk is null
         and dikoreksi_oleh is null
         and status_kehadiran = v_baris.jenis;
    end loop;
  end if;

  update public.izin_cuti
     set status = 'dibatalkan',
         dibatalkan_oleh = auth.uid(),
         dibatalkan_pada = now(),
         alasan_pembatalan = nullif(trim(p_alasan), '')
   where grup_id = p_grup_id;

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'pesan', 'Pengajuan dibatalkan.'
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 7. Hak eksekusi RPC
-- --------------------------------------------------------------------------

revoke execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.batalkan_izin_grup(uuid, text) from public, anon;

grant execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.batalkan_izin_grup(uuid, text) to authenticated;

commit;
