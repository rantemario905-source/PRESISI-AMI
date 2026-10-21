-- ==========================================================================
-- 07 — RPC ADMIN, POLICY TAMBAHAN, REALTIME
-- Syarat: 01 s.d. 06 sudah dijalankan.
--
-- File ini menambahkan:
--   1. Policy admin untuk izin/cuti (input & persetujuan)
--   2. RPC setujui/tolak/reset perangkat (kebijakan 1 perangkat aktif)
--   3. RPC koreksi presensi + audit trail wajib alasan
--   4. RPC putuskan izin/cuti (otomatis mencatat ke presensi)
--   5. Realtime untuk pemantauan presensi
--   6. Versi terbaru submit_presensi (menggantikan versi di 05_rpc.sql)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. Policy tambahan
-- --------------------------------------------------------------------------

-- Admin boleh mencatat surat izin atas nama pegawai & memprosesnya
drop policy if exists "izin_admin_kelola" on public.izin_cuti;
create policy "izin_admin_kelola" on public.izin_cuti
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- --------------------------------------------------------------------------
-- 2. RPC: Perangkat
-- --------------------------------------------------------------------------

create or replace function public.setujui_perangkat(p_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menyetujui perangkat.';
  end if;

  select user_id into v_user from public.perangkat where id = p_id;
  if v_user is null then
    raise exception 'Pengajuan perangkat tidak ditemukan.';
  end if;

  -- Kebijakan 1 perangkat aktif: cabut persetujuan perangkat lama
  update public.perangkat
     set status = 'rejected',
         catatan = 'Digantikan perangkat baru yang disetujui Admin IT'
   where user_id = v_user
     and status = 'approved'
     and id <> p_id;

  update public.perangkat
     set status = 'approved',
         disetujui_pada = now(),
         disetujui_oleh = auth.uid(),
         catatan = null
   where id = p_id;

  return jsonb_build_object('status', 'ok', 'pesan', 'Perangkat disetujui.');
end;
$$;

create or replace function public.tolak_perangkat(p_id uuid, p_catatan text default null)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menolak perangkat.';
  end if;

  update public.perangkat
     set status = 'rejected',
         disetujui_pada = now(),
         disetujui_oleh = auth.uid(),
         catatan = coalesce(nullif(trim(p_catatan), ''), 'Ditolak Admin IT')
   where id = p_id;

  if not found then
    raise exception 'Pengajuan perangkat tidak ditemukan.';
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Pengajuan perangkat ditolak.');
end;
$$;

create or replace function public.reset_perangkat(p_user_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mereset perangkat.';
  end if;

  update public.perangkat
     set status = 'rejected',
         disetujui_pada = null,
         disetujui_oleh = null,
         catatan = 'Direset Admin IT — pegawai dapat mengajukan perangkat baru'
   where user_id = p_user_id
     and status in ('approved', 'pending');

  return jsonb_build_object('status', 'ok', 'pesan', 'Perangkat telah direset.');
end;
$$;

-- --------------------------------------------------------------------------
-- 3. RPC: Koreksi Presensi (wajib alasan + audit trail)
-- --------------------------------------------------------------------------

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

  if p_status not in ('Hadir', 'Izin', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi') then
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

-- --------------------------------------------------------------------------
-- 4. RPC: Putuskan Izin / Cuti / Dinas Luar
-- --------------------------------------------------------------------------
-- Saat disetujui, otomatis membuat/menandai baris presensi pada rentang
-- tanggal izin (tanpa menimpa presensi yang sudah ada jam masuknya).

create or replace function public.putuskan_izin(
  p_id uuid,
  p_status text,
  p_catatan text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_izin public.izin_cuti%rowtype;
  v_tgl date;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat memproses pengajuan izin.';
  end if;

  if p_status not in ('disetujui', 'ditolak') then
    raise exception 'Status persetujuan tidak valid.';
  end if;

  select * into v_izin from public.izin_cuti where id = p_id;
  if not found then
    raise exception 'Pengajuan izin tidak ditemukan.';
  end if;

  update public.izin_cuti
     set status = p_status,
         disetujui_oleh = auth.uid(),
         disetujui_pada = now(),
         catatan_admin = nullif(trim(p_catatan), '')
   where id = p_id;

  if p_status = 'disetujui' then
    for v_tgl in
      select generate_series(v_izin.tanggal_mulai, v_izin.tanggal_selesai, interval '1 day')::date
    loop
      insert into public.presensi (user_id, tanggal, status_kehadiran)
      values (v_izin.user_id, v_tgl, v_izin.jenis)
      on conflict (user_id, tanggal) do update
        set status_kehadiran = excluded.status_kehadiran
        where public.presensi.jam_masuk is null;
    end loop;
  else
    -- Bila sebelumnya disetujui lalu ditolak, hapus penanda otomatis
    delete from public.presensi
     where user_id = v_izin.user_id
       and tanggal between v_izin.tanggal_mulai and v_izin.tanggal_selesai
       and jam_masuk is null
       and status_kehadiran = v_izin.jenis;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'pesan', case when p_status = 'disetujui' then 'Pengajuan disetujui.' else 'Pengajuan ditolak.' end
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 5. Versi terbaru submit_presensi (menggantikan versi 05_rpc.sql)
-- --------------------------------------------------------------------------
-- Perbaikan: jika sudah ada baris presensi hari itu tanpa jam masuk
-- (mis. hasil persetujuan izin), absen masuk akan MENGISI baris tersebut
-- alih-alih gagal karena unique constraint (user_id, tanggal).

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

  select status into v_status
    from public.perangkat
   where user_id = v_user and device_token = p_device_token;

  if v_status is null then
    raise exception 'Perangkat ini belum terdaftar. Ajukan verifikasi perangkat terlebih dahulu.';
  end if;
  if v_status <> 'approved' then
    raise exception 'Perangkat Anda sedang menunggu persetujuan Admin IT. Tombol absen terkunci.';
  end if;

  if coalesce(p_is_mocked, false) or p_akurasi is null or p_akurasi <= 0 then
    raise exception 'Terdeteksi menggunakan Fake GPS / Mock Location. Absensi dibatalkan.';
  end if;

  if p_akurasi > 50 then
    raise exception 'Akurasi GPS tidak wajar (% m). Coba lagi di ruang terbuka.', round(p_akurasi)::text;
  end if;

  select public.haversine(-0.23861315731059254, 117.41485548535888, p_lat, p_lng)
    into v_jarak;

  if v_jarak > 100 then
    raise exception 'Anda berada di luar radius 100 meter dari RSUD AMI. Jarak Anda saat ini % meter.',
      round(v_jarak)::text;
  end if;

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
    on conflict (user_id, tanggal) do update
      set jam_masuk    = excluded.jam_masuk,
          lokasi_masuk = excluded.lokasi_masuk,
          jarak_masuk  = excluded.jarak_masuk,
          status_kehadiran = 'Hadir',
          device_token = excluded.device_token
      where public.presensi.jam_masuk is null
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Anda sudah melakukan absen masuk hari ini.';
    end if;

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

-- --------------------------------------------------------------------------
-- 6. Realtime untuk pemantauan presensi
-- --------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.presensi;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- --------------------------------------------------------------------------
-- 7. Hak eksekusi fungsi
-- --------------------------------------------------------------------------

revoke execute on function public.setujui_perangkat(uuid) from public, anon;
revoke execute on function public.tolak_perangkat(uuid, text) from public, anon;
revoke execute on function public.reset_perangkat(uuid) from public, anon;
revoke execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) from public, anon;
revoke execute on function public.putuskan_izin(uuid, text, text) from public, anon;

grant execute on function public.setujui_perangkat(uuid) to authenticated;
grant execute on function public.tolak_perangkat(uuid, text) to authenticated;
grant execute on function public.reset_perangkat(uuid) to authenticated;
grant execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) to authenticated;
grant execute on function public.putuskan_izin(uuid, text, text) to authenticated;
