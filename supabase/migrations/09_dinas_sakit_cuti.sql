-- ==========================================================================
-- 09 — DINAS & SAKIT / CUTI (REDESAIN ADMINISTRASI KETIDAKHADIRAN)
-- Syarat: 01 s.d. 08 sudah dijalankan.
--
-- Perubahan utama:
--   1. Flag kepala_ruangan pada pegawai (satu kepala per unit kerja).
--   2. Jenis izin hanya Sakit, Cuti, Dinas Luar — jenis "Izin" dihapus.
--   3. Dinas Luar dapat dicatat untuk 1–4 pegawai dalam satu grup.
--   4. Dokumen wajib saat menyimpan Sakit & Dinas Luar (JPG/PNG, maks 1 MB).
--      Cuti boleh tanpa dokumen.
--   5. Pegawai TIDAK dapat mengajukan sendiri; hanya kepala ruangan atau
--      Super Admin yang mencatat. Persetujuan hanya oleh Super Admin.
--   6. Status dibatalkan (soft-delete) dengan jejak audit.
--   7. Private bucket Supabase Storage: dokumen-izin.
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Flag kepala ruangan
-- --------------------------------------------------------------------------

alter table public.pegawai
  add column if not exists kepala_ruangan boolean not null default false;

-- Satu unit kerja hanya boleh punya satu kepala ruangan aktif.
create unique index if not exists uq_kepala_ruangan_unit
  on public.pegawai (unit_kerja) where kepala_ruangan;

-- --------------------------------------------------------------------------
-- 2. Struktur izin_cuti
-- --------------------------------------------------------------------------

alter table public.izin_cuti
  add column if not exists grup_id uuid,
  add column if not exists dibuat_oleh uuid references public.pegawai (id),
  add column if not exists dokumen_path text,
  add column if not exists dokumen_nama text,
  add column if not exists dokumen_tipe text,
  add column if not exists dokumen_ukuran bigint,
  add column if not exists dibatalkan_oleh uuid references public.pegawai (id),
  add column if not exists dibatalkan_pada timestamptz,
  add column if not exists alasan_pembatalan text;

alter table public.izin_cuti alter column alasan drop not null;

-- Data lama: beri grup sendiri-sendiri dan pembuat awal.
update public.izin_cuti
   set grup_id = gen_random_uuid()
 where grup_id is null;

update public.izin_cuti
   set dibuat_oleh = user_id
 where dibuat_oleh is null;

-- Jenis "Izin" tidak dipakai lagi. Data lama (bila ada) dipertahankan
-- sebagai Cuti agar tidak hilang, dengan penanda pada keterangan.
update public.izin_cuti
   set jenis = 'Cuti',
       alasan = concat_ws(' ', nullif(alasan, ''), '[Migrasi: jenis Izin lama]')
 where jenis = 'Izin';

alter table public.izin_cuti alter column grup_id set default gen_random_uuid();
alter table public.izin_cuti alter column grup_id set not null;
alter table public.izin_cuti alter column dibuat_oleh set not null;

-- Ganti constraint lama.
alter table public.izin_cuti drop constraint if exists izin_cuti_jenis_check;
alter table public.izin_cuti
  add constraint izin_cuti_jenis_check
  check (jenis in ('Sakit', 'Cuti', 'Dinas Luar')) not valid;

alter table public.izin_cuti drop constraint if exists izin_cuti_status_check;
alter table public.izin_cuti
  add constraint izin_cuti_status_check
  check (status in ('menunggu', 'disetujui', 'ditolak', 'dibatalkan')) not valid;

-- Dokumen wajib untuk Sakit & Dinas Luar. NOT VALID agar baris lama yang
-- belum punya dokumen tidak menggagalkan migrasi; baris baru tetap dicek.
alter table public.izin_cuti drop constraint if exists izin_cuti_dokumen_wajib_check;
alter table public.izin_cuti
  add constraint izin_cuti_dokumen_wajib_check
  check (jenis = 'Cuti' or dokumen_path is not null) not valid;

alter table public.izin_cuti drop constraint if exists izin_cuti_dokumen_tipe_check;
alter table public.izin_cuti
  add constraint izin_cuti_dokumen_tipe_check
  check (dokumen_tipe is null or dokumen_tipe in ('image/jpeg', 'image/png')) not valid;

alter table public.izin_cuti drop constraint if exists izin_cuti_dokumen_ukuran_check;
alter table public.izin_cuti
  add constraint izin_cuti_dokumen_ukuran_check
  check (dokumen_ukuran is null or (dokumen_ukuran > 0 and dokumen_ukuran <= 1048576)) not valid;

