-- ==========================================================================
-- PRESISI AMI — Skema Database Supabase (RSUD Aji Muhammad Idris)
-- --------------------------------------------------------------------------
-- Dua cara pakai:
--   A. Satu file: jalankan seluruh file ini di SQL Editor.
--   B. Bertahap : jalankan supabase/migrations/01_tabel.sql s.d.
--      17_batas_waktu_absen.sql, satu per satu (disarankan bila ingin
--      meminimalisir error).
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
-- CATATAN: akun baru SELALU ber-role 'pegawai' (mencegah eskalasi hak via
-- metadata saat signup). Setelah Super Admin pertama dibuat lewat SQL,
-- perubahan role dilakukan lewat RPC perbarui_pegawai_lengkap.
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
-- → pembuatan akun via Supabase Auth (trigger); perubahan role lewat RPC
--   perbarui_pegawai_lengkap yang memeriksa is_superadmin().

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
  ('Pagi',  '07:30', '14:30'),
  ('Siang', '14:30', '21:30'),
  ('Malam', '21:30', '07:30')
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
-- BAGIAN ADMIN (FASE 2) — RPC admin, policy izin, realtime
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

-- ==========================================================================
-- BAGIAN REDESAIN DINAS & SAKIT / CUTI (MIGRASI 09)
-- ==========================================================================

-- ==========================================================================
-- 09 — DINAS & SAKIT / CUTI (REDESAIN ADMINISTRASI KETIDAKHADIRAN)
-- Syarat: 01 s.d. 08 sudah dijalankan.
--
-- Perubahan utama:
--   1. Flag kepala_ruangan pada pegawai (satu kepala per unit kerja).
--   2. Jenis izin hanya Sakit, Cuti, Dinas Luar — jenis "Izin" dihapus.
--   3. Dinas Luar dapat dicatat untuk 1–4 pegawai dalam satu grup.
--   4. Dokumen wajib saat menyimpan Sakit & Dinas Luar (JPG/PNG, maks 1 MB).
--      Cuti boleh tanpa dokumen.
--   5. Pegawai TIDAK dapat mengajukan sendiri; hanya kepala ruangan atau
--      Super Admin yang mencatat. Persetujuan hanya oleh Super Admin.
--   6. Status dibatalkan (soft-delete) dengan jejak audit.
--   7. Private bucket Supabase Storage: dokumen-izin.
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Flag kepala ruangan
-- --------------------------------------------------------------------------

alter table public.pegawai
  add column if not exists kepala_ruangan boolean not null default false;

-- Satu unit kerja hanya boleh punya satu kepala ruangan aktif.
create unique index if not exists uq_kepala_ruangan_unit
  on public.pegawai (unit_kerja) where kepala_ruangan;

-- --------------------------------------------------------------------------
-- 2. Struktur izin_cuti
-- --------------------------------------------------------------------------

alter table public.izin_cuti
  add column if not exists grup_id uuid,
  add column if not exists dibuat_oleh uuid references public.pegawai (id),
  add column if not exists dokumen_path text,
  add column if not exists dokumen_nama text,
  add column if not exists dokumen_tipe text,
  add column if not exists dokumen_ukuran bigint,
  add column if not exists dibatalkan_oleh uuid references public.pegawai (id),
  add column if not exists dibatalkan_pada timestamptz,
  add column if not exists alasan_pembatalan text;

alter table public.izin_cuti alter column alasan drop not null;

-- Data lama: beri grup sendiri-sendiri dan pembuat awal.
update public.izin_cuti
   set grup_id = gen_random_uuid()
 where grup_id is null;

update public.izin_cuti
   set dibuat_oleh = user_id
 where dibuat_oleh is null;

-- Jenis "Izin" tidak dipakai lagi. Data lama (bila ada) dipertahankan
-- sebagai Cuti agar tidak hilang, dengan penanda pada keterangan.
update public.izin_cuti
   set jenis = 'Cuti',
       alasan = concat_ws(' ', nullif(alasan, ''), '[Migrasi: jenis Izin lama]')
 where jenis = 'Izin';

alter table public.izin_cuti alter column grup_id set default gen_random_uuid();
alter table public.izin_cuti alter column grup_id set not null;
alter table public.izin_cuti alter column dibuat_oleh set not null;

-- Ganti constraint lama.
alter table public.izin_cuti drop constraint if exists izin_cuti_jenis_check;
alter table public.izin_cuti
  add constraint izin_cuti_jenis_check
  check (jenis in ('Sakit', 'Cuti', 'Dinas Luar')) not valid;

alter table public.izin_cuti drop constraint if exists izin_cuti_status_check;
alter table public.izin_cuti
  add constraint izin_cuti_status_check
  check (status in ('menunggu', 'disetujui', 'ditolak', 'dibatalkan')) not valid;

-- Dokumen wajib untuk Sakit & Dinas Luar. NOT VALID agar baris lama yang
-- belum punya dokumen tidak menggagalkan migrasi; baris baru tetap dicek.
alter table public.izin_cuti drop constraint if exists izin_cuti_dokumen_wajib_check;
alter table public.izin_cuti
  add constraint izin_cuti_dokumen_wajib_check
  check (jenis = 'Cuti' or dokumen_path is not null) not valid;

alter table public.izin_cuti drop constraint if exists izin_cuti_dokumen_tipe_check;
alter table public.izin_cuti
  add constraint izin_cuti_dokumen_tipe_check
  check (dokumen_tipe is null or dokumen_tipe in ('image/jpeg', 'image/png')) not valid;

alter table public.izin_cuti drop constraint if exists izin_cuti_dokumen_ukuran_check;
alter table public.izin_cuti
  add constraint izin_cuti_dokumen_ukuran_check
  check (dokumen_ukuran is null or (dokumen_ukuran > 0 and dokumen_ukuran <= 1048576)) not valid;

create unique index if not exists uq_izin_grup_user
  on public.izin_cuti (grup_id, user_id);
create index if not exists idx_izin_grup on public.izin_cuti (grup_id);
create index if not exists idx_izin_user_tanggal on public.izin_cuti (user_id, tanggal_mulai desc);

-- --------------------------------------------------------------------------
-- 3. Presensi: hapus status "Izin"
-- --------------------------------------------------------------------------

-- Baris lama yang masih berstatus Izin diubah menjadi Koreksi agar constraint
-- baru dapat dipasang tanpa menghapus riwayat.
update public.presensi
   set alasan_koreksi = concat_ws(
         ' ',
         nullif(alasan_koreksi, ''),
         '[Migrasi: status Izin lama dihapus]'
       ),
       status_kehadiran = 'Koreksi'
 where status_kehadiran = 'Izin';

alter table public.presensi drop constraint if exists presensi_status_kehadiran_check;
alter table public.presensi
  add constraint presensi_status_kehadiran_check
  check (status_kehadiran in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi')) not valid;

-- RPC koreksi tetap wajib alasan, tetapi status "Izin" tidak lagi diterima.
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

  if p_status not in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi') then
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

revoke execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) to authenticated;

-- --------------------------------------------------------------------------
-- 4. Fungsi bantu akses kepala ruangan
-- --------------------------------------------------------------------------

create or replace function public.is_kepala_ruangan()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pegawai
    where id = auth.uid() and kepala_ruangan = true
  );
$$;

create or replace function public.unit_saya()
returns text
language sql stable security definer
set search_path = public
as $$
  select unit_kerja from public.pegawai where id = auth.uid();
$$;

