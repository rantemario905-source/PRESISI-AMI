-- ==========================================================================
-- PRESISI AMI — Skema Database Supabase (RSUD Aji Muhammad Idris)
-- --------------------------------------------------------------------------
-- Dua cara pakai:
--   A. Satu file: jalankan seluruh file ini di SQL Editor.
--   B. Bertahap : jalankan supabase/migrations/01_tabel.sql s.d. 07_admin_rpc.sql,
--      satu per satu (disarankan bila ingin meminimalisir error).
--
-- Urutan PENTING: tabel dibuat lebih dulu, karena fungsi `is_superadmin`
-- (bahasa SQL) langsung divalidasi PostgreSQL saat dibuat dan membutuhkan
-- tabel public.pegawai yang sudah ada.
--
-- Anatomi keamanan:
--   1. Row Level Security (RLS) di SEMUA tabel
--   2. Fungsi RPC `submit_presensi` (SECURITY DEFINER) → satu-satunya jalan
--      menulis presensi; validasi perangkat, anti-Fake GPS, dan radius 100 m
--      dihitung ulang di server
--   3. Partial unique index → menjamin 1 pegawai = 1 perangkat aktif
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. TABEL
-- --------------------------------------------------------------------------

create table if not exists public.pegawai (
  id           uuid primary key references auth.users (id) on delete cascade,
  nama         text not null,
  unit_kerja   text not null default 'Belum ditentukan',
  role         text not null default 'pegawai' check (role in ('pegawai', 'superadmin')),
  dibuat_pada  timestamptz not null default now()
);

create table if not exists public.perangkat (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.pegawai (id) on delete cascade,
  device_token   text not null,
  info_perangkat text,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  diajukan_pada  timestamptz not null default now(),
  disetujui_pada timestamptz,
  disetujui_oleh uuid references public.pegawai (id),
  catatan        text,
  unique (user_id, device_token)
);

create table if not exists public.shift_master (
  id          uuid primary key default gen_random_uuid(),
  nama_shift  text not null unique,
  jam_mulai   time not null,
  jam_selesai time not null
);

create table if not exists public.jadwal_shift (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.pegawai (id) on delete cascade,
  tanggal   date not null,
  shift_id  uuid not null references public.shift_master (id) on delete cascade,
  unique (user_id, tanggal)
);

create table if not exists public.presensi (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.pegawai (id) on delete cascade,
  tanggal           date not null default ((now() at time zone 'Asia/Makassar')::date),
  jam_masuk         timestamptz,
  jam_pulang        timestamptz,
  lokasi_masuk      jsonb,
  lokasi_pulang     jsonb,
  jarak_masuk       numeric,
  jarak_pulang      numeric,
  status_kehadiran  text not null default 'Hadir'
                    check (status_kehadiran in ('Hadir', 'Izin', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi')),
  device_token      text,
  dikoreksi_oleh    uuid references public.pegawai (id),
  alasan_koreksi    text,
  dicatat_pada      timestamptz not null default now(),
  unique (user_id, tanggal)
);

-- Audit trail koreksi presensi (setiap edit admin wajib tercatat)
create table if not exists public.koreksi_presensi (
  id            uuid primary key default gen_random_uuid(),
  presensi_id   uuid not null references public.presensi (id) on delete cascade,
  admin_id      uuid not null references public.pegawai (id),
  kolom_koreksi text not null,
  nilai_lama    jsonb,
  nilai_baru    jsonb,
  alasan        text not null,
  waktu_koreksi timestamptz not null default now()
);

create table if not exists public.izin_cuti (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.pegawai (id) on delete cascade,
  jenis           text not null check (jenis in ('Izin', 'Sakit', 'Cuti', 'Dinas Luar')),
  tanggal_mulai   date not null,
  tanggal_selesai date not null,
  alasan          text not null,
  status          text not null default 'menunggu' check (status in ('menunggu', 'disetujui', 'ditolak')),
  disetujui_oleh  uuid references public.pegawai (id),
  disetujui_pada  timestamptz,
  catatan_admin   text,
  dibuat_pada     timestamptz not null default now(),
  check (tanggal_selesai >= tanggal_mulai)
);

-- --------------------------------------------------------------------------
-- 2. FUNGSI PEMBANTU
-- --------------------------------------------------------------------------

-- Fungsi Haversine: jarak meter antara dua koordinat
create or replace function public.haversine(
  p_lat1 double precision, p_lng1 double precision,
  p_lat2 double precision, p_lng2 double precision
) returns double precision
language sql immutable
as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(p_lat2 - p_lat1) / 2), 2) +
    cos(radians(p_lat1)) * cos(radians(p_lat2)) *
    power(sin(radians(p_lng2 - p_lng1) / 2), 2)
  ));