create unique index if not exists uq_izin_grup_user
  on public.izin_cuti (grup_id, user_id);
create index if not exists idx_izin_grup on public.izin_cuti (grup_id);
create index if not exists idx_izin_user_tanggal on public.izin_cuti (user_id, tanggal_mulai desc);

-- --------------------------------------------------------------------------
-- 3. Presensi: hapus status "Izin"
-- --------------------------------------------------------------------------

-- Baris lama yang masih berstatus Izin diubah menjadi Koreksi agar constraint
-- baru dapat dipasang tanpa menghapus riwayat.
update public.presensi
   set alasan_koreksi = concat_ws(
         ' ',
         nullif(alasan_koreksi, ''),
         '[Migrasi: status Izin lama dihapus]'
       ),
       status_kehadiran = 'Koreksi'
 where status_kehadiran = 'Izin';

alter table public.presensi drop constraint if exists presensi_status_kehadiran_check;
alter table public.presensi
  add constraint presensi_status_kehadiran_check
  check (status_kehadiran in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi')) not valid;

-- RPC koreksi tetap wajib alasan, tetapi status "Izin" tidak lagi diterima.
create or replace function public.koreksi_presensi(
  p_presensi_id uuid,
  p_jam_masuk timestamptz,
  p_jam_pulang timestamptz,
  p_status text,
  p_alasan text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.presensi%rowtype;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengoreksi presensi.';
  end if;

  if p_alasan is null or length(trim(p_alasan)) < 5 then
    raise exception 'Alasan koreksi wajib diisi (minimal 5 karakter).';
  end if;

  if p_status not in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi') then
    raise exception 'Status kehadiran tidak valid.';
  end if;

  select * into v_lama from public.presensi where id = p_presensi_id;
  if not found then
    raise exception 'Data presensi tidak ditemukan.';
  end if;

  update public.presensi
     set jam_masuk = p_jam_masuk,
         jam_pulang = p_jam_pulang,
         status_kehadiran = p_status,
         dikoreksi_oleh = auth.uid(),
         alasan_koreksi = trim(p_alasan)
   where id = p_presensi_id;

  insert into public.koreksi_presensi
    (presensi_id, admin_id, kolom_koreksi, nilai_lama, nilai_baru, alasan)
  values (
    p_presensi_id,
    auth.uid(),
    'jam_masuk,jam_pulang,status_kehadiran',
    jsonb_build_object(
      'jam_masuk', v_lama.jam_masuk,
      'jam_pulang', v_lama.jam_pulang,
      'status_kehadiran', v_lama.status_kehadiran
    ),
    jsonb_build_object(
      'jam_masuk', p_jam_masuk,
      'jam_pulang', p_jam_pulang,
      'status_kehadiran', p_status
    ),
    trim(p_alasan)
  );

  return jsonb_build_object('status', 'ok', 'pesan', 'Koreksi presensi tersimpan.');
end;
$$;

revoke execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) to authenticated;

-- --------------------------------------------------------------------------
-- 4. Fungsi bantu akses kepala ruangan
-- --------------------------------------------------------------------------

create or replace function public.is_kepala_ruangan()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pegawai
    where id = auth.uid() and kepala_ruangan = true
  );
$$;

create or replace function public.unit_saya()
returns text
language sql stable security definer
set search_path = public
as $$
  select unit_kerja from public.pegawai where id = auth.uid();
$$;

