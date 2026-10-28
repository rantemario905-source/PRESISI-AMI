-- ==========================================================================
-- 22 - KEPALA UNIT MULTI-UNIT & KEPALA ASN TANPA BARIS PEGAWAI
-- Syarat: 01 s.d. 21 sudah dijalankan.
--
-- Ringkasan:
--   1. Tabel kepala_unit menjadi sumber kebenaran penugasan kepala.
--      Satu unit hanya satu kepala; satu kepala boleh banyak unit.
--   2. Kepala ASN tidak dicatat di public.pegawai (jumlah pegawai tetap),
--      tetapi tetap dapat login dan mengelola unit lewat kepala_unit.
--   3. pegawai.kepala_ruangan dipertahankan sebagai cache kompatibilitas dan
--      selalu disinkronkan dari kepala_unit.
--   4. Seluruh pengecekan unit kepala memakai unit_dikelola(), bukan
--      unit_saya(). unit_saya() tetap berarti unit tempat pegawai diabsen.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pegawai') is null
     or to_regclass('public.grup_shift') is null
     or to_regclass('public.presensi') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-21 pada project Supabase yang benar.';
  end if;
  if to_regclass('auth.users') is null then
    raise exception 'Skema auth.users tidak ditemukan. Pastikan project Supabase benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Tabel penugasan kepala unit
-- --------------------------------------------------------------------------

create table if not exists public.kepala_unit (
  user_id      uuid not null references auth.users (id) on delete cascade,
  unit_kerja   text not null references public.grup_shift (nama)
               on update cascade on delete restrict,
  nama_kepala  text,
  dibuat_pada  timestamptz not null default now(),
  primary key (user_id, unit_kerja),
  constraint kepala_unit_unit_kerja_unik unique (unit_kerja)
);

create index if not exists idx_kepala_unit_user on public.kepala_unit (user_id);

-- Backfill kepala lama. Index unik lama menjamin satu kepala per unit.
insert into public.kepala_unit (user_id, unit_kerja)
select p.id, p.unit_kerja
  from public.pegawai p
 where p.kepala_ruangan = true
   and p.role = 'pegawai'
on conflict do nothing;

-- Cache lama tidak lagi menjadi sumber kebenaran.
drop index if exists public.uq_kepala_ruangan_unit;

alter table public.kepala_unit enable row level security;
revoke all on table public.kepala_unit from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- 2. Trigger akun baru: kepala ASN tidak membuat baris pegawai
-- --------------------------------------------------------------------------

create or replace function public.handle_new_pegawai()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_unit text;
  v_jenis text;
begin
  v_jenis := lower(trim(coalesce(new.raw_user_meta_data ->> 'jenis_akun', '')));
  if v_jenis = 'kepala_asn' then
    return new;
  end if;

  v_unit := trim(coalesce(new.raw_user_meta_data ->> 'unit_kerja', 'Belum ditentukan'));
  if length(v_unit) < 2 then
    v_unit := 'Belum ditentukan';
  end if;

  insert into public.grup_shift (nama, seksi)
  values (v_unit, 'Belum ditentukan')
  on conflict (nama) do nothing;

  insert into public.pegawai (id, nama, unit_kerja, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(coalesce(new.email, 'Pegawai'), '@', 1)),
    v_unit,
    'pegawai'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- 3. Helper akses kepala unit
-- --------------------------------------------------------------------------

create or replace function public.is_kepala_ruangan()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kepala_unit where user_id = auth.uid()
  );
$$;

create or replace function public.unit_dikelola()
returns setof text
language sql stable security definer
set search_path = public
as $$
  select unit_kerja
    from public.kepala_unit
   where user_id = auth.uid()
   order by unit_kerja;
$$;

