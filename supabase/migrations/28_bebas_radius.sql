-- ==========================================================================
-- 28 - PENGECUALIAN RADIUS UNTUK PEGAWAI TERTENTU
-- Syarat: 01 s.d. 27 sudah dijalankan.
--
-- Ringkasan:
--   1. Menambahkan kolom `pegawai.bebas_radius` (default false). Hanya
--      Super Admin yang dapat mengubahnya lewat RPC data pegawai.
--   2. `submit_presensi` tetap menghitung dan menyimpan jarak, tetapi hanya
--      menolak radius 50 m bila `bebas_radius = false`. Validasi perangkat,
--      anti Fake GPS, akurasi GPS, jadwal, dan jendela waktu TIDAK berubah.
--   3. `profil_saya()` mengirim status `bebas_radius` agar klien dapat
--      menyesuaikan tampilan tanpa menjadi sumber kebenaran.
--   4. Perubahan status dicatat pada `bebas_radius_diubah_pada` dan
--      `bebas_radius_diubah_oleh` untuk audit.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pegawai') is null
     or to_regclass('public.presensi') is null
     or to_regclass('public.perangkat') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-27 pada project Supabase yang benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Kolom pengecualian radius + jejak audit
-- --------------------------------------------------------------------------

alter table public.pegawai
  add column if not exists bebas_radius boolean not null default false;

alter table public.pegawai
  add column if not exists bebas_radius_diubah_pada timestamptz;

alter table public.pegawai
  add column if not exists bebas_radius_diubah_oleh uuid references auth.users (id) on delete set null;

comment on column public.pegawai.bebas_radius is
  'Bila true, pegawai boleh absen di luar radius 50 m (mis. pegawai yang diizinkan absen dari rumah). Validasi lain tetap berlaku.';

-- --------------------------------------------------------------------------
-- 2. submit_presensi memakai pengecualian radius
-- --------------------------------------------------------------------------