$$;

-- Cek role superadmin (SECURITY DEFINER agar tidak rekurif terhadap RLS)
create or replace function public.is_superadmin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pegawai
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- Otomatis membuat baris pegawai saat akun baru dibuat di Supabase Auth.
-- CATATAN: role SELALU 'pegawai' — promosi superadmin hanya lewat SQL manual
-- oleh Admin IT (mencegah eskalasi hak via metadata saat signup).
create or replace function public.handle_new_pegawai()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.pegawai (id, nama, unit_kerja, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(coalesce(new.email, 'Pegawai'), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'unit_kerja', 'Belum ditentukan'),
    'pegawai'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger auto-profil pegawai
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_pegawai();

-- --------------------------------------------------------------------------
-- 3. INDEX
-- --------------------------------------------------------------------------

create index if not exists idx_presensi_user_tanggal on public.presensi (user_id, tanggal desc);
create index if not exists idx_presensi_tanggal      on public.presensi (tanggal desc);
create index if not exists idx_jadwal_user_tanggal   on public.jadwal_shift (user_id, tanggal);
create index if not exists idx_perangkat_status      on public.perangkat (status);
create index if not exists idx_izin_status           on public.izin_cuti (status);

-- Kebijakan 1 pegawai = 1 perangkat aktif, dijamin di level database
create unique index if not exists uq_perangkat_disetujui
  on public.perangkat (user_id) where status = 'approved';

-- --------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (ketat di semua tabel)
-- --------------------------------------------------------------------------

alter table public.pegawai          enable row level security;
alter table public.perangkat        enable row level security;
alter table public.shift_master     enable row level security;
alter table public.jadwal_shift     enable row level security;
alter table public.presensi         enable row level security;
alter table public.koreksi_presensi enable row level security;
alter table public.izin_cuti        enable row level security;

-- pegawai: baca profil sendiri, superadmin baca semua
drop policy if exists "pegawai_baca_profil_sendiri" on public.pegawai;
create policy "pegawai_baca_profil_sendiri" on public.pegawai
  for select to authenticated
  using (id = auth.uid() or public.is_superadmin());

-- TIDAK ADA policy insert/update/delete klien untuk pegawai
-- → pembuatan akun via Supabase Auth (trigger), promosi role via SQL Admin IT.

-- perangkat: pegawai baca miliknya; ajukan device baru hanya miliknya + status pending
drop policy if exists "perangkat_baca_sendiri" on public.perangkat;
create policy "perangkat_baca_sendiri" on public.perangkat
  for select to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "perangkat_ajukan_pending" on public.perangkat;
create policy "perangkat_ajukan_pending" on public.perangkat
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Pegawai boleh mengajukan ULANG perangkat yang pending/ditolak.
-- Perangkat yang sudah approved TIDAK bisa disentuh pegawai (harus Admin IT).
drop policy if exists "perangkat_ajukan_ulang" on public.perangkat;
create policy "perangkat_ajukan_ulang" on public.perangkat
  for update to authenticated
  using (user_id = auth.uid() and status <> 'approved')
  with check (user_id = auth.uid() and status = 'pending');

-- Admin IT: setujui / tolak / reset perangkat
drop policy if exists "perangkat_kelola_admin" on public.perangkat;
create policy "perangkat_kelola_admin" on public.perangkat
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "perangkat_hapus_admin" on public.perangkat;
create policy "perangkat_hapus_admin" on public.perangkat
  for delete to authenticated
  using (public.is_superadmin());

-- shift_master: semua staf login boleh lihat, hanya admin yang ubah
drop policy if exists "shift_baca_semua" on public.shift_master;
create policy "shift_baca_semua" on public.shift_master
  for select to authenticated using (true);

drop policy if exists "shift_kelola_admin" on public.shift_master;
create policy "shift_kelola_admin" on public.shift_master
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- jadwal_shift: pegawai baca jadwal sendiri, admin kelola
drop policy if exists "jadwal_baca_sendiri" on public.jadwal_shift;
create policy "jadwal_baca_sendiri" on public.jadwal_shift
  for select to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "jadwal_kelola_admin" on public.jadwal_shift;
create policy "jadwal_kelola_admin" on public.jadwal_shift
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- presensi: pegawai baca miliknya; TIDAK ADA policy insert klien
-- → HANYA lewat RPC submit_presensi (validasi server-side).
-- Admin dapat update (koreksi) lewat policy ini + audit trail.
drop policy if exists "presensi_baca_sendiri" on public.presensi;
create policy "presensi_baca_sendiri" on public.presensi
  for select to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "presensi_koreksi_admin" on public.presensi;
create policy "presensi_koreksi_admin" on public.presensi
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- koreksi_presensi: hanya admin (baca & tulis)
drop policy if exists "koreksi_hanya_admin" on public.koreksi_presensi;
create policy "koreksi_hanya_admin" on public.koreksi_presensi
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- izin_cuti: pegawai baca & ajukan miliknya; admin persetujui
drop policy if exists "izin_baca_sendiri" on public.izin_cuti;
create policy "izin_baca_sendiri" on public.izin_cuti
  for select to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "izin_ajukan_sendiri" on public.izin_cuti;
create policy "izin_ajukan_sendiri" on public.izin_cuti
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'menunggu');

