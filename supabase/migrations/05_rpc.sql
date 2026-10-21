-- ==========================================================================
-- 05 — RPC SUBMIT PRESENSI
-- Syarat: 01, 02, 03, 04 sudah sukses.
-- Ini "gerbang tunggal" penulisan presensi dengan validasi server-side.
-- ==========================================================================

create or replace function public.submit_presensi(
  p_device_token text,
  p_tipe text,               -- 'masuk' | 'pulang'
  p_lat double precision,
  p_lng double precision,
  p_akurasi double precision,
  p_is_mocked boolean default false
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_hari    date := (now() at time zone 'Asia/Makassar')::date;
  v_waktu   timestamptz := now();
  v_status  text;
  v_jarak   double precision;
  v_row     public.presensi%rowtype;
begin
  if v_user is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;

  if p_tipe not in ('masuk', 'pulang') then
    raise exception 'Jenis absensi tidak dikenal.';
  end if;

  -- (b) Validasi device binding
  select status into v_status
    from public.perangkat
   where user_id = v_user and device_token = p_device_token;

  if v_status is null then
    raise exception 'Perangkat ini belum terdaftar. Ajukan verifikasi perangkat terlebih dahulu.';
  end if;
  if v_status <> 'approved' then
    raise exception 'Perangkat Anda sedang menunggu persetujuan Admin IT. Tombol absen terkunci.';
  end if;

  -- (c) Anti Fake GPS / Mock Location (dihitung ulang di server)
  if coalesce(p_is_mocked, false) or p_akurasi is null or p_akurasi <= 0 then
    raise exception 'Terdeteksi menggunakan Fake GPS / Mock Location. Absensi dibatalkan.';
  end if;

  -- (d) Akurasi GPS tidak wajar
  if p_akurasi > 50 then
    raise exception 'Akurasi GPS tidak wajar (% m). Coba lagi di ruang terbuka.', round(p_akurasi)::text;
  end if;

  -- (e) Radius 100 meter — Haversine server-side
  select public.haversine(-0.23861315731059254, 117.41485548535888, p_lat, p_lng)
    into v_jarak;

  if v_jarak > 100 then
    raise exception 'Anda berada di luar radius 100 meter dari RSUD AMI. Jarak Anda saat ini % meter.',
      round(v_jarak)::text;
  end if;

  -- (f) Absen masuk
  if p_tipe = 'masuk' then
    if exists (
      select 1 from public.presensi
       where user_id = v_user and tanggal = v_hari and jam_masuk is not null
    ) then
      raise exception 'Anda sudah melakukan absen masuk hari ini.';
    end if;

    insert into public.presensi
      (user_id, tanggal, jam_masuk, lokasi_masuk, jarak_masuk, status_kehadiran, device_token)
    values
      (v_user, v_hari, v_waktu,
       jsonb_build_object('lat', p_lat, 'lng', p_lng, 'akurasi', round(p_akurasi::numeric, 1)),
       round(v_jarak::numeric, 1), 'Hadir', p_device_token)
    returning * into v_row;

  -- (f) Absen pulang
  else
    update public.presensi
       set jam_pulang    = v_waktu,
           lokasi_pulang = jsonb_build_object('lat', p_lat, 'lng', p_lng, 'akurasi', round(p_akurasi::numeric, 1)),
           jarak_pulang  = round(v_jarak::numeric, 1)
     where user_id = v_user
       and tanggal = v_hari
       and jam_masuk is not null
       and jam_pulang is null
    returning * into v_row;

    if v_row.id is null then
      if exists (
        select 1 from public.presensi
         where user_id = v_user and tanggal = v_hari and jam_masuk is null
      ) then
        raise exception 'Anda belum melakukan absen masuk. Silakan absen hadir terlebih dahulu.';
      end if;
      raise exception 'Anda sudah melakukan absen pulang hari ini.';
    end if;
  end if;

  return jsonb_build_object(
    'status'  , 'ok',
    'tipe'    , p_tipe,
    'tanggal' , v_hari,
    'waktu'   , case when p_tipe = 'masuk' then v_row.jam_masuk else v_row.jam_pulang end,
    'jarak'   , round(v_jarak::numeric, 1),
    'pesan'   , case
                  when p_tipe = 'masuk' then 'Absen hadir berhasil dicatat.'
                  else 'Absen pulang berhasil dicatat.'
                end
  );
end;
$$;

-- Hanya role authenticated yang boleh memanggil RPC (anon tidak)
revoke execute on function public.submit_presensi(text, text, double precision, double precision, double precision, boolean)
  from public, anon;
grant execute on function public.submit_presensi(text, text, double precision, double precision, double precision, boolean)
  to authenticated;

revoke execute on function public.haversine(double precision, double precision, double precision, double precision)
  from anon;
