-- ==========================================================================
-- 01 — TABEL DASAR
-- Jalankan blok ini di Supabase SQL Editor, tunggu sampai "Success",
-- baru lanjut ke file 02_fungsi.sql.
-- ==========================================================================

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

-- ==========================================================================
-- Verifikasi (opsional): jalankan terpisah setelah blok di atas sukses.
-- Harus mengembalikan 7 baris.
-- ==========================================================================
-- select tablename from pg_tables where schemaname = 'public' order by tablename;