create or replace function public.bisa_kelola_unit(p_unit text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or exists (
        select 1
          from public.kepala_unit
         where user_id = auth.uid()
           and unit_kerja = trim(coalesce(p_unit, ''))
      );
$$;

-- --------------------------------------------------------------------------
-- 4. Profil & RPC pengelolaan kepala unit
-- --------------------------------------------------------------------------

create or replace function public.profil_saya()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  with saya as (
    select p.id, p.nama, p.unit_kerja, p.role, p.pola_kerja
      from public.pegawai p
     where p.id = auth.uid()
  ), akun as (
    select u.email, u.raw_user_meta_data
      from auth.users u
     where u.id = auth.uid()
  ), unit as (
    select coalesce(jsonb_agg(k.unit_kerja order by k.unit_kerja), '[]'::jsonb) as daftar
      from public.kepala_unit k
     where k.user_id = auth.uid()
  )
  select jsonb_build_object(
    'id', auth.uid(),
    'nama', coalesce(
      (select nama from saya),
      nullif(trim((select raw_user_meta_data ->> 'nama' from akun)), ''),
      split_part(coalesce((select email from akun), 'Pengguna'), '@', 1)
    ),
    'role', case
      when exists (select 1 from saya) then (select role from saya)
      when exists (select 1 from public.kepala_unit where user_id = auth.uid()) then 'kepala'
      else null
    end,
    'kepala_ruangan', exists (
      select 1 from public.kepala_unit where user_id = auth.uid()
    ),
    'unit_kerja', coalesce(
      (select unit_kerja from saya),
      (select min(unit_kerja) from public.kepala_unit where user_id = auth.uid()),
      ''
    ),
    'unit_dikelola', (select daftar from unit),
    'pola_kerja', coalesce((select pola_kerja from saya), 'shift'),
    'sumber_akun', case when exists (select 1 from saya) then 'pegawai' else 'kepala_asn' end
  );
$$;

create or replace function public.daftar_kepala_unit()
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_hasil jsonb;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat melihat daftar kepala unit.';
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'user_id', s.user_id,
               'nama', s.nama,
               'email', s.email,
               'jenis', case when s.is_asn then 'asn' else 'non_asn' end,
               'unit_dikelola', s.units
             )
             order by s.nama
           ),
           '[]'::jsonb
         )
    into v_hasil
    from (
      select k.user_id,
             coalesce(
               max(p.nama),
               max(k.nama_kepala),
               max(u.raw_user_meta_data ->> 'nama'),
               split_part(coalesce(max(u.email), ''), '@', 1)
             ) as nama,
             max(u.email) as email,
             bool_or(p.id is null) as is_asn,
             jsonb_agg(k.unit_kerja order by k.unit_kerja) as units
        from public.kepala_unit k
        left join public.pegawai p on p.id = k.user_id
        left join auth.users u on u.id = k.user_id
       group by k.user_id
    ) s;

  return v_hasil;
end;
$$;

create or replace function public.daftar_akun_kepala_asn()
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_hasil jsonb;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat melihat akun kepala ASN.';
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'user_id', u.id,
               'nama', coalesce(
                 nullif(trim(u.raw_user_meta_data ->> 'nama'), ''),
                 split_part(coalesce(u.email, ''), '@', 1)
               ),
               'email', u.email
             )
             order by u.email
           ),
           '[]'::jsonb
         )
    into v_hasil
    from auth.users u
   where lower(trim(coalesce(u.raw_user_meta_data ->> 'jenis_akun', ''))) = 'kepala_asn'
     and not exists (select 1 from public.pegawai p where p.id = u.id);

  return v_hasil;
end;
$$;

create or replace function public.simpan_kepala_unit(
  p_user_id uuid,
  p_units text[],
  p_nama text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_units text[];
  v_unit text;
  v_nama text;
  v_diganti text;
  v_is_asn boolean;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengatur kepala unit.';
  end if;

  if p_user_id is null then
    raise exception 'Akun kepala unit wajib dipilih.';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'Akun login tidak ditemukan.';
  end if;

  select coalesce(array_agg(distinct trim(x) order by trim(x)), '{}'::text[])
    into v_units
    from unnest(coalesce(p_units, '{}'::text[])) as x
   where length(trim(coalesce(x, ''))) >= 2;

  if exists (
    select 1
      from unnest(v_units) as u
     where not exists (select 1 from public.grup_shift g where g.nama = u)
  ) then
    raise exception 'Ada unit kerja yang tidak ditemukan di master grup shift.';
  end if;

  v_is_asn := not exists (select 1 from public.pegawai p where p.id = p_user_id);
  v_nama := nullif(trim(coalesce(p_nama, '')), '');

  if v_is_asn and v_nama is null then
    select nullif(trim(u.raw_user_meta_data ->> 'nama'), '')
      into v_nama
      from auth.users u
     where u.id = p_user_id;
  end if;

  if v_is_asn and v_nama is null and cardinality(v_units) > 0 then
    raise exception 'Nama kepala ASN wajib diisi.';
  end if;

  if not v_is_asn then
    v_nama := null;
  end if;

  if cardinality(v_units) > 0 then
    foreach v_unit in array v_units loop
      perform pg_advisory_xact_lock(hashtext('presisi-kepala-' || v_unit));
    end loop;

    select string_agg(
             coalesce(p.nama, k.nama_kepala, u.email, 'kepala lain'),
             ', ' order by 1
           )
      into v_diganti
      from public.kepala_unit k
      left join public.pegawai p on p.id = k.user_id
      left join auth.users u on u.id = k.user_id
     where k.unit_kerja = any(v_units)
       and k.user_id <> p_user_id;

    delete from public.kepala_unit
     where unit_kerja = any(v_units)
       and user_id <> p_user_id;
  else
    v_diganti := null;
  end if;

  delete from public.kepala_unit
   where user_id = p_user_id
     and unit_kerja <> all(v_units);

  if cardinality(v_units) > 0 then
    insert into public.kepala_unit (user_id, unit_kerja, nama_kepala)
    select p_user_id, u, v_nama
      from unnest(v_units) as u
    on conflict (user_id, unit_kerja) do update
      set nama_kepala = excluded.nama_kepala;
  end if;

  update public.pegawai p
     set kepala_ruangan = true
   where p.kepala_ruangan = false
     and exists (select 1 from public.kepala_unit k where k.user_id = p.id);

  update public.pegawai p
     set kepala_ruangan = false
   where p.kepala_ruangan = true
     and not exists (select 1 from public.kepala_unit k where k.user_id = p.id);

  return jsonb_build_object(
    'status', 'ok',
    'user_id', p_user_id,
    'unit_dikelola', to_jsonb(v_units),
    'kepala_diganti', v_diganti,
    'pesan', case
      when cardinality(v_units) = 0 then 'Penugasan kepala unit dihapus.'
      else 'Penugasan kepala unit disimpan.'
    end
  );
end;
$$;

create or replace function public.nama_kepala_unit(p_unit text)
returns text
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.nama
        from public.kepala_unit k
        join public.pegawai p on p.id = k.user_id
       where k.unit_kerja = trim(coalesce(p_unit, ''))
    ),
    (
      select nullif(trim(k.nama_kepala), '')
        from public.kepala_unit k
       where k.unit_kerja = trim(coalesce(p_unit, ''))
    ),
    ''
  );