create or replace function public.bisa_akses_izin(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or p_user_id = auth.uid()
      or exists (
        select 1
          from public.pegawai saya
          join public.pegawai target on target.id = p_user_id
         where saya.id = auth.uid()
           and saya.kepala_ruangan = true
           and target.unit_kerja = saya.unit_kerja
      );
$$;

create or replace function public.bisa_baca_dokumen(p_path text)
returns boolean
language sql stable security definer
set search_path = public, storage
as $$
  select exists (
    select 1
      from public.izin_cuti i
     where i.dokumen_path = p_path
       and public.bisa_akses_izin(i.user_id)
  )
  or exists (
    select 1
      from storage.objects o
     where o.bucket_id = 'dokumen-izin'
       and o.name = p_path
       and o.owner::text = auth.uid()::text
  );
$$;

-- Validasi metadata file di storage. Fungsi ini hanya dipanggil oleh RPC
-- SECURITY DEFINER, bukan langsung oleh klien.
-- Dokumen yang masih tertaut ke pengajuan tidak boleh dihapus oleh kepala
-- ruangan agar jejak audit tetap utuh. File yatim (mis. upload gagal disimpan)
-- tetap boleh dibersihkan oleh pemiliknya. Super Admin dapat menghapus semua.
create or replace function public.bisa_hapus_dokumen(p_path text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or not exists (
        select 1 from public.izin_cuti i where i.dokumen_path = p_path
      );
$$;

create or replace function public.validasi_dokumen_izin(
  p_path text,
  p_grup_id uuid,
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
  if p_path is null then
    return;
  end if;

  if p_grup_id is null or split_part(p_path, '/', 1) <> p_grup_id::text then
    raise exception 'Path dokumen tidak sesuai dengan grup pengajuan.';
  end if;

  select o.metadata ->> 'mimetype',
         nullif(o.metadata ->> 'size', '')::bigint
    into v_mime, v_size
    from storage.objects o
   where o.bucket_id = 'dokumen-izin'
     and o.name = p_path;

  if not found then
    raise exception 'Dokumen tidak ditemukan di storage. Unggah ulang dokumen.';
  end if;

  if v_mime is null then
    v_mime := p_tipe;
  end if;
  if v_mime = 'image/jpg' then
    v_mime := 'image/jpeg';
  end if;
  if v_mime not in ('image/jpeg', 'image/png') then
    raise exception 'Dokumen harus berupa JPG/JPEG atau PNG.';
  end if;

  v_size := coalesce(v_size, p_ukuran);
  if v_size is null or v_size <= 0 or v_size > 1048576 then
    raise exception 'Ukuran dokumen maksimal 1 MB.';
  end if;

  if p_ukuran is not null and (p_ukuran <= 0 or p_ukuran > 1048576) then
    raise exception 'Ukuran dokumen maksimal 1 MB.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 5. RLS izin_cuti & pegawai
-- --------------------------------------------------------------------------

-- Hapus semua policy lama yang memberi akses tulis langsung.
drop policy if exists "izin_baca_sendiri" on public.izin_cuti;
drop policy if exists "izin_ajukan_sendiri" on public.izin_cuti;
drop policy if exists "izin_persetujuan_admin" on public.izin_cuti;
drop policy if exists "izin_admin_kelola" on public.izin_cuti;
drop policy if exists "izin_baca_terkait" on public.izin_cuti;

-- Pegawai hanya melihat barisnya sendiri. Kepala ruangan melihat unitnya,
-- Super Admin melihat semua. Anggota lain dalam grup Dinas tidak otomatis
-- dapat melihat baris pegawai lain.
create policy "izin_baca_terkait" on public.izin_cuti
  for select to authenticated
  using (public.bisa_akses_izin(user_id));

-- Sengaja TIDAK ADA policy insert/update/delete untuk izin_cuti.
-- Semua penulisan hanya lewat RPC SECURITY DEFINER di bawah.
-- Baca tetap diizinkan (RLS membatasi baris), tulis/truncate dicabut total.
revoke all on table public.izin_cuti from public, anon, authenticated;
grant select on table public.izin_cuti to authenticated;

drop policy if exists "pegawai_baca_profil_sendiri" on public.pegawai;
create policy "pegawai_baca_profil_sendiri" on public.pegawai
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (public.is_kepala_ruangan() and unit_kerja = public.unit_saya())
  );

-- --------------------------------------------------------------------------
-- 6. Storage: bucket privat dokumen-izin
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dokumen-izin',
  'dokumen-izin',
  false,
  1048576,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dokumen_izin_unggah" on storage.objects;
create policy "dokumen_izin_unggah" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dokumen-izin'
    and (public.is_superadmin() or public.is_kepala_ruangan())
  );

drop policy if exists "dokumen_izin_baca" on storage.objects;
create policy "dokumen_izin_baca" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dokumen-izin'
    and public.bisa_baca_dokumen(name)
  );

drop policy if exists "dokumen_izin_hapus" on storage.objects;
create policy "dokumen_izin_hapus" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dokumen-izin'
    and (owner::text = auth.uid()::text or public.is_superadmin())
    and public.bisa_hapus_dokumen(name)
  );

-- --------------------------------------------------------------------------
-- 7. RPC: catat / ubah / putuskan / batalkan per grup
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

  -- Serialisasi perubahan pada grup yang sama.
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
     where p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat mencatat pegawai dari unit kerja Anda.';
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
       and p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat mengubah pengajuan dari unit kerja Anda.';
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
     where p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat mencatat pegawai dari unit kerja Anda.';
  end if;

  -- Dokumen: gunakan file baru bila dikirim, selain itu pertahankan file lama.
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

  -- File baru sudah divalidasi di atas. Untuk dokumen lama Cuti yang hilang,
  -- jangan blokir penyimpanan karena dokumen Cuti bersifat opsional.
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

create or replace function public.putuskan_izin_grup(
  p_grup_id uuid,
  p_status text,
  p_catatan text default null
) returns jsonb
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_lama public.izin_cuti%rowtype;
  v_baris public.izin_cuti%rowtype;
  v_tgl date;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menyetujui atau menolak pengajuan.';
  end if;

  if p_status not in ('disetujui', 'ditolak') then
    raise exception 'Status persetujuan tidak valid.';
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
    raise exception 'Hanya pengajuan menunggu yang dapat diproses.';
  end if;

  -- Dokumen hanya diperiksa saat menyetujui Sakit/Dinas Luar. Penolakan atau
  -- Cuti (dokumen opsional) tetap boleh diproses meski file sudah hilang.
  if p_status = 'disetujui' and v_lama.jenis <> 'Cuti' then
    if v_lama.dokumen_path is null then
      raise exception 'Dokumen wajib ada sebelum Sakit/Dinas Luar disetujui.';
    else
      perform public.validasi_dokumen_izin(
        v_lama.dokumen_path,
        p_grup_id,
        v_lama.dokumen_tipe,
        v_lama.dokumen_ukuran
      );
    end if;
  end if;

  update public.izin_cuti
     set status = p_status,
         disetujui_oleh = auth.uid(),
         disetujui_pada = now(),
         catatan_admin = nullif(trim(p_catatan), '')
   where grup_id = p_grup_id;

  if p_status = 'disetujui' then
    for v_baris in
      select * from public.izin_cuti where grup_id = p_grup_id
    loop
      for v_tgl in
        select generate_series(
          v_baris.tanggal_mulai,
          v_baris.tanggal_selesai,
          interval '1 day'
        )::date
      loop
        insert into public.presensi (user_id, tanggal, status_kehadiran)
        values (v_baris.user_id, v_tgl, v_baris.jenis)
        on conflict (user_id, tanggal) do update
          set status_kehadiran = excluded.status_kehadiran
          where public.presensi.jam_masuk is null
            and public.presensi.dikoreksi_oleh is null;
      end loop;
    end loop;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'grup_id', p_grup_id,
    'pesan', case
      when p_status = 'disetujui' then 'Pengajuan disetujui.'
      else 'Pengajuan ditolak.'
    end
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
       and p.unit_kerja <> public.unit_saya()
  ) then
    raise exception 'Anda hanya dapat membatalkan pengajuan dari unit kerja Anda.';
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

-- --------------------------------------------------------------------------
-- 8. Hapus RPC lama & atur hak eksekusi
-- --------------------------------------------------------------------------

drop function if exists public.putuskan_izin(uuid, text, text);
drop function if exists public.bisa_akses_grup(uuid);

revoke execute on function public.is_kepala_ruangan() from public, anon;
revoke execute on function public.unit_saya() from public, anon;
revoke execute on function public.bisa_akses_izin(uuid) from public, anon;
revoke execute on function public.bisa_baca_dokumen(text) from public, anon;
revoke execute on function public.bisa_hapus_dokumen(text) from public, anon;
revoke execute on function public.validasi_dokumen_izin(text, uuid, text, bigint) from public, anon;
revoke execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) from public, anon;
revoke execute on function public.putuskan_izin_grup(uuid, text, text) from public, anon;
revoke execute on function public.batalkan_izin_grup(uuid, text) from public, anon;

