-- ==========================================================================
-- 33 - PENGADUAN PRESENSI (ABSEN PULANG TERLEWAT)
-- Syarat: 01 s.d. 32 sudah dijalankan.
--
-- Ringkasan:
--   1. Pegawai (reguler/shift) dapat mengadukan presensi yang sudah memiliki
--      jam masuk tetapi belum memiliki jam pulang, maksimal 7 hari setelah
--      tanggal presensi. Setiap pengaduan wajib disertai alasan dan foto bukti.
--   2. Kepala unit yang mengelola unit pegawai menyetujui/menolak pengaduan.
--      Super Admin hanya dapat melihat riwayat (tanpa menyetujui).
--   3. Persetujuan mengisi jam pulang presensi dan mengubah status menjadi
--      "Koreksi". Riwayat lengkap tersimpan di pengaduan_presensi.
--   4. Foto bukti memakai bucket privat `dokumen-izin` dengan prefix
--      `pengaduan/<user_id>/`.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pegawai') is null
     or to_regclass('public.presensi') is null
     or to_regclass('public.kepala_unit') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-32 pada project Supabase yang benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Tabel pengaduan presensi
-- --------------------------------------------------------------------------

create table if not exists public.pengaduan_presensi (
  id                    uuid primary key default gen_random_uuid(),
  presensi_id           uuid not null references public.presensi (id) on delete cascade,
  user_id               uuid not null references public.pegawai (id) on delete cascade,
  tanggal               date not null,
  jam_pulang_diajukan   timestamptz not null,
  jam_pulang_disetujui  timestamptz,
  alasan                text not null,
  dokumen_path          text not null,
  status                text not null default 'menunggu'
                        check (status in ('menunggu', 'disetujui', 'ditolak')),
  diputuskan_oleh       uuid references auth.users (id) on delete set null,
  diputuskan_pada       timestamptz,
  catatan_admin         text,
  dibuat_pada           timestamptz not null default now(),
  constraint pengaduan_alasan_min check (char_length(btrim(alasan)) >= 10)
);

create unique index if not exists pengaduan_satu_menunggu
  on public.pengaduan_presensi (presensi_id)
  where status = 'menunggu';

create index if not exists idx_pengaduan_user
  on public.pengaduan_presensi (user_id, dibuat_pada desc);

create index if not exists idx_pengaduan_status
  on public.pengaduan_presensi (status, dibuat_pada desc);

-- --------------------------------------------------------------------------
-- 2. RLS pengaduan
-- --------------------------------------------------------------------------

alter table public.pengaduan_presensi enable row level security;
revoke all on table public.pengaduan_presensi from public, anon, authenticated;
grant select on table public.pengaduan_presensi to authenticated;

drop policy if exists "pengaduan_baca" on public.pengaduan_presensi;
create policy "pengaduan_baca" on public.pengaduan_presensi
  for select to authenticated
  using (
    public.is_superadmin()
    or user_id = auth.uid()
    or (
      public.is_kepala_ruangan()
      and exists (
        select 1
          from public.pegawai p
         where p.id = pengaduan_presensi.user_id
           and public.bisa_kelola_unit(p.unit_kerja)
      )
    )
  );

-- --------------------------------------------------------------------------
-- 3. Validasi foto bukti pengaduan
-- --------------------------------------------------------------------------

