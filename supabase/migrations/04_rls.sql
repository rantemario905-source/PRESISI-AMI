-- ==========================================================================
-- 04 — ROW LEVEL SECURITY (RLS) & POLICY
-- Syarat: 01, 02, dan 03 sudah sukses.
-- ==========================================================================

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
