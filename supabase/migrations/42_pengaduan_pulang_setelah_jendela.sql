-- ==========================================================================
-- 42 - PENGADUAN ABSEN PULANG SETELAH JENDELA ABSEN TUTUP
-- Syarat: 01 s.d. 41 sudah dijalankan.
--
-- Ringkasan:
--   1. Kandidat "absen pulang" hanya ditawarkan setelah jendela absen pulang
--      tertutup, yaitu jam selesai jadwal + 2 jam (shift malam dihitung H+1).
--      Sebelumnya baris ini muncul begitu pegawai absen masuk pagi.
--   2. `ajukan_pengaduan_presensi()` menolak pengaduan absen pulang sebelum
--      batas tersebut agar server tetap menjadi sumber kebenaran.
--   3. Bila jadwal kerja tidak tersedia (mis. jadwal diubah setelah absen),
--      kandidat absen pulang hanya muncul untuk tanggal lampau, bukan hari ini.
--   4. Helper `hitung_batas_absen_pulang()` dipakai kedua fungsi supaya aturan
--      tidak berbeda. Tanpa perubahan tabel/kolom.
-- ==========================================================================

begin;

do $$
begin
  if to_regprocedure('public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text)') is null
     or to_regprocedure('public.kandidat_pengaduan_presensi()') is null
     or to_regprocedure('public.waktu_wita(date, time)') is null then
    raise exception 'Fungsi pengaduan belum lengkap. Jalankan migrasi 35-41 pada project Supabase yang benar.';
  end if;
end
$$;

-- --------------------------------------------------------------------------
-- 1. Helper batas tutup absen pulang
-- --------------------------------------------------------------------------
-- Jam selesai jadwal + 2 jam. Bila jam selesai <= jam mulai, shift dianggap
-- lintas hari dan batasnya jatuh pada hari berikutnya (aturan yang sama dengan
-- `submit_presensi` dan `MENIT_TUTUP_ABSEN_PULANG = 120` di klien).
create or replace function public.hitung_batas_absen_pulang(
  p_tanggal date,
  p_jam_mulai time,
  p_jam_selesai time
) returns timestamptz
language sql immutable
set search_path = public
as $$
  select case
    when p_tanggal is null or p_jam_mulai is null or p_jam_selesai is null then null
    else public.waktu_wita(p_tanggal, p_jam_selesai)
      + case
          when p_jam_selesai <= p_jam_mulai then interval '1 day'
          else interval '0'
        end
      + interval '2 hours'
  end;
$$;

revoke execute on function public.hitung_batas_absen_pulang(date, time, time) from public, anon;

-- --------------------------------------------------------------------------
-- 2. RPC: ajukan pengaduan (masuk / pulang)
-- --------------------------------------------------------------------------

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
  v_tutup timestamptz;
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

    -- Pengaduan baru dibuka setelah jendela absen pulang tertutup.
    select * into v_jadwal from public.jadwal_kerja(v_uid, p_tanggal);

    if found
       and coalesce(v_jadwal.terjadwal, false)
       and coalesce(v_jadwal.boleh_absen, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then
      v_tutup := public.hitung_batas_absen_pulang(
        p_tanggal, v_jadwal.jam_mulai, v_jadwal.jam_selesai
      );

      if v_tutup is not null and now() < v_tutup then
        raise exception 'Pengaduan absen pulang baru dapat diajukan setelah pukul % WITA.',
          to_char(v_tutup at time zone 'Asia/Makassar', 'HH24:MI');
      end if;
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

-- --------------------------------------------------------------------------
-- 3. RPC: kandidat pengaduan
-- --------------------------------------------------------------------------

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
  v_jadwal_ada boolean := false;
  v_tutup timestamptz;
  v_dibuka boolean := false;
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

    -- Jadwal kerja tanggal ini (dipakai absen pulang, absen masuk, dan koreksi)
    select * into v_jadwal from public.jadwal_kerja(v_uid, v_tgl);
    v_jadwal_ada := found
      and coalesce(v_jadwal.terjadwal, false)
      and coalesce(v_jadwal.boleh_absen, false)
      and v_jadwal.jam_mulai is not null
      and v_jadwal.jam_selesai is not null;

    v_tutup := case
      when v_jadwal_ada then public.hitung_batas_absen_pulang(
        v_tgl, v_jadwal.jam_mulai, v_jadwal.jam_selesai
      )
      else null
    end;

    -- Jendela absen pulang sudah tertutup? Tanpa jadwal: hanya tanggal lampau.
    v_dibuka := case
      when v_tutup is not null then now() >= v_tutup
      else v_tgl < v_hari_ini
    end;

    -- Kandidat absen pulang: baru muncul setelah jendela absen pulang tertutup.
    if v_ada
       and v_p.jam_masuk is not null
       and v_p.jam_pulang is null
       and v_p.status_kehadiran in ('Hadir', 'Koreksi')
       and v_dibuka
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

    if v_jadwal_ada then

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
revoke execute on function public.kandidat_pengaduan_presensi() from public, anon;

grant execute on function public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text) to authenticated;
grant execute on function public.kandidat_pengaduan_presensi() to authenticated;

commit;
