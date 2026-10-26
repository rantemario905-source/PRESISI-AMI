-- ==========================================================================
-- BERSIHKAN DATA UJI — PRESISI AMI
-- --------------------------------------------------------------------------
-- Jalankan di Supabase SQL Editor (sebagai owner project, bypass RLS).
--
-- Yang DIHAPUS:
--   • seluruh presensi (termasuk presensi mock / hasil koreksi)
--   • seluruh audit koreksi presensi
--   • seluruh pengajuan izin/cuti/dinas
--   • seluruh jadwal shift
--   • seluruh data perangkat (device binding)
--
-- Yang DIPERTAHANKAN:
--   • akun login (auth.users) dan profil pegawai
--   • nama & unit kerja yang sudah diisi
--   • master shift (Pagi/Siang/Malam)
--   • pengaturan aplikasi lainnya
--
-- PERHATIAN:
--   • Semua pegawai harus mengajukan verifikasi perangkat ulang setelah ini.
--   • Data yang dihapus TIDAK dapat dikembalikan. Backup dulu bila ragu.
--   • Jalankan di luar jam operasional.
-- ==========================================================================

begin;

delete from public.koreksi_presensi;
delete from public.presensi;
delete from public.izin_cuti;
delete from public.jadwal_shift;
delete from public.perangkat;

commit;

-- ==========================================================================
-- Verifikasi: semua angka harus 0
-- ==========================================================================
select 'presensi'          as tabel, count(*) as sisa from public.presensi
union all
select 'koreksi_presensi', count(*) from public.koreksi_presensi
union all
select 'izin_cuti',        count(*) from public.izin_cuti
union all
select 'jadwal_shift',     count(*) from public.jadwal_shift
union all
select 'perangkat',        count(*) from public.perangkat
order by tabel;