drop policy if exists "izin_persetujuan_admin" on public.izin_cuti;
create policy "izin_persetujuan_admin" on public.izin_cuti
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- --------------------------------------------------------------------------
-- 5. RPC: SUBMIT PRESENSI (gerbang tunggal penulisan presensi)
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 6. DATA AWAL: Master Shift
-- --------------------------------------------------------------------------

insert into public.shift_master (nama_shift, jam_mulai, jam_selesai)
values
  ('Pagi',  '07:00', '14:00'),
  ('Siang', '14:00', '21:00'),
  ('Malam', '21:00', '07:00')
on conflict (nama_shift) do nothing;

-- ==========================================================================
-- PENUTUP — Langkah setelah menjalankan SQL ini:
-- 1. Buat akun login di Supabase Dashboard → Authentication → Users →
--    Add user (email + password, centang "Auto Confirm User").
--    Metadata opsional: {"nama": "Nama Lengkap", "unit_kerja": "Unit Kerja"}
-- 2. Untuk menjadikan akun SUPER ADMIN, jalankan:
--
--    update public.pegawai
--       set role = 'superadmin'
--     where id = (select id from auth.users where email = 'email-admin-anda');
--
-- 3. Salin .env.example → .env lalu isi VITE_SUPABASE_URL & ANON KEY.
-- ==========================================================================

-- ==========================================================================
-- BAGIAN ADMIN (FASE 2) � RPC admin, policy izin, realtime
-- ==========================================================================

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

-- ==========================================================================
-- BAGIAN DATA PEGAWAI (FASE 3)
-- ==========================================================================

-- ==========================================================================
-- 08 — DATA PEGAWAI (FASE 3)
-- Syarat: 01 s.d. 07 sudah dijalankan.
--
-- Menambahkan RPC untuk memperbarui nama & unit kerja pegawai dari Portal
-- Super Admin. Role SENGAJA tidak dapat diubah lewat RPC ini — promosi
-- superadmin tetap hanya melalui SQL oleh Admin IT.
-- ==========================================================================

create or replace function public.perbarui_pegawai(
  p_id uuid,
  p_nama text,
  p_unit_kerja text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah data pegawai.';
  end if;

  if p_nama is null or length(trim(p_nama)) < 2 then
    raise exception 'Nama pegawai wajib diisi (minimal 2 karakter).';
  end if;

  if p_unit_kerja is null or length(trim(p_unit_kerja)) < 2 then
    raise exception 'Unit kerja wajib diisi (minimal 2 karakter).';
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = trim(p_unit_kerja)
   where id = p_id;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Data pegawai berhasil diperbarui.');
end;
$$;

revoke execute on function public.perbarui_pegawai(uuid, text, text) from public, anon;
grant execute on function public.perbarui_pegawai(uuid, text, text) to authenticated;
