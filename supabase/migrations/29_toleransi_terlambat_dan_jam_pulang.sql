-- ==========================================================================
-- 29 - TOLERANSI KETERLAMBATAN & JAM PULANG TEPAT WAKTU
-- Syarat: 01 s.d. 28 sudah dijalankan.
--
-- Ringkasan:
--   1. Keterlambatan dihitung per menit penuh (floor), bukan dibulatkan ke
--      atas: masuk pukul 08.00.59 masih 0 menit; 08.01.00 = 1 menit.
--      Sebelumnya 08.00.01 sudah dihitung 1 menit.
--   2. Absen pulang dibuka tepat pada jam pulang jadwal (mis. 16.30 sudah
--      bisa absen pulang), bukan 1 menit setelahnya. Batas akhir tetap
--      2 jam setelah jam pulang.
--   3. Berlaku untuk pola Reguler maupun Shift, termasuk shift malam lintas
--      hari, dan untuk koreksi presensi (hitung_menit_terlambat).
--   Nilai klien yang sepadan ada di src/config/constants.js
--   (MENIT_JEDA_ABSEN_PULANG = 0).
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.presensi') is null
     or to_regclass('public.perangkat') is null
     or to_regclass('public.pegawai') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-28 pada project Supabase yang benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Koreksi presensi: keterlambatan per menit penuh
-- --------------------------------------------------------------------------

create or replace function public.hitung_menit_terlambat(
  p_user uuid,
  p_tanggal date,
  p_waktu timestamptz
) returns integer
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_jadwal record;
  v_mulai timestamptz;
  v_menit integer;
begin
  if p_waktu is null then
    return 0;
  end if;

  select * into v_jadwal
    from public.jadwal_kerja(p_user, p_tanggal);

  if not found
     or not coalesce(v_jadwal.terjadwal, false)
     or v_jadwal.jam_mulai is null then
    return 0;
  end if;

  v_mulai := public.waktu_wita(p_tanggal, v_jadwal.jam_mulai);
  if p_waktu <= v_mulai then
    return 0;
  end if;

  v_menit := floor(extract(epoch from (p_waktu - v_mulai)) / 60.0)::int;
  return greatest(v_menit, 0);
end;
$$;

revoke execute on function public.hitung_menit_terlambat(uuid, date, timestamptz) from public, anon;
grant execute on function public.hitung_menit_terlambat(uuid, date, timestamptz) to authenticated;

-- --------------------------------------------------------------------------
-- 2. Absensi: toleransi keterlambatan & jendela pulang
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

      -- Toleransi: 08.00.59 masih 0 menit; 08.01.00 dihitung 1 menit.
      if v_waktu > v_mulai then
        v_menit := floor(extract(epoch from (v_waktu - v_mulai)) / 60.0)::int;
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

    -- Jendela absen pulang: dibuka tepat pada jam pulang dan ditutup 2 jam
    -- setelah jam pulang (shift malam dihitung lintas hari).
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

      if v_waktu < v_selesai then
        raise exception 'Absen pulang baru dapat dilakukan mulai pukul % WITA (jam pulang).',
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

commit;