grant execute on function public.is_kepala_ruangan() to authenticated;
grant execute on function public.unit_saya() to authenticated;
grant execute on function public.bisa_akses_izin(uuid) to authenticated;
grant execute on function public.bisa_baca_dokumen(text) to authenticated;
grant execute on function public.bisa_hapus_dokumen(text) to authenticated;
grant execute on function public.catat_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.ubah_izin_grup(uuid, text, uuid[], date, date, text, text, text, text, bigint) to authenticated;
grant execute on function public.putuskan_izin_grup(uuid, text, text) to authenticated;
grant execute on function public.batalkan_izin_grup(uuid, text) to authenticated;

commit;

-- ==========================================================================
-- 10 — KELOLA ROLE DARI DATA PEGAWAI
-- Syarat: 01 s.d. 09 sudah dijalankan.
--
-- Super Admin dapat memperbarui nama, unit kerja, dan role sekaligus dari
-- menu Data Pegawai. Pengaman:
--   - hanya Super Admin yang boleh memanggil RPC;
--   - role hanya 'pegawai' atau 'superadmin';
--   - Super Admin tidak dapat menurunkan role akunnya sendiri;
--   - minimal satu Super Admin harus tetap ada;
--   - pegawai yang dipromosikan menjadi Super Admin otomatis dilepas dari
--     status kepala ruangan agar tidak mengunci slot kepala unit.
--
-- Flag kepala_ruangan tetap hanya dapat diubah lewat SQL oleh Admin IT.
-- ==========================================================================

begin;