create or replace function public.validasi_dokumen_pengaduan(
  p_path text,
  p_user_id uuid,
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
  if p_path is null or length(trim(p_path)) = 0 then
    raise exception 'Foto bukti pengaduan wajib diunggah.';
  end if;

  if split_part(p_path, '/', 1) <> 'pengaduan'
     or split_part(p_path, '/', 2) <> p_user_id::text then
    raise exception 'Path foto pengaduan tidak valid.';
  end if;

  select o.metadata ->> 'mimetype',
         nullif(o.metadata ->> 'size', '')::bigint
    into v_mime, v_size
    from storage.objects o
   where o.bucket_id = 'dokumen-izin'
     and o.name = p_path;

  if not found then
    raise exception 'Foto bukti tidak ditemukan di storage. Unggah ulang foto.';
  end if;

  if v_mime is null then
    v_mime := p_tipe;
  end if;
  if v_mime = 'image/jpg' then
    v_mime := 'image/jpeg';
  end if;
  if v_mime not in ('image/jpeg', 'image/png') then
    raise exception 'Foto bukti harus berupa JPG/JPEG atau PNG.';
  end if;

  v_size := coalesce(v_size, p_ukuran);
  if v_size is null or v_size <= 0 or v_size > 1048576 then
    raise exception 'Ukuran foto bukti maksimal 1 MB.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 4. Perluas akses dokumen untuk pengaduan
-- --------------------------------------------------------------------------

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
      from public.pengaduan_presensi q
      join public.pegawai p on p.id = q.user_id
     where q.dokumen_path = p_path
       and (
         q.user_id = auth.uid()
         or public.is_superadmin()
         or public.bisa_kelola_unit(p.unit_kerja)
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
       and not exists (
         select 1 from public.pengaduan_presensi q where q.dokumen_path = p_path
       )
  );
$$;

create or replace function public.bisa_hapus_dokumen(p_path text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or (
        not exists (
          select 1 from public.izin_cuti i where i.dokumen_path = p_path
        )
        and not exists (
          select 1 from public.pengaduan_presensi q where q.dokumen_path = p_path
        )
      );
$$;

drop policy if exists "dokumen_pengaduan_unggah" on storage.objects;
create policy "dokumen_pengaduan_unggah" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dokumen-izin'
    and split_part(name, '/', 1) = 'pengaduan'
    and split_part(name, '/', 2) = auth.uid()::text
  );

-- --------------------------------------------------------------------------
-- 5. RPC: ajukan pengaduan
-- --------------------------------------------------------------------------

create or replace function public.ajukan_pengaduan_presensi(
  p_presensi_id uuid,
  p_jam_pulang timestamptz,
  p_alasan text,
  p_dokumen_path text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_presensi public.presensi%rowtype;
  v_hari_ini date;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  if p_alasan is null or char_length(btrim(p_alasan)) < 10 then
    raise exception 'Alasan pengaduan wajib diisi minimal 10 karakter.';
  end if;

  if p_jam_pulang is null then
    raise exception 'Jam pulang wajib diisi.';
  end if;

  select * into v_presensi
    from public.presensi
   where id = p_presensi_id
     and user_id = v_uid
   for update;

  if not found then
    raise exception 'Data presensi tidak ditemukan atau bukan milik Anda.';
  end if;

  if v_presensi.jam_masuk is null then
    raise exception 'Pengaduan hanya untuk presensi yang sudah memiliki jam masuk.';
  end if;

  if v_presensi.jam_pulang is not null then
    raise exception 'Presensi ini sudah memiliki jam pulang.';
  end if;

  if v_presensi.status_kehadiran not in ('Hadir', 'Koreksi') then
    raise exception 'Presensi dengan status % tidak dapat diadukan.', v_presensi.status_kehadiran;
  end if;

  v_hari_ini := (now() at time zone 'Asia/Makassar')::date;

  if v_presensi.tanggal > v_hari_ini then
    raise exception 'Presensi tanggal mendatang tidak dapat diadukan.';
  end if;

  if v_presensi.tanggal < v_hari_ini - 7 then
    raise exception 'Batas pengaduan 7 hari setelah tanggal presensi sudah terlewat.';
  end if;

  if p_jam_pulang <= v_presensi.jam_masuk then
    raise exception 'Jam pulang harus setelah jam masuk.';
  end if;

  if p_jam_pulang > now() then
    raise exception 'Jam pulang tidak boleh melewati waktu sekarang.';
  end if;

  if exists (
    select 1
      from public.pengaduan_presensi
     where presensi_id = p_presensi_id
       and status = 'menunggu'
  ) then
    raise exception 'Sudah ada pengaduan menunggu untuk presensi ini.';
  end if;

  perform public.validasi_dokumen_pengaduan(p_dokumen_path, v_uid);

  insert into public.pengaduan_presensi (
    presensi_id, user_id, tanggal,
    jam_pulang_diajukan, alasan, dokumen_path
  ) values (
    v_presensi.id, v_uid, v_presensi.tanggal,
    p_jam_pulang, btrim(p_alasan), trim(p_dokumen_path)
  )
  returning id into v_id;

  return jsonb_build_object(
    'status', 'ok',
    'id', v_id,
    'pesan', 'Pengaduan terkirim dan menunggu persetujuan Kepala Unit.'
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 6. RPC: keputusan kepala unit
-- --------------------------------------------------------------------------

create or replace function public.putuskan_pengaduan_presensi(
  p_id uuid,
  p_setuju boolean,
  p_jam_pulang timestamptz default null,
  p_catatan text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_q public.pengaduan_presensi%rowtype;
  v_p public.presensi%rowtype;
  v_unit text;
  v_nama text;
  v_jam timestamptz;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  if not public.is_kepala_ruangan() then
    raise exception 'Hanya Kepala Unit yang dapat memutuskan pengaduan.';
  end if;

  select * into v_q
    from public.pengaduan_presensi
   where id = p_id
   for update;

  if not found then
    raise exception 'Pengaduan tidak ditemukan.';
  end if;

  if v_q.status <> 'menunggu' then
    raise exception 'Pengaduan ini sudah diputuskan.';
  end if;

  if v_q.user_id = v_uid then
    raise exception 'Anda tidak dapat menyetujui pengaduan sendiri.';
  end if;

  select unit_kerja into v_unit
    from public.pegawai
   where id = v_q.user_id;

  if not public.bisa_kelola_unit(v_unit) then
    raise exception 'Anda tidak mengelola unit pegawai pengadu.';
  end if;

  select * into v_p
    from public.presensi
   where id = v_q.presensi_id
   for update;

  if not found then
    raise exception 'Data presensi pengaduan tidak ditemukan.';
  end if;

  select coalesce(
           pg.nama,
           nullif(trim(u.raw_user_meta_data ->> 'nama'), ''),
           split_part(coalesce(u.email, ''), '@', 1)
         )
    into v_nama
    from auth.users u
    left join public.pegawai pg on pg.id = u.id
   where u.id = v_uid;

  if p_setuju then
    if v_p.jam_pulang is not null then
      raise exception 'Presensi ini sudah memiliki jam pulang.';
    end if;

    v_jam := coalesce(p_jam_pulang, v_q.jam_pulang_diajukan);

    if v_jam is null or v_jam <= v_p.jam_masuk then
      raise exception 'Jam pulang harus setelah jam masuk.';
    end if;

    if v_jam > now() then
      raise exception 'Jam pulang tidak boleh melewati waktu sekarang.';
    end if;

    update public.presensi
       set jam_pulang = v_jam,
           status_kehadiran = 'Koreksi',
           dikoreksi_oleh = (select id from public.pegawai where id = v_uid),
           alasan_koreksi = 'Pengaduan disetujui oleh ' || coalesce(v_nama, 'Kepala Unit')
             || ': ' || v_q.alasan
             || coalesce(' | ' || nullif(btrim(p_catatan), ''), '')
     where id = v_p.id;

    update public.pengaduan_presensi
       set status = 'disetujui',
           jam_pulang_disetujui = v_jam,
           diputuskan_oleh = v_uid,
           diputuskan_pada = now(),
           catatan_admin = nullif(btrim(p_catatan), '')
     where id = p_id;

    return jsonb_build_object(
      'status', 'ok',
      'keputusan', 'disetujui',
      'pesan', 'Pengaduan disetujui. Jam pulang presensi sudah diperbarui.'
    );
  end if;

  if p_catatan is null or char_length(btrim(p_catatan)) < 5 then
    raise exception 'Catatan penolakan wajib diisi minimal 5 karakter.';
  end if;

  update public.pengaduan_presensi
     set status = 'ditolak',
         diputuskan_oleh = v_uid,
         diputuskan_pada = now(),
         catatan_admin = btrim(p_catatan)
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'keputusan', 'ditolak',
    'pesan', 'Pengaduan ditolak. Presensi tidak diubah.'
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 7. RPC: daftar pengaduan (sesuai peran)
-- --------------------------------------------------------------------------

create or replace function public.daftar_pengaduan_presensi(
  p_unit text default null,
  p_status text default null,
  p_saya boolean default false
) returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hasil jsonb;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  select coalesce(
           jsonb_agg(to_jsonb(x) order by x.dibuat_pada desc),
           '[]'::jsonb
         )
    into v_hasil
    from (
      select q.id,
             q.presensi_id,
             q.user_id,
             q.tanggal,
             q.jam_pulang_diajukan,
             q.jam_pulang_disetujui,
             q.alasan,
             q.dokumen_path,
             q.status,
             q.diputuskan_oleh,
             q.diputuskan_pada,
             q.catatan_admin,
             q.dibuat_pada,
             pr.jam_masuk,
             pr.jam_pulang,
             pr.status_kehadiran,
             p.nama as pegawai_nama,
             p.unit_kerja,
             p.pola_kerja,
             coalesce(
               pemutus.nama,
               nullif(trim(u.raw_user_meta_data ->> 'nama'), ''),
               split_part(coalesce(u.email, ''), '@', 1)
             ) as pemutus_nama
        from public.pengaduan_presensi q
        join public.pegawai p on p.id = q.user_id
        join public.presensi pr on pr.id = q.presensi_id
        left join public.pegawai pemutus on pemutus.id = q.diputuskan_oleh
        left join auth.users u on u.id = q.diputuskan_oleh
       where case
               when p_saya then q.user_id = v_uid
               when public.is_superadmin() then true
               when public.is_kepala_ruangan() then public.bisa_kelola_unit(p.unit_kerja)
               else q.user_id = v_uid
             end
         and (
               p_unit is null
               or btrim(p_unit) = ''
               or btrim(p_unit) = 'semua'
               or p.unit_kerja = btrim(p_unit)
             )
         and (
               p_status is null
               or btrim(p_status) = ''
               or btrim(p_status) = 'semua'
               or q.status = btrim(p_status)
             )
    ) x;

  return v_hasil;
end;
$$;

-- --------------------------------------------------------------------------
-- 8. Hak eksekusi
-- --------------------------------------------------------------------------

revoke execute on function public.validasi_dokumen_pengaduan(text, uuid, text, bigint) from public, anon;
revoke execute on function public.ajukan_pengaduan_presensi(uuid, timestamptz, text, text) from public, anon;
revoke execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text) from public, anon;
revoke execute on function public.daftar_pengaduan_presensi(text, text, boolean) from public, anon;

grant execute on function public.validasi_dokumen_pengaduan(text, uuid, text, bigint) to authenticated;
grant execute on function public.ajukan_pengaduan_presensi(uuid, timestamptz, text, text) to authenticated;
grant execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text) to authenticated;
grant execute on function public.daftar_pengaduan_presensi(text, text, boolean) to authenticated;

commit;
