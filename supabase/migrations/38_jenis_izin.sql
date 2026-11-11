-- ==========================================================================
-- 38 - JENIS KETIDAKHADIRAN IZIN
-- Syarat: 01 s.d. 37 sudah dijalankan.
--
-- Ringkasan:
--   1. Menghidupkan kembali jenis `Izin` pada izin_cuti dan presensi.
--   2. Izin mengikuti aturan Sakit/Cuti: satu pegawai, dokumen wajib, dan
--      persetujuan Super Admin. Super Admin yang mencatat langsung disetujui.
--   3. Server menolak absensi, Alfa otomatis, dan pengaduan pada hari berstatus
--      Izin, sehingga tidak menimpa status yang sudah disetujui.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.izin_cuti') is null
     or to_regclass('public.presensi') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-37 pada project Supabase yang benar.';
  end if;
end;
$$;

alter table public.izin_cuti drop constraint if exists izin_cuti_jenis_check;
alter table public.izin_cuti
  add constraint izin_cuti_jenis_check
  check (jenis in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin'));

alter table public.presensi drop constraint if exists presensi_status_kehadiran_check;
alter table public.presensi
  add constraint presensi_status_kehadiran_check
  check (status_kehadiran in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Izin', 'Alfa', 'Koreksi'));

-- --------------------------------------------------------------------------
-- RPC yang diperbarui agar mengenali jenis Izin
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

  if p_jenis not in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin') then
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
  if p_jenis in ('Sakit', 'Cuti', 'Izin') and v_jumlah <> 1 then
    raise exception 'Sakit, Cuti, dan Izin hanya untuk satu pegawai.';
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
     and p_jenis in ('Sakit', 'Cuti', 'Izin')
     and exists (
       select 1
         from unnest(p_user_ids) as x
         join public.pegawai p on p.id = x
        where not public.bisa_kelola_unit(p.unit_kerja)
     ) then
    raise exception 'Sakit, Cuti, dan Izin hanya untuk pegawai dari unit yang Anda kelola.';
  end if;

  if exists (select 1 from public.izin_cuti where grup_id = p_grup_id) then
    raise exception 'ID grup sudah dipakai. Muat ulang halaman lalu coba lagi.';
  end if;

  if p_jenis <> 'Cuti' and v_path is null then
    raise exception 'Dokumen wajib diunggah untuk Sakit, Dinas Luar, dan Izin.';
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

  if p_jenis not in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin') then
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
  if p_jenis in ('Sakit', 'Cuti', 'Izin') and v_jumlah <> 1 then
    raise exception 'Sakit, Cuti, dan Izin hanya untuk satu pegawai.';
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
     and p_jenis in ('Sakit', 'Cuti', 'Izin')
     and exists (
       select 1
         from unnest(p_user_ids) as x
         join public.pegawai p on p.id = x
        where not public.bisa_kelola_unit(p.unit_kerja)
     ) then
    raise exception 'Sakit, Cuti, dan Izin hanya untuk pegawai dari unit yang Anda kelola.';
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
    raise exception 'Dokumen wajib ada untuk Sakit, Dinas Luar, dan Izin.';
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
      if v_row.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin') then
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

    -- Jendela absen pulang: dibuka tepat pada jam pulang dan ditutup
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

create or replace function public.proses_alfa_otomatis(
  p_tanggal date default null
) returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_sekarang timestamptz := now();
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
  v_target date;
  v_aktif boolean := false;
  v_mulai date;
  v_row record;
  v_selesai timestamptz;
  v_baris integer;
  v_jumlah integer := 0;
begin
  if auth.uid() is not null and not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menjalankan proses Alfa.';
  end if;

  select k.alfa_otomatis, k.alfa_mulai
    into v_aktif, v_mulai
    from public.pengaturan_presensi k
   where k.id = 1;

  if not coalesce(v_aktif, false) then
    return 0;
  end if;

  for v_target in
    select d
      from unnest(
        case
          when p_tanggal is null then array[v_hari_ini, v_hari_ini - 1]::date[]
          else array[p_tanggal]::date[]
        end
      ) as d
  loop
    if v_target > v_hari_ini then
      continue;
    end if;
    if v_mulai is not null and v_target < v_mulai then
      continue;
    end if;

    -- Pegawai reguler: hanya hari kerja dan bukan hari libur.
    for v_row in
      select p.id as user_id,
             coalesce(u.jam_mulai, j.jam_mulai) as jam_mulai,
             coalesce(u.jam_selesai, j.jam_selesai) as jam_selesai
        from public.pegawai p
        join public.jam_kerja_reguler j
          on j.hari = extract(isodow from v_target)::int
        left join public.jam_kerja_unit u
          on u.unit_kerja = p.unit_kerja
         and u.hari = extract(isodow from v_target)::int
       where p.role = 'pegawai'
         and p.pola_kerja = 'reguler'
         and not coalesce(u.libur, j.libur)
         and not exists (
           select 1 from public.hari_libur h where h.tanggal = v_target
         )
         and not exists (
           select 1
             from public.presensi pr
            where pr.user_id = p.id
              and pr.tanggal = v_target
              and (
                pr.jam_masuk is not null
                or pr.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin', 'Koreksi')
              )
         )
    loop
      v_selesai := public.waktu_wita(v_target, v_row.jam_selesai);
      if v_selesai <= v_sekarang then
        insert into public.presensi (user_id, tanggal, status_kehadiran)
        values (v_row.user_id, v_target, 'Alfa')
        on conflict (user_id, tanggal) do nothing;
        get diagnostics v_baris = row_count;
        v_jumlah := v_jumlah + v_baris;
      end if;
    end loop;

    -- Pegawai shift: hanya tanggal yang memiliki jadwal.
    for v_row in
      select p.id as user_id, js.tanggal, sm.jam_mulai, sm.jam_selesai
        from public.jadwal_shift js
        join public.pegawai p on p.id = js.user_id
        join public.shift_master sm on sm.id = js.shift_id
       where js.tanggal = v_target
         and p.role = 'pegawai'
         and p.pola_kerja = 'shift'
         and not exists (
           select 1
             from public.presensi pr
            where pr.user_id = js.user_id
              and pr.tanggal = js.tanggal
              and (
                pr.jam_masuk is not null
                or pr.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin', 'Koreksi')
              )
         )
    loop
      v_selesai := public.waktu_wita(v_row.tanggal, v_row.jam_selesai);
      if v_row.jam_selesai <= v_row.jam_mulai then
        v_selesai := v_selesai + interval '1 day';
      end if;

      if v_selesai <= v_sekarang then
        insert into public.presensi (user_id, tanggal, status_kehadiran)
        values (v_row.user_id, v_row.tanggal, 'Alfa')
        on conflict (user_id, tanggal) do nothing;
        get diagnostics v_baris = row_count;
        v_jumlah := v_jumlah + v_baris;
      end if;
    end loop;
  end loop;

  return v_jumlah;
end;
$$;

revoke execute on function public.proses_alfa_otomatis(date) from public, anon;
grant execute on function public.proses_alfa_otomatis(date) to authenticated;

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
  v_menit integer := 0;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengoreksi presensi.';
  end if;
  if p_alasan is null or length(trim(p_alasan)) < 5 then
    raise exception 'Alasan koreksi wajib diisi (minimal 5 karakter).';
  end if;
  if p_status not in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Izin', 'Alfa', 'Koreksi') then
    raise exception 'Status kehadiran tidak valid.';
  end if;

  select * into v_lama from public.presensi where id = p_presensi_id;
  if not found then
    raise exception 'Data presensi tidak ditemukan.';
  end if;

  if p_status = 'Hadir' and p_jam_masuk is not null then
    v_menit := public.hitung_menit_terlambat(v_lama.user_id, v_lama.tanggal, p_jam_masuk);
  else
    v_menit := 0;
  end if;

  update public.presensi
     set jam_masuk = p_jam_masuk,
         jam_pulang = p_jam_pulang,
         status_kehadiran = p_status,
         menit_terlambat = v_menit,
         dikoreksi_oleh = auth.uid(),
         alasan_koreksi = trim(p_alasan)
   where id = p_presensi_id;

  insert into public.koreksi_presensi
    (presensi_id, admin_id, kolom_koreksi, nilai_lama, nilai_baru, alasan)
  values (
    p_presensi_id,
    auth.uid(),
    'jam_masuk,jam_pulang,status_kehadiran,menit_terlambat',
    jsonb_build_object(
      'jam_masuk', v_lama.jam_masuk,
      'jam_pulang', v_lama.jam_pulang,
      'status_kehadiran', v_lama.status_kehadiran,
      'menit_terlambat', v_lama.menit_terlambat
    ),
    jsonb_build_object(
      'jam_masuk', p_jam_masuk,
      'jam_pulang', p_jam_pulang,
      'status_kehadiran', p_status,
      'menit_terlambat', v_menit
    ),
    trim(p_alasan)
  );

  return jsonb_build_object(
    'status', 'ok',
    'menit_terlambat', v_menit,
    'pesan', 'Koreksi presensi tersimpan.'
  );
end;
$$;

revoke execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) to authenticated;

create or replace function public.ajukan_pengaduan_presensi(
  p_jenis text,
  p_tanggal date,
  p_jam timestamptz,
  p_alasan text,
  p_dokumen_path text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_jenis text := lower(btrim(coalesce(p_jenis, '')));
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
  v_batas_awal date := date '2026-11-01';
  v_p public.presensi%rowtype;
  v_jadwal record;
  v_buka timestamptz;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_ada boolean := false;
  v_koreksi boolean := false;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  if v_jenis not in ('masuk', 'pulang') then
    raise exception 'Jenis pengaduan tidak valid.';
  end if;

  if p_tanggal is null then
    raise exception 'Tanggal pengaduan wajib diisi.';
  end if;

  if p_alasan is null or char_length(btrim(p_alasan)) < 10 then
    raise exception 'Alasan pengaduan wajib diisi minimal 10 karakter.';
  end if;

  if p_jam is null then
    raise exception '% wajib diisi.',
      case when v_jenis = 'masuk' then 'Jam masuk' else 'Jam pulang' end;
  end if;

  if p_tanggal < v_batas_awal then
    raise exception 'Pengaduan hanya berlaku untuk tanggal sejak 1 November 2026.';
  end if;

  if p_tanggal > v_hari_ini then
    raise exception 'Tanggal mendatang tidak dapat diadukan.';
  end if;

  if p_tanggal < v_hari_ini - 7 then
    raise exception 'Batas pengaduan 7 hari setelah tanggal presensi sudah terlewat.';
  end if;

  if p_jam > now() then
    raise exception 'Jam tidak boleh melewati waktu sekarang.';
  end if;

  if exists (
    select 1
      from public.pengaduan_presensi
     where user_id = v_uid
       and tanggal = p_tanggal
       and jenis = v_jenis
       and status = 'menunggu'
  ) then
    raise exception 'Sudah ada pengaduan menunggu untuk tanggal dan jenis ini.';
  end if;

  perform public.validasi_dokumen_pengaduan(p_dokumen_path, v_uid);

  -- ------------------------------------------------------------------
  -- Absen pulang
  -- ------------------------------------------------------------------
  if v_jenis = 'pulang' then
    select * into v_p
      from public.presensi
     where user_id = v_uid
       and tanggal = p_tanggal
     for update;

    if not found then
      raise exception 'Data presensi tidak ditemukan atau bukan milik Anda.';
    end if;

    if v_p.jam_masuk is null then
      raise exception 'Pengaduan absen pulang hanya untuk presensi yang sudah memiliki jam masuk.';
    end if;

    if v_p.jam_pulang is not null then
      raise exception 'Presensi ini sudah memiliki jam pulang.';
    end if;

    if v_p.status_kehadiran not in ('Hadir', 'Koreksi') then
      raise exception 'Presensi dengan status % tidak dapat diadukan.', v_p.status_kehadiran;
    end if;

    if p_jam <= v_p.jam_masuk then
      raise exception 'Jam pulang harus setelah jam masuk.';
    end if;

    insert into public.pengaduan_presensi (
      presensi_id, user_id, tanggal, jenis,
      jam_pulang_diajukan, alasan, dokumen_path
    ) values (
      v_p.id, v_uid, p_tanggal, 'pulang',
      p_jam, btrim(p_alasan), trim(p_dokumen_path)
    )
    returning id into v_id;

    return jsonb_build_object(
      'status', 'ok',
      'id', v_id,
      'jenis', 'pulang',
      'pesan', 'Pengaduan absen pulang terkirim dan menunggu persetujuan Kepala Unit.'
    );
  end if;

  -- ------------------------------------------------------------------
  -- Absen masuk / koreksi jam masuk
  -- ------------------------------------------------------------------
  select * into v_jadwal from public.jadwal_kerja(v_uid, p_tanggal);

  if not found or not coalesce(v_jadwal.boleh_absen, false) then
    raise exception 'Tidak ada jadwal kerja pada tanggal tersebut.';
  end if;

  if v_jadwal.jam_mulai is null or v_jadwal.jam_selesai is null then
    raise exception 'Jadwal kerja tanggal tersebut tidak lengkap.';
  end if;

  v_mulai := public.waktu_wita(p_tanggal, v_jadwal.jam_mulai);
  v_selesai := public.waktu_wita(p_tanggal, v_jadwal.jam_selesai);
  if v_jadwal.jam_selesai <= v_jadwal.jam_mulai then
    v_selesai := v_selesai + interval '1 day';
  end if;
  v_buka := v_mulai - interval '60 minutes';

  if p_jam < v_buka or p_jam > v_selesai then
    raise exception 'Jam masuk di luar jendela absen (% - %).',
      to_char(v_buka at time zone 'Asia/Makassar', 'HH24:MI'),
      to_char(v_selesai at time zone 'Asia/Makassar', 'HH24:MI');
  end if;

  select * into v_p
    from public.presensi
   where user_id = v_uid
     and tanggal = p_tanggal
   for update;
  v_ada := found;

  if v_ada then
    if v_p.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin') then
      raise exception 'Anda tercatat % pada tanggal tersebut.', v_p.status_kehadiran;
    end if;

    if v_p.dikoreksi_oleh is not null then
      raise exception 'Presensi pada tanggal tersebut sudah dikoreksi.';
    end if;

    if v_p.jam_masuk is not null then
      if v_p.status_kehadiran <> 'Hadir' then
        raise exception 'Presensi dengan status % tidak dapat dikoreksi lewat pengaduan.',
          v_p.status_kehadiran;
      end if;
      if p_jam >= v_p.jam_masuk then
        raise exception 'Jam masuk yang diajukan harus lebih awal dari jam tercatat (% WITA).',
          to_char(v_p.jam_masuk at time zone 'Asia/Makassar', 'HH24:MI');
      end if;
      v_koreksi := true;
    elsif v_p.status_kehadiran = 'Koreksi' then
      raise exception 'Presensi pada tanggal tersebut sudah dikoreksi.';
    end if;
  end if;

  insert into public.pengaduan_presensi (
    presensi_id, user_id, tanggal, jenis,
    jam_masuk_diajukan, alasan, dokumen_path
  ) values (
    case when v_ada then v_p.id else null end,
    v_uid, p_tanggal, 'masuk',
    p_jam, btrim(p_alasan), trim(p_dokumen_path)
  )
  returning id into v_id;

  return jsonb_build_object(
    'status', 'ok',
    'id', v_id,
    'jenis', 'masuk',
    'koreksi', v_koreksi,
    'pesan', case
      when v_koreksi then 'Pengaduan koreksi jam masuk terkirim dan menunggu persetujuan Kepala Unit.'
      else 'Pengaduan absen masuk terkirim dan menunggu persetujuan Kepala Unit.'
    end
  );
end;
$$;

create or replace function public.putuskan_pengaduan_presensi(
  p_id uuid,
  p_setuju boolean,
  p_jam_masuk timestamptz default null,
  p_jam_pulang timestamptz default null,
  p_catatan text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_super boolean := public.is_superadmin();
  v_batas_awal date := date '2026-11-01';
  v_q public.pengaduan_presensi%rowtype;
  v_p public.presensi%rowtype;
  v_unit text;
  v_nama text;
  v_jam timestamptz;
  v_jadwal record;
  v_buka timestamptz;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_menit integer := 0;
  v_ada boolean := false;
  v_koreksi boolean := false;
  v_pid uuid;
  v_alasan text;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  if not (v_super or public.is_kepala_ruangan()) then
    raise exception 'Hanya Kepala Unit atau Super Admin yang dapat memutuskan pengaduan.';
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

  if v_q.tanggal < v_batas_awal then
    raise exception 'Pengaduan tanggal sebelum 1 November 2026 tidak dapat diproses.';
  end if;

  if v_q.user_id = v_uid then
    raise exception 'Anda tidak dapat menyetujui pengaduan sendiri.';
  end if;

  if not v_super then
    select unit_kerja into v_unit
      from public.pegawai
     where id = v_q.user_id;

    if not public.bisa_kelola_unit(v_unit) then
      raise exception 'Anda tidak mengelola unit pegawai pengadu.';
    end if;
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

  -- ------------------------------------------------------------------
  -- Tolak
  -- ------------------------------------------------------------------
  if not p_setuju then
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
  end if;

  -- ------------------------------------------------------------------
  -- Setujui: absen masuk / koreksi jam masuk
  -- ------------------------------------------------------------------
  if v_q.jenis = 'masuk' then
    v_jam := coalesce(p_jam_masuk, v_q.jam_masuk_diajukan);

    if v_jam is null then
      raise exception 'Jam masuk wajib diisi.';
    end if;

    if v_jam > now() then
      raise exception 'Jam masuk tidak boleh melewati waktu sekarang.';
    end if;

    select * into v_jadwal from public.jadwal_kerja(v_q.user_id, v_q.tanggal);

    if not found
       or not coalesce(v_jadwal.boleh_absen, false)
       or v_jadwal.jam_mulai is null
       or v_jadwal.jam_selesai is null then
      raise exception 'Jadwal kerja pegawai pada tanggal tersebut tidak ditemukan.';
    end if;

    v_mulai := public.waktu_wita(v_q.tanggal, v_jadwal.jam_mulai);
    v_selesai := public.waktu_wita(v_q.tanggal, v_jadwal.jam_selesai);
    if v_jadwal.jam_selesai <= v_jadwal.jam_mulai then
      v_selesai := v_selesai + interval '1 day';
    end if;
    v_buka := v_mulai - interval '60 minutes';

    if v_jam < v_buka or v_jam > v_selesai then
      raise exception 'Jam masuk di luar jendela absen (% - %).',
        to_char(v_buka at time zone 'Asia/Makassar', 'HH24:MI'),
        to_char(v_selesai at time zone 'Asia/Makassar', 'HH24:MI');
    end if;

    select * into v_p
      from public.presensi
     where user_id = v_q.user_id
       and tanggal = v_q.tanggal
     for update;
    v_ada := found;

    if v_ada then
      if v_p.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Izin') then
        raise exception 'Pegawai tercatat % pada tanggal tersebut.', v_p.status_kehadiran;
      end if;

      if v_p.dikoreksi_oleh is not null then
        raise exception 'Presensi pada tanggal tersebut sudah dikoreksi.';
      end if;

      if v_p.jam_masuk is not null then
        if v_p.status_kehadiran <> 'Hadir' then
          raise exception 'Presensi dengan status % tidak dapat dikoreksi.', v_p.status_kehadiran;
        end if;
        if v_jam >= v_p.jam_masuk then
          raise exception 'Jam masuk yang disetujui harus lebih awal dari jam tercatat (% WITA).',
            to_char(v_p.jam_masuk at time zone 'Asia/Makassar', 'HH24:MI');
        end if;
        v_koreksi := true;
      end if;
    end if;

    v_menit := public.hitung_menit_terlambat(v_q.user_id, v_q.tanggal, v_jam);
    v_alasan := case when v_koreksi then 'Koreksi jam masuk disetujui oleh '
                     else 'Pengaduan absen masuk disetujui oleh ' end
      || coalesce(v_nama, 'Kepala Unit') || ': ' || v_q.alasan
      || coalesce(' | ' || nullif(btrim(p_catatan), ''), '');

    if v_ada then
      v_pid := v_p.id;
      update public.presensi
         set jam_masuk = v_jam,
             status_kehadiran = case when v_koreksi then 'Koreksi' else 'Hadir' end,
             menit_terlambat = v_menit,
             dikoreksi_oleh = (select id from public.pegawai where id = v_uid),
             alasan_koreksi = v_alasan
       where id = v_p.id;
    else
      insert into public.presensi (
        user_id, tanggal, jam_masuk, status_kehadiran,
        menit_terlambat, dikoreksi_oleh, alasan_koreksi
      ) values (
        v_q.user_id, v_q.tanggal, v_jam, 'Hadir',
        v_menit, (select id from public.pegawai where id = v_uid), v_alasan
      )
      returning id into v_pid;
    end if;

    update public.pengaduan_presensi
       set status = 'disetujui',
           presensi_id = v_pid,
           jam_masuk_disetujui = v_jam,
           diputuskan_oleh = v_uid,
           diputuskan_pada = now(),
           catatan_admin = nullif(btrim(p_catatan), '')
     where id = p_id;

    return jsonb_build_object(
      'status', 'ok',
      'keputusan', 'disetujui',
      'jenis', 'masuk',
      'koreksi', v_koreksi,
      'menit_terlambat', v_menit,
      'pesan', case
        when v_koreksi then 'Pengaduan disetujui. Jam masuk presensi sudah dikoreksi.'
        else 'Pengaduan disetujui. Jam masuk presensi sudah diperbarui.'
      end
    );
  end if;

  -- ------------------------------------------------------------------
  -- Setujui: absen pulang
  -- ------------------------------------------------------------------
  select * into v_p
    from public.presensi
   where id = v_q.presensi_id
   for update;

  if not found then
    raise exception 'Data presensi pengaduan tidak ditemukan.';
  end if;

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
    'jenis', 'pulang',
    'pesan', 'Pengaduan disetujui. Jam pulang presensi sudah diperbarui.'
  );
end;
$$;

create or replace function public.kandidat_pengaduan_presensi()
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
  v_batas_awal date := date '2026-11-01';
  v_hasil jsonb := '[]'::jsonb;
  v_jadwal record;
  v_p public.presensi%rowtype;
  v_ada boolean := false;
  v_i integer;
  v_tgl date;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  for v_i in 0..7 loop
    v_tgl := v_hari_ini - v_i;

    if v_tgl < v_batas_awal then
      continue;
    end if;

    select * into v_p
      from public.presensi
     where user_id = v_uid
       and tanggal = v_tgl;
    v_ada := found;

    -- Kandidat absen pulang
    if v_ada
       and v_p.jam_masuk is not null
       and v_p.jam_pulang is null
       and v_p.status_kehadiran in ('Hadir', 'Koreksi')
       and not exists (
         select 1
           from public.pengaduan_presensi q
          where q.user_id = v_uid
            and q.tanggal = v_tgl
            and q.jenis = 'pulang'
            and q.status = 'menunggu'
       ) then
      v_hasil := v_hasil || jsonb_build_array(jsonb_build_object(
        'jenis', 'pulang',
        'tanggal', v_tgl,
        'presensi_id', v_p.id,
        'jam_masuk', v_p.jam_masuk,
        'status_kehadiran', v_p.status_kehadiran,
        'nama_shift', null,
        'jam_mulai', null,
        'jam_selesai', null
      ));
    end if;

    -- Jadwal kerja tanggal ini (untuk absen masuk / koreksi jam masuk)
    select * into v_jadwal from public.jadwal_kerja(v_uid, v_tgl);

    if found
       and coalesce(v_jadwal.terjadwal, false)
       and coalesce(v_jadwal.boleh_absen, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then

      if (not v_ada)
         or (v_p.jam_masuk is null and v_p.status_kehadiran = 'Alfa') then

        if not exists (
          select 1
            from public.pengaduan_presensi q
           where q.user_id = v_uid
             and q.tanggal = v_tgl
             and q.jenis = 'masuk'
             and q.status = 'menunggu'
        ) then
          v_hasil := v_hasil || jsonb_build_array(jsonb_build_object(
            'jenis', 'masuk',
            'tanggal', v_tgl,
            'presensi_id', case when v_ada then v_p.id else null end,
            'jam_masuk', null,
            'status_kehadiran', case when v_ada then v_p.status_kehadiran else null end,
            'nama_shift', v_jadwal.nama_shift,
            'jam_mulai', v_jadwal.jam_mulai,
            'jam_selesai', v_jadwal.jam_selesai
          ));
        end if;

      elsif v_p.status_kehadiran = 'Hadir'
            and v_p.jam_masuk is not null
            and coalesce(v_p.menit_terlambat, 0) > 0
            and v_p.dikoreksi_oleh is null then

        if not exists (
          select 1
            from public.pengaduan_presensi q
           where q.user_id = v_uid
             and q.tanggal = v_tgl
             and q.jenis = 'masuk'
             and q.status = 'menunggu'
        ) then
          v_hasil := v_hasil || jsonb_build_array(jsonb_build_object(
            'jenis', 'masuk',
            'tanggal', v_tgl,
            'presensi_id', v_p.id,
            'jam_masuk', v_p.jam_masuk,
            'status_kehadiran', v_p.status_kehadiran,
            'nama_shift', v_jadwal.nama_shift,
            'jam_mulai', v_jadwal.jam_mulai,
            'jam_selesai', v_jadwal.jam_selesai
          ));
        end if;
      end if;
    end if;
  end loop;

  return v_hasil;
end;
$$;

-- --------------------------------------------------------------------------
-- 4. Hak eksekusi
-- --------------------------------------------------------------------------

revoke execute on function public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text) from public, anon;
revoke execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text) from public, anon;
revoke execute on function public.kandidat_pengaduan_presensi() from public, anon;

grant execute on function public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text) to authenticated;
grant execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.kandidat_pengaduan_presensi() to authenticated;
commit;

