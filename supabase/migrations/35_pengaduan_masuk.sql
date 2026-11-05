-- ==========================================================================
-- 35 - PENGADUAN PRESENSI MULTI-JENIS (ABSEN MASUK + PULANG)
-- Syarat: 01 s.d. 34 sudah dijalankan.
--
-- Ringkasan:
--   1. Pengaduan kini punya `jenis`: 'masuk' atau 'pulang'. Pengaduan lama
--      otomatis dianggap 'pulang'.
--   2. `presensi_id` boleh kosong karena pegawai bisa mengadukan absen masuk
--      pada hari yang belum memiliki baris presensi (mis. sebelum Alfa dibuat).
--   3. `kandidat_pengaduan_presensi()` mengembalikan tanggal yang bisa diadukan
--      (7 hari terakhir): absen masuk yang terjadwal tanpa jam masuk, dan absen
--      pulang yang sudah masuk tetapi belum pulang.
--   4. Persetujuan absen masuk mengisi/membuat jam masuk, menghitung
--      `menit_terlambat` dari jadwal, serta menandai status 'Hadir' dengan jejak
--      koreksi. Persetujuan absen pulang tetap seperti sebelumnya.
--   5. Satu pengaduan menunggu per pegawai/tanggal/jenis.
--   6. `daftar_pengaduan_presensi()` memuat `jenis` dan join presensi lewat
--      (user_id, tanggal) agar pengaduan tanpa baris presensi tetap tampil.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pengaduan_presensi') is null
     or to_regclass('public.presensi') is null
     or to_regprocedure('public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)') is null then
    raise exception 'Tabel/fungsi pengaduan tidak ditemukan. Jalankan migrasi 33-34 pada project Supabase yang benar.';
  end if;
end
$$;

-- --------------------------------------------------------------------------
-- 1. Skema pengaduan
-- --------------------------------------------------------------------------

alter table public.pengaduan_presensi
  add column if not exists jenis text not null default 'pulang',
  add column if not exists jam_masuk_diajukan timestamptz,
  add column if not exists jam_masuk_disetujui timestamptz;

alter table public.pengaduan_presensi alter column presensi_id drop not null;
alter table public.pengaduan_presensi alter column jam_pulang_diajukan drop not null;

alter table public.pengaduan_presensi drop constraint if exists pengaduan_jenis_check;
alter table public.pengaduan_presensi
  add constraint pengaduan_jenis_check
  check (jenis in ('masuk', 'pulang'));

alter table public.pengaduan_presensi drop constraint if exists pengaduan_jam_sesuai_jenis;
alter table public.pengaduan_presensi
  add constraint pengaduan_jam_sesuai_jenis
  check (
    (jenis = 'pulang' and jam_pulang_diajukan is not null)
    or (jenis = 'masuk' and jam_masuk_diajukan is not null)
  );

drop index if exists public.pengaduan_satu_menunggu;
create unique index if not exists pengaduan_satu_menunggu
  on public.pengaduan_presensi (user_id, tanggal, jenis)
  where status = 'menunggu';

-- --------------------------------------------------------------------------
-- 2. Ganti signature RPC lama
-- --------------------------------------------------------------------------

drop function if exists public.ajukan_pengaduan_presensi(uuid, timestamptz, text, text);
drop function if exists public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text);