create or replace function public.bisa_akses_izin(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or p_user_id = auth.uid()
      or exists (
        select 1
          from public.pegawai saya
          join public.pegawai target on target.id = p_user_id
         where saya.id = auth.uid()
           and saya.kepala_ruangan = true
           and target.unit_kerja = saya.unit_kerja
      );
$$;

create or replace function public.bisa_baca_dokumen(p_path text)
returns boolean
language sql stable security definer
set search_path = public, storage
as $$
  select exists (
    select 1
      from public.izin_cuti i
     where i.dokumen_path = p_path
       and public.bisa_akses_izin(i.user_id)
  )
  or exists (
    select 1
      from storage.objects o
     where o.bucket_id = 'dokumen-izin'
       and o.name = p_path
       and o.owner::text = auth.uid()::text
  );
$$;

-- Validasi metadata file di storage. Fungsi ini hanya dipanggil oleh RPC
-- SECURITY DEFINER, bukan langsung oleh klien.
-- Dokumen yang masih tertaut ke pengajuan tidak boleh dihapus oleh kepala
-- ruangan agar jejak audit tetap utuh. File yatim (mis. upload gagal disimpan)
-- tetap boleh dibersihkan oleh pemiliknya. Super Admin dapat menghapus semua.
create or replace function public.bisa_hapus_dokumen(p_path text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or not exists (
        select 1 from public.izin_cuti i where i.dokumen_path = p_path
      );
$$;

create or replace function public.validasi_dokumen_izin(
  p_path text,
  p_grup_id uuid,
  p_tipe text default null,
  p_ukuran bigint default null
) returns void
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_mime text;
  v_size bigint;
begin
  if p_path is null then
    return;
  end if;

  if p_grup_id is null or split_part(p_path, '/', 1) <> p_grup_id::text then
    raise exception 'Path dokumen tidak sesuai dengan grup pengajuan.';
  end if;

  select o.metadata ->> 'mimetype',
         nullif(o.metadata ->> 'size', '')::bigint
    into v_mime, v_size
    from storage.objects o
   where o.bucket_id = 'dokumen-izin'
     and o.name = p_path;

  if not found then
    raise exception 'Dokumen tidak ditemukan di storage. Unggah ulang dokumen.';
  end if;

  if v_mime is null then
    v_mime := p_tipe;
  end if;
  if v_mime = 'image/jpg' then
    v_mime := 'image/jpeg';
  end if;
  if v_mime not in ('image/jpeg', 'image/png') then
    raise exception 'Dokumen harus berupa JPG/JPEG atau PNG.';
  end if;

  v_size := coalesce(v_size, p_ukuran);
  if v_size is null or v_size <= 0 or v_size > 1048576 then
    raise exception 'Ukuran dokumen maksimal 1 MB.';
  end if;

  if p_ukuran is not null and (p_ukuran <= 0 or p_ukuran > 1048576) then
    raise exception 'Ukuran dokumen maksimal 1 MB.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 5. RLS izin_cuti & pegawai
-- --------------------------------------------------------------------------

-- Hapus semua policy lama yang memberi akses tulis langsung.
drop policy if exists "izin_baca_sendiri" on public.izin_cuti;
drop policy if exists "izin_ajukan_sendiri" on public.izin_cuti;
drop policy if exists "izin_persetujuan_admin" on public.izin_cuti;
drop policy if exists "izin_admin_kelola" on public.izin_cuti;
drop policy if exists "izin_baca_terkait" on public.izin_cuti;

-- Pegawai hanya melihat barisnya sendiri. Kepala ruangan melihat unitnya,
-- Super Admin melihat semua. Anggota lain dalam grup Dinas tidak otomatis
-- dapat melihat baris pegawai lain.
create policy "izin_baca_terkait" on public.izin_cuti
  for select to authenticated
  using (public.bisa_akses_izin(user_id));

-- Sengaja TIDAK ADA policy insert/update/delete untuk izin_cuti.
-- Semua penulisan hanya lewat RPC SECURITY DEFINER di bawah.
-- Baca tetap diizinkan (RLS membatasi baris), tulis/truncate dicabut total.
revoke all on table public.izin_cuti from public, anon, authenticated;
grant select on table public.izin_cuti to authenticated;

drop policy if exists "pegawai_baca_profil_sendiri" on public.pegawai;
create policy "pegawai_baca_profil_sendiri" on public.pegawai
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (public.is_kepala_ruangan() and unit_kerja = public.unit_saya())
  );

-- --------------------------------------------------------------------------
-- 6. Storage: bucket privat dokumen-izin
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dokumen-izin',
  'dokumen-izin',
  false,
  1048576,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dokumen_izin_unggah" on storage.objects;
create policy "dokumen_izin_unggah" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dokumen-izin'
    and (public.is_superadmin() or public.is_kepala_ruangan())
  );

drop policy if exists "dokumen_izin_baca" on storage.objects;
create policy "dokumen_izin_baca" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dokumen-izin'
    and public.bisa_baca_dokumen(name)
  );

drop policy if exists "dokumen_izin_hapus" on storage.objects;
create policy "dokumen_izin_hapus" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dokumen-izin'
    and (owner::text = auth.uid()::text or public.is_superadmin())
    and public.bisa_hapus_dokumen(name)
  );

