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
--   • akun login (auth.users) dan profil pegawai (92 pegawai)
--   • grup shift / unit kerja
--   • nama & unit kerja yang sudah diisi
--   • penugasan kepala unit (tabel kepala_unit) dan akun kepala ASN
--   • master shift (Pagi/Siang/Malam)
--   • jam kerja reguler, hari libur, dan pengaturan aplikasi
--
-- PERHATIAN:
--   • Script ini TIDAK menghapus pegawai, grup shift, atau master shift.
--   • Semua pegawai harus mengajukan verifikasi perangkat ulang setelah ini.
--   • Data yang dihapus TIDAK dapat dikembalikan. Backup dulu bila ragu.
--   • Jalankan di luar jam operasional.
-- ==========================================================================

begin;

do $$
declare
  v_pegawai_awal   bigint;
  v_grup_awal      bigint;
  v_shift_awal     bigint;
  v_pegawai_akhir  bigint;
  v_grup_akhir     bigint;
  v_shift_akhir    bigint;
  v_hapus          bigint;
begin
  select count(*) into v_pegawai_awal from public.pegawai;
  select count(*) into v_grup_awal from public.grup_shift;
  select count(*) into v_shift_awal from public.shift_master;

  delete from public.koreksi_presensi;
  get diagnostics v_hapus = row_count;
  raise notice 'koreksi_presensi dihapus: %', v_hapus;

  delete from public.presensi;
  get diagnostics v_hapus = row_count;
  raise notice 'presensi dihapus: %', v_hapus;

  delete from public.izin_cuti;
  get diagnostics v_hapus = row_count;
  raise notice 'izin_cuti dihapus: %', v_hapus;

  delete from public.jadwal_shift;
  get diagnostics v_hapus = row_count;
  raise notice 'jadwal_shift dihapus: %', v_hapus;

  if to_regclass('public.jadwal_shift_final') is not null then
    execute 'delete from public.jadwal_shift_final';
    get diagnostics v_hapus = row_count;
    raise notice 'jadwal_shift_final dihapus: %', v_hapus;
  end if;

  delete from public.perangkat;
  get diagnostics v_hapus = row_count;
  raise notice 'perangkat dihapus: %', v_hapus;

  select count(*) into v_pegawai_akhir from public.pegawai;
  select count(*) into v_grup_akhir from public.grup_shift;
  select count(*) into v_shift_akhir from public.shift_master;

  if v_pegawai_akhir <> v_pegawai_awal then
    raise exception 'Dibatalkan: jumlah pegawai berubah (% -> %).',
      v_pegawai_awal, v_pegawai_akhir;
  end if;
  if v_grup_akhir <> v_grup_awal then
    raise exception 'Dibatalkan: jumlah grup shift berubah (% -> %).',
      v_grup_awal, v_grup_akhir;
  end if;
  if v_shift_akhir <> v_shift_awal then
    raise exception 'Dibatalkan: jumlah master shift berubah (% -> %).',
      v_shift_awal, v_shift_akhir;
  end if;

  raise notice 'Aman: pegawai tetap %, grup shift tetap %, master shift tetap %.',
    v_pegawai_akhir, v_grup_akhir, v_shift_akhir;
end $$;

commit;

-- ==========================================================================
-- Verifikasi: data transaksi harus 0, data master tetap ada
-- ==========================================================================
select 'presensi'          as tabel, count(*) as jumlah from public.presensi
union all
select 'koreksi_presensi', count(*) from public.koreksi_presensi
union all
select 'izin_cuti',        count(*) from public.izin_cuti
union all
select 'jadwal_shift',     count(*) from public.jadwal_shift
union all
select 'perangkat',        count(*) from public.perangkat
union all
select 'pegawai (tetap)',  count(*) from public.pegawai
union all
select 'grup_shift (tetap)', count(*) from public.grup_shift
union all
select 'shift_master (tetap)', count(*) from public.shift_master
order by tabel;