create or replace function public.perbarui_pegawai_lengkap(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_role text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_role text;
  v_jumlah_superadmin integer;
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

  v_role := lower(trim(coalesce(p_role, '')));
  if v_role not in ('pegawai', 'superadmin') then
    raise exception 'Role pegawai tidak valid.';
  end if;

  -- Serialisasi perubahan role agar dua Super Admin tidak saling menurunkan
  -- secara bersamaan sampai tidak tersisa satu pun.
  perform pg_advisory_xact_lock(hashtext('presisi-role-pegawai'));

  select * into v_lama
    from public.pegawai
   where id = p_id
   for update;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  if p_id = auth.uid() and v_role <> v_lama.role then
    raise exception 'Role akun sendiri tidak dapat diubah dari aplikasi.';
  end if;

  if v_lama.role = 'superadmin' and v_role <> 'superadmin' then
    select count(*) into v_jumlah_superadmin
      from public.pegawai
     where role = 'superadmin';

    if v_jumlah_superadmin <= 1 then
      raise exception 'Minimal harus ada satu Super Admin aktif.';
    end if;
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = trim(p_unit_kerja),
         role = v_role,
         kepala_ruangan = case
           when v_role = 'superadmin' then false
           else kepala_ruangan
         end
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'role', v_role,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_lengkap(uuid, text, text, text)
  from public, anon;
grant execute on function public.perbarui_pegawai_lengkap(uuid, text, text, text)
  to authenticated;

commit;

-- ==========================================================================
-- 11 — PENGATURAN KEPALA RUANGAN DARI DATA PEGAWAI
-- Syarat: 01 s.d. 09 sudah dijalankan (10 opsional).
--
-- Super Admin dapat memperbarui nama, unit kerja, dan status kepala ruangan
-- sekaligus dari menu Data Pegawai. Jika unit tujuan sudah memiliki kepala
-- ruangan, status kepala lama dipindahkan otomatis agar tetap satu kepala
-- per unit. Role tidak diubah di sini; promosi Super Admin tetap lewat SQL.
-- ==========================================================================

begin;

create or replace function public.perbarui_pegawai_dan_kepala(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_kepala_ruangan boolean
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_unit text;
  v_kepala boolean;
  v_kepala_lama text;
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
  v_kepala := coalesce(p_kepala_ruangan, false);

  -- Serialisasi perubahan kepala pada unit yang sama.
  perform pg_advisory_xact_lock(hashtext('presisi-kepala-' || v_unit));

  select * into v_lama
    from public.pegawai
   where id = p_id
   for update;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  if v_lama.role <> 'pegawai' then
    raise exception 'Hanya akun pegawai yang dapat dijadikan kepala ruangan.';
  end if;

  if v_kepala then
    select string_agg(nama, ', ' order by nama)
      into v_kepala_lama
      from public.pegawai
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;

    update public.pegawai
       set kepala_ruangan = false
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = v_unit,
         kepala_ruangan = v_kepala
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'kepala_ruangan', v_kepala,
    'kepala_sebelumnya', v_kepala_lama,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_dan_kepala(uuid, text, text, boolean)
  from public, anon;
grant execute on function public.perbarui_pegawai_dan_kepala(uuid, text, text, boolean)
  to authenticated;

commit;


-- ==========================================================================
-- 12 — POLA KERJA, GRUP SHIFT, HARI LIBUR, TERLAMBAT & ALFA OTOMATIS
-- Syarat: 01 s.d. 11 sudah dijalankan.
--
-- Ringkasan:
--   1. Setiap pegawai memiliki pola kerja: shift (default) atau reguler.
--   2. Grup shift memakai master tersendiri sehingga grup kosong tetap bisa
--      dibuat dan rename grup otomatis memperbarui unit pegawai (FK cascade).
--   3. Jam kerja reguler: Senin–Kamis 08.00–16.30, Jumat 08.00–16.00,
--      Sabtu–Minggu libur. Hari libur nasional/cuti bersama diinput manual.
--   4. Presensi reguler dikunci pada akhir pekan/hari libur. Pegawai shift
--      hanya boleh absen bila dijadwalkan, kecuali mode transisi diaktifkan.
--   5. Keterlambatan dihitung tanpa toleransi; 08.00.01 = 1 menit.
--   6. Alfa otomatis dibuat setelah jam kerja berakhir (bukan jam tetap).
--
-- CATATAN: butir 4 (mode transisi) dihapus oleh bagian 13 di akhir file ini.
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Master grup shift & seksi
-- --------------------------------------------------------------------------

create table if not exists public.grup_shift (
  nama           text primary key,
  seksi          text not null default 'Belum ditentukan',
  dibuat_pada    timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  constraint grup_shift_nama_check check (length(trim(nama)) >= 2),
  constraint grup_shift_seksi_check check (length(trim(seksi)) >= 2)
);

-- Rapikan nilai unit lama sebelum dipasang foreign key.
update public.pegawai
   set unit_kerja = trim(unit_kerja)
 where unit_kerja is not null
   and unit_kerja <> trim(unit_kerja);

update public.pegawai
   set unit_kerja = 'Belum ditentukan'
 where unit_kerja is null or length(trim(unit_kerja)) < 2;

insert into public.grup_shift (nama, seksi)
select distinct p.unit_kerja, 'Belum ditentukan'
  from public.pegawai p
 where p.unit_kerja is not null
   and length(trim(p.unit_kerja)) >= 2
on conflict (nama) do nothing;

insert into public.grup_shift (nama, seksi)
values ('Belum ditentukan', 'Belum ditentukan')
on conflict (nama) do nothing;

alter table public.pegawai drop constraint if exists pegawai_unit_kerja_fkey;
alter table public.pegawai
  add constraint pegawai_unit_kerja_fkey
  foreign key (unit_kerja) references public.grup_shift (nama)
  on update cascade on delete restrict not valid;
alter table public.pegawai validate constraint pegawai_unit_kerja_fkey;

create index if not exists idx_grup_shift_seksi on public.grup_shift (seksi, nama);

alter table public.grup_shift enable row level security;
drop policy if exists "grup_shift_baca" on public.grup_shift;
create policy "grup_shift_baca" on public.grup_shift
  for select to authenticated
  using (true);

revoke all on table public.grup_shift from anon, authenticated;
grant select on table public.grup_shift to authenticated;

-- --------------------------------------------------------------------------
-- 2. Pola kerja pegawai
-- --------------------------------------------------------------------------

alter table public.pegawai
  add column if not exists pola_kerja text not null default 'shift';

alter table public.pegawai drop constraint if exists pegawai_pola_kerja_check;
alter table public.pegawai
  add constraint pegawai_pola_kerja_check
  check (pola_kerja in ('shift', 'reguler')) not valid;
alter table public.pegawai validate constraint pegawai_pola_kerja_check;

create index if not exists idx_pegawai_pola_kerja on public.pegawai (pola_kerja);

-- --------------------------------------------------------------------------
-- 3. Jam kerja reguler & hari libur
-- --------------------------------------------------------------------------

create table if not exists public.jam_kerja_reguler (
  hari        integer primary key check (hari between 1 and 7),
  jam_mulai   time,
  jam_selesai time,
  libur       boolean not null default false,
  constraint jam_kerja_reguler_jam_check check (
    libur
    or (jam_mulai is not null and jam_selesai is not null and jam_mulai < jam_selesai)
  )
);

insert into public.jam_kerja_reguler (hari, jam_mulai, jam_selesai, libur)
values
  (1, time '08:00', time '16:30', false),
  (2, time '08:00', time '16:30', false),
  (3, time '08:00', time '16:30', false),
  (4, time '08:00', time '16:30', false),
  (5, time '08:00', time '16:00', false),
  (6, null, null, true),
  (7, null, null, true)
on conflict (hari) do update
  set jam_mulai = excluded.jam_mulai,
      jam_selesai = excluded.jam_selesai,
      libur = excluded.libur;

alter table public.jam_kerja_reguler enable row level security;
drop policy if exists "jam_kerja_reguler_baca" on public.jam_kerja_reguler;
create policy "jam_kerja_reguler_baca" on public.jam_kerja_reguler
  for select to authenticated
  using (true);

revoke all on table public.jam_kerja_reguler from anon, authenticated;
grant select on table public.jam_kerja_reguler to authenticated;

create table if not exists public.hari_libur (
  tanggal      date primary key,
  nama         text not null,
  dibuat_oleh  uuid references public.pegawai (id) on delete set null,
  dibuat_pada  timestamptz not null default now(),
  constraint hari_libur_nama_check check (length(trim(nama)) >= 2)
);

create index if not exists idx_hari_libur_tanggal on public.hari_libur (tanggal);

alter table public.hari_libur enable row level security;
drop policy if exists "hari_libur_baca" on public.hari_libur;
create policy "hari_libur_baca" on public.hari_libur
  for select to authenticated
  using (true);

revoke all on table public.hari_libur from anon, authenticated;
grant select on table public.hari_libur to authenticated;

-- --------------------------------------------------------------------------
-- 4. Pengaturan presensi (mode transisi & Alfa)
-- --------------------------------------------------------------------------

create table if not exists public.pengaturan_presensi (
  id                        integer primary key default 1 check (id = 1),
  kunci_shift_tanpa_jadwal  boolean not null default false,
  alfa_otomatis             boolean not null default false,
  alfa_mulai                date,
  diperbarui_pada           timestamptz not null default now(),
  diperbarui_oleh           uuid references public.pegawai (id) on delete set null
);

insert into public.pengaturan_presensi (id)
values (1)
on conflict (id) do nothing;

alter table public.pengaturan_presensi enable row level security;
drop policy if exists "pengaturan_presensi_baca" on public.pengaturan_presensi;
create policy "pengaturan_presensi_baca" on public.pengaturan_presensi
  for select to authenticated
  using (true);

revoke all on table public.pengaturan_presensi from anon, authenticated;
grant select on table public.pengaturan_presensi to authenticated;

-- --------------------------------------------------------------------------
-- 5. Kolom keterlambatan
-- --------------------------------------------------------------------------

alter table public.presensi
  add column if not exists menit_terlambat integer not null default 0;

alter table public.presensi drop constraint if exists presensi_menit_terlambat_check;
alter table public.presensi
  add constraint presensi_menit_terlambat_check
  check (menit_terlambat >= 0) not valid;
alter table public.presensi validate constraint presensi_menit_terlambat_check;

create index if not exists idx_presensi_open
  on public.presensi (user_id, tanggal desc)
  where jam_masuk is not null and jam_pulang is null;

-- --------------------------------------------------------------------------
-- 6. Helper waktu & jadwal kerja
-- --------------------------------------------------------------------------

create or replace function public.waktu_wita(p_tanggal date, p_jam time)
returns timestamptz
language sql immutable
set search_path = public
as $$
  select ((p_tanggal + p_jam) at time zone 'Asia/Makassar');
$$;

create or replace function public.jadwal_kerja(
  p_user uuid default auth.uid(),
  p_tanggal date default ((now() at time zone 'Asia/Makassar')::date)
) returns table (
  user_id uuid,
  tanggal date,
  pola_kerja text,
  terjadwal boolean,
  libur boolean,
  nama_shift text,
  jam_mulai time,
  jam_selesai time,
  shift_id uuid,
  nama_hari_libur text,
  alasan text,
  boleh_absen boolean,
  pesan_jadwal text
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_pola text;
  v_isodow int;
  v_jam public.jam_kerja_reguler%rowtype;
  v_shift public.jadwal_shift%rowtype;
  v_master public.shift_master%rowtype;
  v_libur text;
  v_kunci boolean := false;
  v_terjadwal boolean := false;
  v_weekly_libur boolean := false;
  v_alasan text := null;
  v_boleh boolean := false;
  v_pesan text := null;
  v_nama_shift text := null;
  v_mulai time := null;
  v_selesai time := null;
begin
  if p_user is null then
    raise exception 'Pegawai tidak valid.';
  end if;

  if auth.uid() is not null
     and p_user <> auth.uid()
     and not public.is_superadmin() then
    if not exists (
      select 1
        from public.pegawai saya
        join public.pegawai target on target.id = p_user
       where saya.id = auth.uid()
         and saya.kepala_ruangan
         and saya.unit_kerja = target.unit_kerja
    ) then
      raise exception 'Anda tidak berhak melihat jadwal pegawai ini.';
    end if;
  end if;

  select p.pola_kerja into v_pola
    from public.pegawai p
   where p.id = p_user;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  v_pola := coalesce(v_pola, 'shift');
  v_isodow := extract(isodow from p_tanggal)::int;

  select h.nama into v_libur
    from public.hari_libur h
   where h.tanggal = p_tanggal;

  select coalesce(k.kunci_shift_tanpa_jadwal, false) into v_kunci
    from public.pengaturan_presensi k
   where k.id = 1;

  if v_pola = 'reguler' then
    select * into v_jam
      from public.jam_kerja_reguler j
     where j.hari = v_isodow;

    if not found then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'tidak_ada_aturan';
      v_boleh := false;
      v_pesan := 'Aturan jam kerja reguler belum tersedia. Hubungi Admin IT.';
    elsif v_jam.libur then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'akhir_pekan';
      v_boleh := false;
      v_pesan := 'Akhir pekan adalah hari libur. Absensi tidak diperlukan.';
    elsif v_libur is not null then
      v_terjadwal := false;
      v_weekly_libur := false;
      v_alasan := 'hari_libur';
      v_boleh := false;
      v_pesan := 'Hari libur: ' || v_libur || '. Absensi tidak diperlukan.';
    else
      v_terjadwal := true;
      v_weekly_libur := false;
      v_alasan := null;
      v_nama_shift := 'Reguler';
      v_mulai := v_jam.jam_mulai;
      v_selesai := v_jam.jam_selesai;
      v_boleh := true;
      v_pesan := null;
    end if;
  else
    select js.* into v_shift
      from public.jadwal_shift js
     where js.user_id = p_user
       and js.tanggal = p_tanggal;

    if found then
      select sm.* into v_master
        from public.shift_master sm
       where sm.id = v_shift.shift_id;

      if found then
        v_terjadwal := true;
        v_weekly_libur := false;
        v_alasan := null;
        v_nama_shift := v_master.nama_shift;
        v_mulai := v_master.jam_mulai;
        v_selesai := v_master.jam_selesai;
        v_boleh := true;
      else
        v_terjadwal := false;
        v_alasan := 'belum_dijadwalkan';
        v_boleh := false;
        v_pesan := 'Shift pada jadwal tidak ditemukan. Hubungi Admin IT.';
      end if;
    else
      v_terjadwal := false;
      v_weekly_libur := false;
      if v_libur is not null then
        v_alasan := 'hari_libur';
        v_boleh := false;
        v_pesan := 'Hari libur: ' || v_libur || '. Anda tidak dijadwalkan shift.';
      else
        v_alasan := 'belum_dijadwalkan';
        v_boleh := not v_kunci;
        if v_kunci then
          v_pesan := 'Anda belum dijadwalkan shift hari ini. Hubungi Kepala Ruangan/Super Admin.';
        else
          v_pesan := 'Anda belum dijadwalkan shift hari ini. Mode transisi masih mengizinkan absensi.';
        end if;
      end if;
    end if;
  end if;

  user_id := p_user;
  tanggal := p_tanggal;
  pola_kerja := v_pola;
  terjadwal := v_terjadwal;
  libur := v_weekly_libur
    or (not v_terjadwal and v_alasan in ('hari_libur', 'akhir_pekan', 'tidak_ada_aturan'));
  nama_shift := v_nama_shift;
  jam_mulai := v_mulai;
  jam_selesai := v_selesai;
  shift_id := case when v_pola = 'shift' and v_terjadwal then v_shift.shift_id else null end;
  nama_hari_libur := v_libur;
  alasan := v_alasan;
  boleh_absen := v_boleh;
  pesan_jadwal := v_pesan;
  return next;
end;
$$;

revoke execute on function public.jadwal_kerja(uuid, date) from public, anon;
grant execute on function public.jadwal_kerja(uuid, date) to authenticated;

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

  v_menit := ceil(extract(epoch from (p_waktu - v_mulai)) / 60.0)::int;
  return greatest(v_menit, 0);
end;
$$;

revoke execute on function public.hitung_menit_terlambat(uuid, date, timestamptz) from public, anon;
grant execute on function public.hitung_menit_terlambat(uuid, date, timestamptz) to authenticated;

-- --------------------------------------------------------------------------
-- 7. Trigger akun baru: pastikan grup tujuan selalu ada
-- --------------------------------------------------------------------------

create or replace function public.handle_new_pegawai()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_unit text;
begin
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
-- 8. RPC grup shift
-- --------------------------------------------------------------------------

create or replace function public.tambah_grup_shift(
  p_nama text,
  p_seksi text default 'Belum ditentukan'
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_seksi text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menambah grup shift.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  v_seksi := coalesce(nullif(trim(p_seksi), ''), 'Belum ditentukan');

  if length(v_nama) < 2 then
    raise exception 'Nama grup shift wajib diisi (minimal 2 karakter).';
  end if;
  if length(v_seksi) < 2 then
    raise exception 'Seksi wajib dipilih.';
  end if;
  if exists (select 1 from public.grup_shift g where lower(g.nama) = lower(v_nama)) then
    raise exception 'Nama grup shift "%" sudah digunakan.', v_nama;
  end if;

  insert into public.grup_shift (nama, seksi)
  values (v_nama, v_seksi);

  return jsonb_build_object('status', 'ok', 'nama', v_nama, 'seksi', v_seksi);
end;
$$;

revoke execute on function public.tambah_grup_shift(text, text) from public, anon;
grant execute on function public.tambah_grup_shift(text, text) to authenticated;

create or replace function public.ubah_grup_shift(
  p_nama_lama text,
  p_nama_baru text,
  p_seksi text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama text;
  v_baru text;
  v_seksi text;
  v_jumlah integer;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah grup shift.';
  end if;

  v_lama := trim(coalesce(p_nama_lama, ''));
  v_baru := trim(coalesce(p_nama_baru, ''));

  if length(v_lama) < 2 or length(v_baru) < 2 then
    raise exception 'Nama grup shift lama dan baru wajib diisi.';
  end if;

  perform pg_advisory_xact_lock(hashtext('presisi-grup-' || v_lama));

  select g.seksi into v_seksi
    from public.grup_shift g
   where g.nama = v_lama
   for update;

  if not found then
    raise exception 'Grup shift "%" tidak ditemukan.', v_lama;
  end if;

  v_seksi := coalesce(nullif(trim(p_seksi), ''), v_seksi);
  if length(v_seksi) < 2 then
    raise exception 'Seksi wajib dipilih.';
  end if;

  if v_baru <> v_lama
     and exists (select 1 from public.grup_shift g where lower(g.nama) = lower(v_baru)) then
    raise exception 'Nama grup shift "%" sudah digunakan.', v_baru;
  end if;

  update public.grup_shift
     set nama = v_baru,
         seksi = v_seksi,
         diperbarui_pada = now()
   where nama = v_lama;

  select count(*)::int into v_jumlah
    from public.pegawai p
   where p.unit_kerja = v_baru;

  return jsonb_build_object(
    'status', 'ok',
    'nama_lama', v_lama,
    'nama_baru', v_baru,
    'seksi', v_seksi,
    'jumlah_pegawai', v_jumlah,
    'pesan', 'Grup shift dan unit kerja pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.ubah_grup_shift(text, text, text) from public, anon;
grant execute on function public.ubah_grup_shift(text, text, text) to authenticated;

create or replace function public.hapus_grup_shift(p_nama text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_jumlah integer;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menghapus grup shift.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  if v_nama = 'Belum ditentukan' then
    raise exception 'Grup "Belum ditentukan" tidak dapat dihapus.';
  end if;

  select count(*)::int into v_jumlah
    from public.pegawai p
   where p.unit_kerja = v_nama;

  if v_jumlah > 0 then
    raise exception 'Grup "%" masih memiliki % pegawai. Pindahkan pegawai terlebih dahulu.', v_nama, v_jumlah;
  end if;

  delete from public.grup_shift where nama = v_nama;
  if not found then
    raise exception 'Grup shift "%" tidak ditemukan.', v_nama;
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Grup shift dihapus.');
end;
$$;

revoke execute on function public.hapus_grup_shift(text) from public, anon;
grant execute on function public.hapus_grup_shift(text) to authenticated;

-- --------------------------------------------------------------------------
-- 9. RPC hari libur & pengaturan
-- --------------------------------------------------------------------------

create or replace function public.tambah_hari_libur(
  p_tanggal date,
  p_nama text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengatur hari libur.';
  end if;
  if p_tanggal is null then
    raise exception 'Tanggal libur wajib diisi.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  if length(v_nama) < 2 then
    raise exception 'Nama hari libur wajib diisi (minimal 2 karakter).';
  end if;

  insert into public.hari_libur (tanggal, nama, dibuat_oleh)
  values (p_tanggal, v_nama, auth.uid())
  on conflict (tanggal) do update
    set nama = excluded.nama,
        dibuat_oleh = excluded.dibuat_oleh,
        dibuat_pada = now();

  return jsonb_build_object('status', 'ok', 'tanggal', p_tanggal, 'nama', v_nama);
end;
$$;

revoke execute on function public.tambah_hari_libur(date, text) from public, anon;
grant execute on function public.tambah_hari_libur(date, text) to authenticated;

create or replace function public.hapus_hari_libur(p_tanggal date)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menghapus hari libur.';
  end if;

  delete from public.hari_libur where tanggal = p_tanggal;
  if not found then
    raise exception 'Hari libur pada tanggal tersebut tidak ditemukan.';
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Hari libur dihapus.');
end;
$$;

revoke execute on function public.hapus_hari_libur(date) from public, anon;
grant execute on function public.hapus_hari_libur(date) to authenticated;

create or replace function public.simpan_pengaturan_presensi(
  p_kunci_shift_tanpa_jadwal boolean,
  p_alfa_otomatis boolean,
  p_alfa_mulai date default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah pengaturan presensi.';
  end if;

  update public.pengaturan_presensi
     set kunci_shift_tanpa_jadwal = coalesce(p_kunci_shift_tanpa_jadwal, false),
         alfa_otomatis = coalesce(p_alfa_otomatis, false),
         alfa_mulai = p_alfa_mulai,
         diperbarui_pada = now(),
         diperbarui_oleh = auth.uid()
   where id = 1;

  return jsonb_build_object(
    'status', 'ok',
    'kunci_shift_tanpa_jadwal', coalesce(p_kunci_shift_tanpa_jadwal, false),
    'alfa_otomatis', coalesce(p_alfa_otomatis, false),
    'alfa_mulai', p_alfa_mulai
  );
end;
$$;

revoke execute on function public.simpan_pengaturan_presensi(boolean, boolean, date) from public, anon;
grant execute on function public.simpan_pengaturan_presensi(boolean, boolean, date) to authenticated;

-- --------------------------------------------------------------------------
-- 10. RPC data pegawai: nama, unit, kepala, pola kerja
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
  v_kepala boolean;
  v_pola text;
  v_kepala_lama text;
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
  v_kepala := coalesce(p_kepala_ruangan, false);

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

  if v_kepala then
    select string_agg(nama, ', ' order by nama)
      into v_kepala_lama
      from public.pegawai
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;

    update public.pegawai
       set kepala_ruangan = false
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = v_unit,
         kepala_ruangan = v_kepala,
         pola_kerja = v_pola
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'kepala_ruangan', v_kepala,
    'kepala_sebelumnya', v_kepala_lama,
    'pola_kerja', v_pola,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text) from public, anon;
grant execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text) to authenticated;

-- --------------------------------------------------------------------------
-- 11. Submit presensi: validasi jadwal, keterlambatan, checkout lintas hari
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
  v_row public.presensi%rowtype;
  v_jadwal record;
  v_jadwal_kemarin record;
  v_tanggal_kerja date := v_hari;
  v_mulai timestamptz;
  v_selesai timestamptz;
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

  select public.haversine(-0.23861315731059254, 117.41485548535888, p_lat, p_lng)
    into v_jarak;
  if v_jarak > 100 then
    raise exception 'Anda berada di luar radius 100 meter dari RSUD AMI. Jarak Anda saat ini % meter.',
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
               'akurasi', round(p_akurasi::numeric, 1)
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
           'akurasi', round(p_akurasi::numeric, 1)
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
      raise exception 'Anda sudah melakukan absen pulang hari ini.';
    end if;

    update public.presensi
       set jam_pulang = v_waktu,
           lokasi_pulang = jsonb_build_object(
             'lat', p_lat,
             'lng', p_lng,
             'akurasi', round(p_akurasi::numeric, 1)
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
-- 12. Koreksi: hitung ulang keterlambatan
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
  v_menit integer := 0;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengoreksi presensi.';
  end if;
  if p_alasan is null or length(trim(p_alasan)) < 5 then
    raise exception 'Alasan koreksi wajib diisi (minimal 5 karakter).';
  end if;
  if p_status not in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi') then
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

-- --------------------------------------------------------------------------
-- 13. Alfa otomatis setelah jam kerja berakhir
-- --------------------------------------------------------------------------

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
      select p.id as user_id, j.jam_mulai, j.jam_selesai
        from public.pegawai p
        join public.jam_kerja_reguler j
          on j.hari = extract(isodow from v_target)::int
       where p.role = 'pegawai'
         and p.pola_kerja = 'reguler'
         and not j.libur
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
                or pr.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Koreksi')
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
                or pr.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Koreksi')
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

commit;


-- ==========================================================================
-- 13 — KEPALA RUANGAN KELOLA JADWAL, FINALISASI, & HAPUS MODE TRANSISI
-- Syarat: 12 sudah dijalankan.
--
-- Ringkasan:
--   1. Mode transisi dihapus permanen. Pegawai shift yang belum dijadwalkan
--      selalu ditolak saat absen; tidak ada pengaturan yang bisa membuka lagi.
--   2. Kepala ruangan boleh melihat dan mengelola jadwal shift unitnya sendiri.
--      Mereka hanya boleh menulis untuk tanggal besok dan seterusnya, hanya
--      untuk pegawai shift di unitnya, dan tidak boleh mengubah master shift.
--   3. Setiap perubahan jadwal dicatat: dibuat_oleh, diperbarui_oleh, waktu.
--   4. Finalisasi jadwal per unit/bulan. Setelah final, kepala ruangan tidak
--      dapat mengubah jadwal lagi; Super Admin tetap dapat mengubah dan
--      membuka finalisasi.
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Hapus mode transisi shift
-- --------------------------------------------------------------------------

alter table public.pengaturan_presensi
  drop column if exists kunci_shift_tanpa_jadwal;

-- Fungsi lama memakai tiga parameter; hapus agar tidak menjadi overload.
drop function if exists public.simpan_pengaturan_presensi(boolean, boolean, date);

create or replace function public.simpan_pengaturan_presensi(
  p_alfa_otomatis boolean,
  p_alfa_mulai date default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah pengaturan presensi.';
  end if;

  update public.pengaturan_presensi
     set alfa_otomatis = coalesce(p_alfa_otomatis, false),
         alfa_mulai = p_alfa_mulai,
         diperbarui_pada = now(),
         diperbarui_oleh = auth.uid()
   where id = 1;

  return jsonb_build_object(
    'status', 'ok',
    'alfa_otomatis', coalesce(p_alfa_otomatis, false),
    'alfa_mulai', p_alfa_mulai
  );
end;
$$;

revoke execute on function public.simpan_pengaturan_presensi(boolean, date) from public, anon;
grant execute on function public.simpan_pengaturan_presensi(boolean, date) to authenticated;

-- jadwal_kerja: shift tanpa jadwal SELALU terkunci.
create or replace function public.jadwal_kerja(
  p_user uuid default auth.uid(),
  p_tanggal date default ((now() at time zone 'Asia/Makassar')::date)
) returns table (
  user_id uuid,
  tanggal date,
  pola_kerja text,
  terjadwal boolean,
  libur boolean,
  nama_shift text,
  jam_mulai time,
  jam_selesai time,
  shift_id uuid,
  nama_hari_libur text,
  alasan text,
  boleh_absen boolean,
  pesan_jadwal text
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_pola text;
  v_isodow int;
  v_jam public.jam_kerja_reguler%rowtype;
  v_shift public.jadwal_shift%rowtype;
  v_master public.shift_master%rowtype;
  v_libur text;
  v_terjadwal boolean := false;
  v_weekly_libur boolean := false;
  v_alasan text := null;
  v_boleh boolean := false;
  v_pesan text := null;
  v_nama_shift text := null;
  v_mulai time := null;
  v_selesai time := null;
begin
  if p_user is null then
    raise exception 'Pegawai tidak valid.';
  end if;

  if auth.uid() is not null
     and p_user <> auth.uid()
     and not public.is_superadmin() then
    if not exists (
      select 1
        from public.pegawai saya
        join public.pegawai target on target.id = p_user
       where saya.id = auth.uid()
         and saya.kepala_ruangan
         and saya.unit_kerja = target.unit_kerja
    ) then
      raise exception 'Anda tidak berhak melihat jadwal pegawai ini.';
    end if;
  end if;

  select p.pola_kerja into v_pola
    from public.pegawai p
   where p.id = p_user;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  v_pola := coalesce(v_pola, 'shift');
  v_isodow := extract(isodow from p_tanggal)::int;

  select h.nama into v_libur
    from public.hari_libur h
   where h.tanggal = p_tanggal;

  if v_pola = 'reguler' then
    select * into v_jam
      from public.jam_kerja_reguler j
     where j.hari = v_isodow;

    if not found then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'tidak_ada_aturan';
      v_boleh := false;
      v_pesan := 'Aturan jam kerja reguler belum tersedia. Hubungi Admin IT.';
    elsif v_jam.libur then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'akhir_pekan';
      v_boleh := false;
      v_pesan := 'Akhir pekan adalah hari libur. Absensi tidak diperlukan.';
    elsif v_libur is not null then
      v_terjadwal := false;
      v_weekly_libur := false;
      v_alasan := 'hari_libur';
      v_boleh := false;
      v_pesan := 'Hari libur: ' || v_libur || '. Absensi tidak diperlukan.';
    else
      v_terjadwal := true;
      v_weekly_libur := false;
      v_alasan := null;
      v_nama_shift := 'Reguler';
      v_mulai := v_jam.jam_mulai;
      v_selesai := v_jam.jam_selesai;
      v_boleh := true;
      v_pesan := null;
    end if;
  else
    select js.* into v_shift
      from public.jadwal_shift js
     where js.user_id = p_user
       and js.tanggal = p_tanggal;

    if found then
      select sm.* into v_master
        from public.shift_master sm
       where sm.id = v_shift.shift_id;

      if found then
        v_terjadwal := true;
        v_weekly_libur := false;
        v_alasan := null;
        v_nama_shift := v_master.nama_shift;
        v_mulai := v_master.jam_mulai;
        v_selesai := v_master.jam_selesai;
        v_boleh := true;
      else
        v_terjadwal := false;
        v_alasan := 'belum_dijadwalkan';
        v_boleh := false;
        v_pesan := 'Shift pada jadwal tidak ditemukan. Hubungi Admin IT.';
      end if;
    else
      v_terjadwal := false;
      v_weekly_libur := false;
      if v_libur is not null then
        v_alasan := 'hari_libur';
        v_boleh := false;
        v_pesan := 'Hari libur: ' || v_libur || '. Anda tidak dijadwalkan shift.';
      else
        v_alasan := 'belum_dijadwalkan';
        v_boleh := false;
        v_pesan := 'Anda belum dijadwalkan shift hari ini. Hubungi Kepala Ruangan/Super Admin.';
      end if;
    end if;
  end if;

  user_id := p_user;
  tanggal := p_tanggal;
  pola_kerja := v_pola;
  terjadwal := v_terjadwal;
  libur := v_weekly_libur
    or (not v_terjadwal and v_alasan in ('hari_libur', 'akhir_pekan', 'tidak_ada_aturan'));
  nama_shift := v_nama_shift;
  jam_mulai := v_mulai;
  jam_selesai := v_selesai;
  shift_id := case when v_pola = 'shift' and v_terjadwal then v_shift.shift_id else null end;
  nama_hari_libur := v_libur;
  alasan := v_alasan;
  boleh_absen := v_boleh;
  pesan_jadwal := v_pesan;
  return next;
end;
$$;

revoke execute on function public.jadwal_kerja(uuid, date) from public, anon;
grant execute on function public.jadwal_kerja(uuid, date) to authenticated;

-- --------------------------------------------------------------------------
-- 2. Audit jadwal shift
-- --------------------------------------------------------------------------

alter table public.jadwal_shift
  add column if not exists dibuat_oleh uuid,
  add column if not exists diperbarui_oleh uuid,
  add column if not exists dibuat_pada timestamptz not null default now(),
  add column if not exists diperbarui_pada timestamptz not null default now();

alter table public.jadwal_shift
  drop constraint if exists jadwal_shift_dibuat_oleh_fkey;
alter table public.jadwal_shift
  add constraint jadwal_shift_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references public.pegawai (id) on delete set null not valid;
alter table public.jadwal_shift
  validate constraint jadwal_shift_dibuat_oleh_fkey;

alter table public.jadwal_shift
  drop constraint if exists jadwal_shift_diperbarui_oleh_fkey;
alter table public.jadwal_shift
  add constraint jadwal_shift_diperbarui_oleh_fkey
  foreign key (diperbarui_oleh) references public.pegawai (id) on delete set null not valid;
alter table public.jadwal_shift
  validate constraint jadwal_shift_diperbarui_oleh_fkey;

create or replace function public.set_audit_jadwal_shift()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.dibuat_oleh := auth.uid();
    new.dibuat_pada := now();
  else
    new.dibuat_oleh := old.dibuat_oleh;
    new.dibuat_pada := old.dibuat_pada;
  end if;
  new.diperbarui_oleh := auth.uid();
  new.diperbarui_pada := now();
  return new;
end;
$$;

revoke execute on function public.set_audit_jadwal_shift() from public, anon;
grant execute on function public.set_audit_jadwal_shift() to authenticated;

drop trigger if exists trg_audit_jadwal_shift on public.jadwal_shift;
create trigger trg_audit_jadwal_shift
before insert or update on public.jadwal_shift
for each row execute function public.set_audit_jadwal_shift();

-- Hak tabel eksplisit; RLS tetap yang menentukan baris mana yang boleh diubah.
revoke all on table public.jadwal_shift from anon, authenticated;
grant select, insert, update, delete on table public.jadwal_shift to authenticated;

-- --------------------------------------------------------------------------
-- 3. Finalisasi jadwal per unit/bulan
-- --------------------------------------------------------------------------

create table if not exists public.jadwal_shift_final (
  unit_kerja  text not null references public.grup_shift (nama)
              on update cascade on delete cascade,
  periode     date not null,
  final_oleh  uuid references public.pegawai (id) on delete set null,
  final_pada  timestamptz not null default now(),
  primary key (unit_kerja, periode),
  constraint jadwal_shift_final_periode_check
    check (extract(day from periode) = 1)
);

create index if not exists idx_jadwal_shift_final_periode
  on public.jadwal_shift_final (periode, unit_kerja);

alter table public.jadwal_shift_final enable row level security;

drop policy if exists "jadwal_final_baca" on public.jadwal_shift_final;
create policy "jadwal_final_baca" on public.jadwal_shift_final
  for select to authenticated
  using (
    public.is_superadmin()
    or (public.is_kepala_ruangan() and unit_kerja = public.unit_saya())
  );

revoke all on table public.jadwal_shift_final from anon, authenticated;
grant select on table public.jadwal_shift_final to authenticated;

-- --------------------------------------------------------------------------
-- 4. Helper akses & RLS jadwal untuk kepala ruangan
-- --------------------------------------------------------------------------

create or replace function public.bisa_kelola_jadwal(p_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or exists (
        select 1
          from public.pegawai saya
          join public.pegawai target on target.id = p_user
         where saya.id = auth.uid()
           and saya.kepala_ruangan
           and saya.unit_kerja = target.unit_kerja
           and target.role = 'pegawai'
           and target.pola_kerja = 'shift'
      );
$$;

create or replace function public.jadwal_bulan_final(p_user uuid, p_tanggal date)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.jadwal_shift_final f
      join public.pegawai p on p.id = p_user
     where f.unit_kerja = p.unit_kerja
       and f.periode = date_trunc('month', p_tanggal)::date
  );
$$;

revoke execute on function public.bisa_kelola_jadwal(uuid) from public, anon;
grant execute on function public.bisa_kelola_jadwal(uuid) to authenticated;
revoke execute on function public.jadwal_bulan_final(uuid, date) from public, anon;
grant execute on function public.jadwal_bulan_final(uuid, date) to authenticated;

-- Kepala boleh melihat seluruh jadwal unitnya (termasuk tanggal lampau).
drop policy if exists "jadwal_baca_kepala_unit" on public.jadwal_shift;
create policy "jadwal_baca_kepala_unit" on public.jadwal_shift
  for select to authenticated
  using (
    public.is_kepala_ruangan()
    and exists (
      select 1
        from public.pegawai target
       where target.id = jadwal_shift.user_id
         and target.unit_kerja = public.unit_saya()
    )
  );

-- Kepala hanya boleh menulis mulai besok, untuk pegawai shift unitnya, dan
-- tidak boleh menyentuh bulan yang sudah difinalisasi.
drop policy if exists "jadwal_kelola_kepala_unit" on public.jadwal_shift;
create policy "jadwal_kelola_kepala_unit" on public.jadwal_shift
  for all to authenticated
  using (
    public.is_kepala_ruangan()
    and public.bisa_kelola_jadwal(user_id)
    and tanggal > (now() at time zone 'Asia/Makassar')::date
    and not public.jadwal_bulan_final(user_id, tanggal)
  )
  with check (
    public.is_kepala_ruangan()
    and public.bisa_kelola_jadwal(user_id)
    and tanggal > (now() at time zone 'Asia/Makassar')::date
    and not public.jadwal_bulan_final(user_id, tanggal)
  );

-- --------------------------------------------------------------------------
-- 5. RPC finalisasi
-- --------------------------------------------------------------------------

create or replace function public.finalisasi_jadwal_unit(
  p_unit text,
  p_periode date,
  p_final boolean default true
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_unit text := trim(coalesce(p_unit, ''));
  v_periode date;
  v_final boolean := coalesce(p_final, true);
begin
  if v_unit = '' then
    raise exception 'Unit kerja wajib dipilih.';
  end if;
  if p_periode is null then
    raise exception 'Periode wajib dipilih.';
  end if;

  v_periode := date_trunc('month', p_periode)::date;

  if not exists (select 1 from public.grup_shift where nama = v_unit) then
    raise exception 'Grup shift tidak ditemukan.';
  end if;

  if not public.is_superadmin() then
    if not public.is_kepala_ruangan()
       or public.unit_saya() is distinct from v_unit then
      raise exception 'Anda hanya dapat mengelola jadwal unit sendiri.';
    end if;
    if v_periode < date_trunc('month', (now() at time zone 'Asia/Makassar')::date)::date then
      raise exception 'Jadwal bulan yang sudah lewat hanya dapat dikelola Super Admin.';
    end if;
    if not v_final then
      raise exception 'Hanya Super Admin yang dapat membuka finalisasi jadwal.';
    end if;
  end if;

  if v_final then
    insert into public.jadwal_shift_final (unit_kerja, periode, final_oleh, final_pada)
    values (v_unit, v_periode, auth.uid(), now())
    on conflict (unit_kerja, periode) do update
      set final_oleh = excluded.final_oleh,
          final_pada = excluded.final_pada;
  else
    delete from public.jadwal_shift_final
     where unit_kerja = v_unit and periode = v_periode;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'unit_kerja', v_unit,
    'periode', v_periode,
    'final', v_final
  );
end;
$$;

revoke execute on function public.finalisasi_jadwal_unit(text, date, boolean) from public, anon;
grant execute on function public.finalisasi_jadwal_unit(text, date, boolean) to authenticated;

-- --------------------------------------------------------------------------
-- 14. Impor jadwal shift dari template CSV/XLSX
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
  v_unit_saya text := public.unit_saya();
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
       or v_unit_saya is distinct from v_unit then
      raise exception 'Anda hanya dapat mengimpor jadwal unit sendiri.';
    end if;

    if v_periode < date_trunc('month', v_hari_ini)::date then
      raise exception 'Jadwal bulan yang sudah lewat hanya dapat diimpor Super Admin.';
    end if;

    if exists (
      select 1
        from public.jadwal_shift_final f
       where f.unit_kerja = v_unit
         and f.periode = v_periode
    ) then
      raise exception 'Jadwal bulan ini sudah final. Hubungi Super Admin untuk koreksi.';
    end if;
  end if;

  -- Validasi seluruh baris sebelum menulis apa pun.
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

    if not v_super and v_input.tanggal <= v_hari_ini then
      raise exception 'Baris %: tanggal hari ini dan sebelumnya hanya dapat diubah Super Admin.',
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

  -- Semua valid: terapkan perubahan.
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

commit;

-- ==========================================================================
-- 15 - HAPUS FINALISASI JADWAL
-- ==========================================================================

begin;

drop policy if exists "jadwal_kelola_kepala_unit" on public.jadwal_shift;

drop function if exists public.finalisasi_jadwal_unit(text, date, boolean);
drop function if exists public.jadwal_bulan_final(uuid, date);

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
  v_unit_saya text := public.unit_saya();
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
       or v_unit_saya is distinct from v_unit then
      raise exception 'Anda hanya dapat mengimpor jadwal unit sendiri.';
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

drop table if exists public.jadwal_shift_final;

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

commit;

-- ==========================================================================
-- 16 - SATU PERANGKAT AKTIF PER PEGAWAI
-- ==========================================================================

begin;

delete from public.perangkat;

drop index if exists public.uq_perangkat_disetujui;

create unique index if not exists uq_perangkat_aktif
  on public.perangkat (user_id)
  where status in ('pending', 'approved');

create or replace function public.punya_perangkat_aktif(p_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.perangkat
     where user_id = p_user
       and status in ('pending', 'approved')
  );
$$;

revoke execute on function public.punya_perangkat_aktif(uuid) from public, anon;
grant execute on function public.punya_perangkat_aktif(uuid) to authenticated;

drop policy if exists "perangkat_ajukan_pending" on public.perangkat;
create policy "perangkat_ajukan_pending" on public.perangkat
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and not public.punya_perangkat_aktif(auth.uid())
  );

drop policy if exists "perangkat_ajukan_ulang" on public.perangkat;
create policy "perangkat_ajukan_ulang" on public.perangkat
  for update to authenticated
  using (
    user_id = auth.uid()
    and status <> 'approved'
    and not public.punya_perangkat_aktif(auth.uid())
  )
  with check (user_id = auth.uid() and status = 'pending');

create or replace function public.setujui_perangkat(p_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_status text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menyetujui perangkat.';
  end if;

  select user_id, status
    into v_user, v_status
    from public.perangkat
   where id = p_id
   for update;

  if v_user is null then
    raise exception 'Pengajuan perangkat tidak ditemukan.';
  end if;

  if v_status <> 'pending' then
    raise exception 'Hanya pengajuan yang masih menunggu yang dapat disetujui.';
  end if;

  if exists (
    select 1
      from public.perangkat
     where user_id = v_user
       and status = 'approved'
       and id <> p_id
  ) then
    raise exception 'Pegawai masih memiliki perangkat aktif. Reset perangkat lama terlebih dahulu.';
  end if;

  update public.perangkat
     set status = 'rejected',
         catatan = coalesce(catatan, 'Ditolak karena ada pengajuan perangkat lain')
   where user_id = v_user
     and status = 'pending'
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

revoke execute on function public.setujui_perangkat(uuid) from public, anon;
grant execute on function public.setujui_perangkat(uuid) to authenticated;

commit;

-- ==========================================================================
-- 17 - BATAS WAKTU ABSEN
-- ==========================================================================

begin;

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
  v_row public.presensi%rowtype;
  v_jadwal record;
  v_jadwal_kemarin record;
  v_tanggal_kerja date := v_hari;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_menit integer := 0;
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
    select * into v_jadwal from public.jadwal_kerja(v_user, v_hari);

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

      if v_waktu < v_mulai - interval '20 minutes' then
        raise exception 'Absen masuk baru dapat dilakukan mulai pukul % WITA (20 menit sebelum jam masuk %).',
          to_char((v_mulai - interval '20 minutes') at time zone 'Asia/Makassar', 'HH24:MI'),
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
               'akurasi', round(p_akurasi::numeric, 1)
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
           'akurasi', round(p_akurasi::numeric, 1)
         ),
         round(v_jarak::numeric, 1), 'Hadir', v_menit, p_device_token)
      returning * into v_row;
    end if;
  else
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
      raise exception 'Anda sudah melakukan absen pulang hari ini.';
    end if;

    select * into v_jadwal from public.jadwal_kerja(v_user, v_row.tanggal);
    if coalesce(v_jadwal.terjadwal, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then
      v_mulai := public.waktu_wita(v_row.tanggal, v_jadwal.jam_mulai);
      v_selesai := public.waktu_wita(v_row.tanggal, v_jadwal.jam_selesai);
      if v_jadwal.jam_selesai <= v_jadwal.jam_mulai then
        v_selesai := v_selesai + interval '1 day';
      end if;

      if v_waktu < v_selesai + interval '1 minute' then
        raise exception 'Absen pulang baru dapat dilakukan mulai pukul % WITA (setelah jam pulang %).',
          to_char((v_selesai + interval '1 minute') at time zone 'Asia/Makassar', 'HH24:MI'),
          to_char(v_selesai at time zone 'Asia/Makassar', 'HH24:MI');
      end if;
    end if;

    update public.presensi
       set jam_pulang = v_waktu,
           lokasi_pulang = jsonb_build_object(
             'lat', p_lat,
             'lng', p_lng,
             'akurasi', round(p_akurasi::numeric, 1)
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