-- --------------------------------------------------------------------------
-- 3. RPC: ajukan pengaduan (masuk / pulang)
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
  v_p public.presensi%rowtype;
  v_jadwal record;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_ada boolean := false;
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
  -- Absen masuk
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

  if p_jam < v_mulai or p_jam > v_selesai then
    raise exception 'Jam masuk harus di dalam rentang jadwal kerja (% - %).',
      to_char(v_mulai at time zone 'Asia/Makassar', 'HH24:MI'),
      to_char(v_selesai at time zone 'Asia/Makassar', 'HH24:MI');
  end if;

  select * into v_p
    from public.presensi
   where user_id = v_uid
     and tanggal = p_tanggal
   for update;
  v_ada := found;

  if v_ada then
    if v_p.jam_masuk is not null then
      raise exception 'Anda sudah memiliki jam masuk pada tanggal tersebut.';
    end if;
    if v_p.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar') then
      raise exception 'Anda tercatat % pada tanggal tersebut.', v_p.status_kehadiran;
    end if;
    if v_p.status_kehadiran = 'Koreksi' or v_p.dikoreksi_oleh is not null then
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
    'pesan', 'Pengaduan absen masuk terkirim dan menunggu persetujuan Kepala Unit.'
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 4. RPC: keputusan Kepala Unit / Super Admin
-- --------------------------------------------------------------------------

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
  v_q public.pengaduan_presensi%rowtype;
  v_p public.presensi%rowtype;
  v_unit text;
  v_nama text;
  v_jam timestamptz;
  v_jadwal record;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_menit integer := 0;
  v_ada boolean := false;
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
  -- Setujui: absen masuk
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

    if v_jam < v_mulai or v_jam > v_selesai then
      raise exception 'Jam masuk harus di dalam rentang jadwal kerja (% - %).',
        to_char(v_mulai at time zone 'Asia/Makassar', 'HH24:MI'),
        to_char(v_selesai at time zone 'Asia/Makassar', 'HH24:MI');
    end if;

    select * into v_p
      from public.presensi
     where user_id = v_q.user_id
       and tanggal = v_q.tanggal
     for update;
    v_ada := found;

    if v_ada then
      if v_p.jam_masuk is not null then
        raise exception 'Presensi ini sudah memiliki jam masuk.';
      end if;
      if v_p.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar') then
        raise exception 'Pegawai tercatat % pada tanggal tersebut.', v_p.status_kehadiran;
      end if;
    end if;

    v_menit := public.hitung_menit_terlambat(v_q.user_id, v_q.tanggal, v_jam);
    v_alasan := 'Pengaduan absen masuk disetujui oleh '
      || coalesce(v_nama, 'Kepala Unit') || ': ' || v_q.alasan
      || coalesce(' | ' || nullif(btrim(p_catatan), ''), '');

    if v_ada then
      v_pid := v_p.id;
      update public.presensi
         set jam_masuk = v_jam,
             status_kehadiran = 'Hadir',
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
      'menit_terlambat', v_menit,
      'pesan', 'Pengaduan disetujui. Jam masuk presensi sudah diperbarui.'
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

-- --------------------------------------------------------------------------
-- 5. RPC: kandidat pengaduan 7 hari terakhir
-- --------------------------------------------------------------------------

create or replace function public.kandidat_pengaduan_presensi()
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
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

    -- Kandidat absen pulang
    select * into v_p
      from public.presensi
     where user_id = v_uid
       and tanggal = v_tgl
       and jam_masuk is not null
       and jam_pulang is null
       and status_kehadiran in ('Hadir', 'Koreksi');
    v_ada := found;

    if v_ada and not exists (
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

    -- Kandidat absen masuk
    select * into v_jadwal from public.jadwal_kerja(v_uid, v_tgl);

    if found
       and coalesce(v_jadwal.terjadwal, false)
       and coalesce(v_jadwal.boleh_absen, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then

      select * into v_p
        from public.presensi
       where user_id = v_uid
         and tanggal = v_tgl;
      v_ada := found;

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
      end if;
    end if;
  end loop;

  return v_hasil;
end;
$$;

-- --------------------------------------------------------------------------
-- 6. RPC: daftar pengaduan (sesuai peran)
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
             q.jenis,
             q.jam_masuk_diajukan,
             q.jam_masuk_disetujui,
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
        left join public.presensi pr
          on pr.user_id = q.user_id and pr.tanggal = q.tanggal
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
-- 7. Hak eksekusi
-- --------------------------------------------------------------------------

revoke execute on function public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text) from public, anon;
revoke execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text) from public, anon;
revoke execute on function public.kandidat_pengaduan_presensi() from public, anon;
revoke execute on function public.daftar_pengaduan_presensi(text, text, boolean) from public, anon;

grant execute on function public.ajukan_pengaduan_presensi(text, date, timestamptz, text, text) to authenticated;
grant execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.kandidat_pengaduan_presensi() to authenticated;
grant execute on function public.daftar_pengaduan_presensi(text, text, boolean) to authenticated;

commit;