-- --------------------------------------------------------------------------
-- 7. RPC: catat / ubah / putuskan / batalkan per grup
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

  -- Serialisasi perubahan pada grup yang sama.
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

  if not public.is_superadmin() and exists (
    select 1
      from unnest(p_user_ids) as x
      join public.pegawai p on p.id = x
     where p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat mencatat pegawai dari unit kerja Anda.';
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

  if not public.is_superadmin() and exists (
    select 1
      from public.izin_cuti i
      join public.pegawai p on p.id = i.user_id
     where i.grup_id = p_grup_id
       and p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat mengubah pengajuan dari unit kerja Anda.';
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

  if not public.is_superadmin() and exists (
    select 1
      from unnest(p_user_ids) as x
      join public.pegawai p on p.id = x
     where p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat mencatat pegawai dari unit kerja Anda.';
  end if;

  -- Dokumen: gunakan file baru bila dikirim, selain itu pertahankan file lama.
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

  -- File baru sudah divalidasi di atas. Untuk dokumen lama Cuti yang hilang,
  -- jangan blokir penyimpanan karena dokumen Cuti bersifat opsional.
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

create or replace function public.putuskan_izin_grup(
  p_grup_id uuid,
  p_status text,
  p_catatan text default null
) returns jsonb
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_lama public.izin_cuti%rowtype;
  v_baris public.izin_cuti%rowtype;
  v_tgl date;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menyetujui atau menolak pengajuan.';
  end if;

  if p_status not in ('disetujui', 'ditolak') then
    raise exception 'Status persetujuan tidak valid.';
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
    raise exception 'Hanya pengajuan menunggu yang dapat diproses.';
  end if;

  -- Dokumen hanya diperiksa saat menyetujui Sakit/Dinas Luar. Penolakan atau
  -- Cuti (dokumen opsional) tetap boleh diproses meski file sudah hilang.
  if p_status = 'disetujui' and v_lama.jenis <> 'Cuti' then
    if v_lama.dokumen_path is null then
      raise exception 'Dokumen wajib ada sebelum Sakit/Dinas Luar disetujui.';
    else
      perform public.validasi_dokumen_izin(
        v_lama.dokumen_path,
        p_grup_id,
        v_lama.dokumen_tipe,
        v_lama.dokumen_ukuran
      );
    end if;
  end if;

  update public.izin_cuti
     set status = p_status,
         disetujui_oleh = auth.uid(),
         disetujui_pada = now(),
         catatan_admin = nullif(trim(p_catatan), '')
   where grup_id = p_grup_id;

  if p_status = 'disetujui' then
    for v_baris in
      select * from public.izin_cuti where grup_id = p_grup_id
    loop
      for v_tgl in
        select generate_series(
          v_baris.tanggal_mulai,
          v_baris.tanggal_selesai,
          interval '1 day'
        )::date
      loop
        insert into public.presensi (user_id, tanggal, status_kehadiran)
        values (v_baris.user_id, v_tgl, v_baris.jenis)
        on conflict (user_id, tanggal) do update
          set status_kehadiran = excluded.status_kehadiran
          where public.presensi.jam_masuk is null
            and public.presensi.dikoreksi_oleh is null;
      end loop;
    end loop;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'pesan', case
      when p_status = 'disetujui' then 'Pengajuan disetujui.'
      else 'Pengajuan ditolak.'
    end
  );
end;
$$;

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

  if not public.is_superadmin() and exists (
    select 1
      from public.izin_cuti i
      join public.pegawai p on p.id = i.user_id
     where i.grup_id = p_grup_id
       and p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat membatalkan pengajuan dari unit kerja Anda.';
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
-- 8. Hapus RPC lama & atur hak eksekusi
-- --------------------------------------------------------------------------

drop function if exists public.putuskan_izin(uuid, text, text);
drop function if exists public.bisa_akses_grup(uuid);

revoke execute on function public.is_kepala_ruangan() from public, anon;
revoke execute on function public.unit_saya() from public, anon;
revoke execute on function public.bisa_akses_izin(uuid) from public, anon;
revoke execute on function public.bisa_baca_dokumen(text) from public, anon;
revoke execute on function public.bisa_hapus_dokumen(text) from public, anon;
revoke execute on function public.validasi_dokumen_izin(text, uuid, text, bigint) from public, anon;
revoke execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.putuskan_izin_grup(uuid, text, text) from public, anon;
revoke execute on function public.batalkan_izin_grup(uuid, text) from public, anon;

grant execute on function public.is_kepala_ruangan() to authenticated;
grant execute on function public.unit_saya() to authenticated;
grant execute on function public.bisa_akses_izin(uuid) to authenticated;
grant execute on function public.bisa_baca_dokumen(text) to authenticated;
grant execute on function public.bisa_hapus_dokumen(text) to authenticated;
grant execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.putuskan_izin_grup(uuid, text, text) to authenticated;
grant execute on function public.batalkan_izin_grup(uuid, text) to authenticated;

commit;
