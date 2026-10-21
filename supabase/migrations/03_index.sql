-- ==========================================================================
-- 03 — INDEX
-- Syarat: 01_tabel.sql sudah sukses.
-- ==========================================================================

create index if not exists idx_presensi_user_tanggal on public.presensi (user_id, tanggal desc);
create index if not exists idx_presensi_tanggal      on public.presensi (tanggal desc);
create index if not exists idx_jadwal_user_tanggal   on public.jadwal_shift (user_id, tanggal);
create index if not exists idx_perangkat_status      on public.perangkat (status);
create index if not exists idx_izin_status           on public.izin_cuti (status);

-- Kebijakan 1 pegawai = 1 perangkat aktif, dijamin di level database
create unique index if not exists uq_perangkat_disetujui
  on public.perangkat (user_id) where status = 'approved';