create or replace function public.submit_presensi(
  p_device_token text,
  p_tipe text,
  p_lat double precision,
  p_lng double precision,
  p_akurasi double precision,
  p_is_mocked boolean default false
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hari date := (now() at time zone 'Asia/Makassar')::date;
  v_waktu timestamptz := now();
  v_status text;
  v_jarak double precision;
  v_bebas_radius boolean := false;
  v_row public.presensi%rowtype;
  v_jadwal record;
  v_jadwal_kemarin record;
  v_tanggal_kerja date := v_hari;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_batas_pulang timestamptz;
  v_menit integer := 0;
begin
  if v_user is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;
  if p_tipe not in ('masuk', 'pulang') then
    raise exception 'Jenis absensi tidak dikenal.';
  end if;

  -- Validasi perangkat
  select status into v_status
    from public.perangkat
   where user_id = v_user and device_token = p_device_token;

  if v_status is null then
    raise exception 'Perangkat ini belum terdaftar. Ajukan verifikasi perangkat terlebih dahulu.';
  end if;
  if v_status <> 'approved' then
    raise exception 'Perangkat Anda sedang menunggu persetujuan Admin IT. Tombol absen terkunci.';
  end if;

  -- Anti Fake GPS
  if coalesce(p_is_mocked, false) or p_akurasi is null or p_akurasi <= 0 then
    raise exception 'Terdeteksi menggunakan Fake GPS / Mock Location. Absensi dibatalkan.';
  end if;
  if p_akurasi > 50 then
    raise exception 'Akurasi GPS tidak wajar (% m). Coba lagi di ruang terbuka.', round(p_akurasi)::text;
  end if;

  -- Pengecualian radius hanya berlaku bila diaktifkan Super Admin.
  select coalesce(p.bebas_radius, false)
    into v_bebas_radius
    from public.pegawai p
   where p.id = v_user;

  select public.haversine(-0.23805651650343132, 117.41442516465149, p_lat, p_lng)
    into v_jarak;
  if v_jarak > 50 and not coalesce(v_bebas_radius, false) then
    raise exception 'Anda berada di luar radius 50 meter dari RSUD AMI. Jarak Anda saat ini % meter.',
      round(v_jarak)::text;
  end if;

  if p_tipe = 'masuk' then
    select * into v_jadwal from public.jadwal_kerja(v_user, v_hari);

    -- Shift malam yang dimulai kemarin masih berlangsung setelah tengah malam.
    if v_jadwal.pola_kerja = 'shift' and not v_jadwal.terjadwal then
      select * into v_jadwal_kemarin from public.jadwal_kerja(v_user, v_hari - 1);
      if v_jadwal_kemarin.pola_kerja = 'shift'
         and v_jadwal_kemarin.terjadwal
         and v_jadwal_kemarin.jam_mulai is not null
         and v_jadwal_kemarin.jam_selesai is not null
         and v_jadwal_kemarin.jam_selesai <= v_jadwal_kemarin.jam_mulai then
        v_selesai := public.waktu_wita(v_hari - 1, v_jadwal_kemarin.jam_selesai) + interval '1 day';
        if v_waktu <= v_selesai then
          v_tanggal_kerja := v_hari - 1;
          v_jadwal := v_jadwal_kemarin;
        end if;
      end if;
    end if;

    if not coalesce(v_jadwal.boleh_absen, false) then
      raise exception '%', coalesce(v_jadwal.pesan_jadwal, 'Anda tidak dijadwalkan untuk absensi hari ini.');
    end if;

    if coalesce(v_jadwal.terjadwal, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then
      v_mulai := public.waktu_wita(v_tanggal_kerja, v_jadwal.jam_mulai);
      v_selesai := public.waktu_wita(v_tanggal_kerja, v_jadwal.jam_selesai);
      if v_jadwal.jam_selesai <= v_jadwal.jam_mulai then
        v_selesai := v_selesai + interval '1 day';
      end if;

      -- Batas awal absen masuk: 1 jam sebelum jam masuk.
      if v_waktu < v_mulai - interval '1 hour' then
        raise exception 'Absen masuk baru dapat dilakukan mulai pukul % WITA (1 jam sebelum jam masuk %).',
          to_char((v_mulai - interval '1 hour') at time zone 'Asia/Makassar', 'HH24:MI'),
          to_char(v_mulai at time zone 'Asia/Makassar', 'HH24:MI');
      end if;

      if v_waktu > v_selesai then
        raise exception 'Jam kerja Anda sudah berakhir. Absensi tidak dapat dilakukan.';
      end if;

      if v_waktu > v_mulai then
        v_menit := ceil(extract(epoch from (v_waktu - v_mulai)) / 60.0)::int;
      else
        v_menit := 0;
      end if;
    end if;

    select * into v_row
      from public.presensi
     where user_id = v_user and tanggal = v_tanggal_kerja
     for update;

    if found then
      if v_row.jam_masuk is not null then
        raise exception 'Anda sudah melakukan absen masuk pada hari kerja tersebut.';
      end if;
      if v_row.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar') then
        raise exception 'Anda tercatat % pada hari kerja tersebut. Absensi tidak dapat dilakukan.',
          v_row.status_kehadiran;
      end if;
      if v_row.status_kehadiran = 'Koreksi' or v_row.dikoreksi_oleh is not null then
        raise exception 'Presensi pada hari kerja tersebut sudah dikoreksi oleh Super Admin.';
      end if;

      update public.presensi
         set jam_masuk = v_waktu,
             lokasi_masuk = jsonb_build_object(
               'lat', p_lat,
               'lng', p_lng,
               'akurasi', round(p_akurasi::numeric, 1),
               'bebas_radius', coalesce(v_bebas_radius, false),
               'di_luar_radius', v_jarak > 50
             ),
             jarak_masuk = round(v_jarak::numeric, 1),
             status_kehadiran = 'Hadir',
             menit_terlambat = v_menit,
             device_token = p_device_token
       where id = v_row.id
       returning * into v_row;
    else
      insert into public.presensi
        (user_id, tanggal, jam_masuk, lokasi_masuk, jarak_masuk,
         status_kehadiran, menit_terlambat, device_token)
      values
        (v_user, v_tanggal_kerja, v_waktu,
         jsonb_build_object(
           'lat', p_lat,
           'lng', p_lng,
           'akurasi', round(p_akurasi::numeric, 1),
           'bebas_radius', coalesce(v_bebas_radius, false),
           'di_luar_radius', v_jarak > 50
         ),
         round(v_jarak::numeric, 1), 'Hadir', v_menit, p_device_token)
      returning * into v_row;
    end if;
  else
    -- Checkout: cari presensi terbuka hari ini atau shift malam kemarin.
    select * into v_row
      from public.presensi
     where user_id = v_user
       and jam_masuk is not null
       and jam_pulang is null
       and tanggal >= v_hari - 1
     order by tanggal desc
     limit 1
     for update;

    if not found then
      if exists (
        select 1 from public.presensi
         where user_id = v_user and tanggal = v_hari and jam_masuk is null
      ) then
        raise exception 'Anda belum melakukan absen masuk. Silakan absen hadir terlebih dahulu.';
      end if;
      raise exception 'Tidak ada presensi terbuka yang dapat dipulangkan. Hubungi Super Admin bila presensi Anda terlewat.';
    end if;

    -- Jendela absen pulang: mulai 1 menit setelah jam pulang dan ditutup
    -- 2 jam setelah jam pulang (shift malam dihitung lintas hari).
    select * into v_jadwal from public.jadwal_kerja(v_user, v_row.tanggal);
    if coalesce(v_jadwal.terjadwal, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then
      v_mulai := public.waktu_wita(v_row.tanggal, v_jadwal.jam_mulai);
      v_selesai := public.waktu_wita(v_row.tanggal, v_jadwal.jam_selesai);
      if v_jadwal.jam_selesai <= v_jadwal.jam_mulai then
        v_selesai := v_selesai + interval '1 day';
      end if;

      v_batas_pulang := v_selesai + interval '2 hours';

      if v_waktu < v_selesai + interval '1 minute' then
        raise exception 'Absen pulang baru dapat dilakukan mulai pukul % WITA (setelah jam pulang %).',
          to_char((v_selesai + interval '1 minute') at time zone 'Asia/Makassar', 'HH24:MI'),
          to_char(v_selesai at time zone 'Asia/Makassar', 'HH24:MI');
      end if;

      if v_waktu >= v_batas_pulang then
        raise exception 'Batas absen pulang untuk presensi % sudah terlewat (maksimal % WITA, 2 jam setelah jam pulang). Ajukan koreksi presensi kepada Super Admin.',
          to_char(v_row.tanggal, 'DD-MM-YYYY'),
          to_char(v_batas_pulang at time zone 'Asia/Makassar', 'DD-MM-YYYY HH24:MI');
      end if;
    end if;

    update public.presensi
       set jam_pulang = v_waktu,
           lokasi_pulang = jsonb_build_object(
             'lat', p_lat,
             'lng', p_lng,
             'akurasi', round(p_akurasi::numeric, 1),
             'bebas_radius', coalesce(v_bebas_radius, false),
             'di_luar_radius', v_jarak > 50
           ),
           jarak_pulang = round(v_jarak::numeric, 1)
     where id = v_row.id
     returning * into v_row;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'tipe', p_tipe,
    'tanggal', v_row.tanggal,
    'waktu', case when p_tipe = 'masuk' then v_row.jam_masuk else v_row.jam_pulang end,
    'jarak', round(v_jarak::numeric, 1),
    'bebas_radius', coalesce(v_bebas_radius, false),
    'di_luar_radius', v_jarak > 50,
    'menit_terlambat', coalesce(v_row.menit_terlambat, 0),
    'pesan', case
      when p_tipe = 'masuk' and coalesce(v_row.menit_terlambat, 0) > 0
        then 'Absen hadir berhasil dicatat. Terlambat ' || v_row.menit_terlambat || ' menit.'
      when p_tipe = 'masuk' then 'Absen hadir berhasil dicatat.'
      else 'Absen pulang berhasil dicatat.'
    end
  );
end;
$$;

revoke execute on function public.submit_presensi(text, text, double precision, double precision, double precision, boolean)
  from public, anon;
grant execute on function public.submit_presensi(text, text, double precision, double precision, double precision, boolean)
  to authenticated;

-- --------------------------------------------------------------------------
-- 3. Profil menyertakan status pengecualian radius
-- --------------------------------------------------------------------------

create or replace function public.profil_saya()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  with saya as (
    select p.id, p.nama, p.unit_kerja, p.role, p.pola_kerja, p.bebas_radius
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
    'bebas_radius', coalesce((select bebas_radius from saya), false),
    'sumber_akun', case when exists (select 1 from saya) then 'pegawai' else 'kepala_asn' end
  );
$$;

-- --------------------------------------------------------------------------
-- 4. Super Admin dapat mengubah pengecualian radius dari Data Pegawai
-- --------------------------------------------------------------------------

drop function if exists public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text);

create or replace function public.perbarui_pegawai_dan_jadwal(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_kepala_ruangan boolean,
  p_pola_kerja text,
  p_bebas_radius boolean default false
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_unit text;
  v_pola text;
  v_bebas boolean := coalesce(p_bebas_radius, false);
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
         bebas_radius = v_bebas,
         bebas_radius_diubah_pada = case
           when bebas_radius is distinct from v_bebas then now()
           else bebas_radius_diubah_pada
         end,
         bebas_radius_diubah_oleh = case
           when bebas_radius is distinct from v_bebas then auth.uid()
           else bebas_radius_diubah_oleh
         end,
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
    'bebas_radius', v_bebas,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text, boolean)
  from public, anon;
grant execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text, boolean)
  to authenticated;

commit;