$$;

revoke execute on function public.profil_saya() from public, anon;
revoke execute on function public.daftar_kepala_unit() from public, anon;
revoke execute on function public.daftar_akun_kepala_asn() from public, anon;
revoke execute on function public.simpan_kepala_unit(uuid, text[], text) from public, anon;
revoke execute on function public.nama_kepala_unit(text) from public, anon;
revoke execute on function public.is_kepala_ruangan() from public, anon;
revoke execute on function public.unit_dikelola() from public, anon;
revoke execute on function public.bisa_kelola_unit(text) from public, anon;

grant execute on function public.profil_saya() to authenticated;
grant execute on function public.daftar_kepala_unit() to authenticated;
grant execute on function public.daftar_akun_kepala_asn() to authenticated;
grant execute on function public.simpan_kepala_unit(uuid, text[], text) to authenticated;
grant execute on function public.nama_kepala_unit(text) to authenticated;
grant execute on function public.is_kepala_ruangan() to authenticated;
grant execute on function public.unit_dikelola() to authenticated;
grant execute on function public.bisa_kelola_unit(text) to authenticated;

-- --------------------------------------------------------------------------
-- 5. Fungsi akses lama yang memakai unit_saya() diganti unit_dikelola()
-- --------------------------------------------------------------------------

create or replace function public.bisa_akses_izin(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or p_user_id = auth.uid()
      or exists (
        select 1
          from public.pegawai target
         where target.id = p_user_id
           and exists (
             select 1
               from public.kepala_unit k
              where k.user_id = auth.uid()
                and k.unit_kerja = target.unit_kerja
           )
      );
$$;

create or replace function public.bisa_lihat_presensi(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or p_user_id = auth.uid()
      or exists (
        select 1
          from public.pegawai target
          join public.kepala_unit k
            on k.unit_kerja = target.unit_kerja
           and k.user_id = auth.uid()
         where target.id = p_user_id
      );
$$;

create or replace function public.bisa_kelola_jadwal(p_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or exists (
        select 1
          from public.pegawai target
          join public.kepala_unit k
            on k.unit_kerja = target.unit_kerja
           and k.user_id = auth.uid()
         where target.id = p_user
           and target.role = 'pegawai'
           and target.pola_kerja = 'shift'
      );
$$;

revoke execute on function public.bisa_akses_izin(uuid) from public, anon;
revoke execute on function public.bisa_lihat_presensi(uuid) from public, anon;
revoke execute on function public.bisa_kelola_jadwal(uuid) from public, anon;

grant execute on function public.bisa_akses_izin(uuid) to authenticated;
grant execute on function public.bisa_lihat_presensi(uuid) to authenticated;
grant execute on function public.bisa_kelola_jadwal(uuid) to authenticated;

-- --------------------------------------------------------------------------
-- 6. Policy RLS
-- --------------------------------------------------------------------------

drop policy if exists "pegawai_baca_profil_sendiri" on public.pegawai;
create policy "pegawai_baca_profil_sendiri" on public.pegawai
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (
      public.is_kepala_ruangan()
      and unit_kerja in (select public.unit_dikelola())
    )
  );

drop policy if exists "jadwal_baca_kepala_unit" on public.jadwal_shift;
create policy "jadwal_baca_kepala_unit" on public.jadwal_shift
  for select to authenticated
  using (
    public.is_kepala_ruangan()
    and exists (
      select 1
        from public.pegawai target
       where target.id = jadwal_shift.user_id
         and target.unit_kerja in (select public.unit_dikelola())
    )
  );

drop policy if exists "jadwal_kelola_kepala_unit" on public.jadwal_shift;
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

drop policy if exists "presensi_baca_kepala_unit" on public.presensi;
create policy "presensi_baca_kepala_unit" on public.presensi
  for select to authenticated
  using (public.bisa_lihat_presensi(user_id));

drop policy if exists "izin_baca_terkait" on public.izin_cuti;
create policy "izin_baca_terkait" on public.izin_cuti
  for select to authenticated
  using (public.bisa_akses_izin(user_id));

-- --------------------------------------------------------------------------
-- 7. RPC izin: cakupan unit yang dikelola
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

  if not public.is_superadmin() and exists (
    select 1
      from unnest(p_user_ids) as x
      join public.pegawai p on p.id = x
     where not public.bisa_kelola_unit(p.unit_kerja)
  ) then
    raise exception 'Anda hanya dapat mencatat pegawai dari unit yang Anda kelola.';
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

  if not public.is_superadmin() and exists (
    select 1
      from unnest(p_user_ids) as x
      join public.pegawai p on p.id = x
     where not public.bisa_kelola_unit(p.unit_kerja)
  ) then
    raise exception 'Anda hanya dapat mencatat pegawai dari unit yang Anda kelola.';
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

revoke execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.batalkan_izin_grup(uuid, text) from public, anon;
grant execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.batalkan_izin_grup(uuid, text) to authenticated;

-- --------------------------------------------------------------------------
-- 8. Impor jadwal: cakupan unit yang dikelola
-- --------------------------------------------------------------------------

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
       or not public.bisa_kelola_unit(v_unit) then
      raise exception 'Anda hanya dapat mengimpor jadwal unit yang Anda kelola.';
    end if;

    if v_periode < date_trunc('month', v_hari_ini)::date then
      raise exception 'Jadwal bulan yang sudah lewat hanya dapat diimpor Super Admin.';
    end if;
  end if;

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

-- --------------------------------------------------------------------------
-- 9. Grup shift: cegah hapus unit yang masih punya kepala
-- --------------------------------------------------------------------------

create or replace function public.hapus_grup_shift(p_nama text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_jumlah integer;
  v_kepala integer;
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

  select count(*)::int into v_kepala
    from public.kepala_unit k
   where k.unit_kerja = v_nama;

  if v_kepala > 0 then
    raise exception 'Grup "%" masih memiliki kepala unit. Lepas penugasan kepala terlebih dahulu.',
      v_nama;
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

-- --------------------------------------------------------------------------
-- 10. Data pegawai: status kepala hanya lewat tabel kepala_unit
-- --------------------------------------------------------------------------

create or replace function public.perbarui_pegawai_dan_jadwal(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_kepala_ruangan boolean,
  p_pola_kerja text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_unit text;
  v_pola text;
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

  perform pg_advisory_xact_lock(hashtext('presisi-kepala-' || v_unit));

  select * into v_lama
    from public.pegawai
   where id = p_id
   for update;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;
  if v_lama.role <> 'pegawai' then
    raise exception 'Hanya akun pegawai yang dapat diubah dari menu ini.';
  end if;
  if not exists (select 1 from public.grup_shift g where g.nama = v_unit) then
    raise exception 'Grup shift "%" tidak ditemukan. Tambahkan grup terlebih dahulu.', v_unit;
  end if;

  v_pola := lower(trim(coalesce(nullif(p_pola_kerja, ''), v_lama.pola_kerja, 'shift')));
  if v_pola not in ('shift', 'reguler') then
    raise exception 'Pola kerja tidak valid. Pilih Shift atau Reguler.';
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = v_unit,
         pola_kerja = v_pola,
         kepala_ruangan = exists (
           select 1 from public.kepala_unit k where k.user_id = p_id
         )
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'kepala_ruangan', exists (
      select 1 from public.kepala_unit k where k.user_id = p_id
    ),
    'pola_kerja', v_pola,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text)
  from public, anon;
grant execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text)
  to authenticated;

commit;
