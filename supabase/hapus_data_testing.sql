-- ==========================================================================
-- HAPUS DATA TESTING SEBELUM GO-LIVE — PRESISI AMI
-- --------------------------------------------------------------------------
-- Jalankan di Supabase SQL Editor (sebagai owner project, bypass RLS).
--
-- GO-LIVE: 1 November 2026. Semua transaksi bertanggal SEBELUM 1 November
-- 2026 dianggap data testing dan dihapus. Data sejak 1 November 2026
-- DIPERTAHANKAN.
--
-- Yang DIHAPUS (hanya tanggal sebelum cutover):
--   • presensi (termasuk Alfa, koreksi, baris uji coba)
--   • koreksi_presensi (audit yang menempel pada presensi tersebut)
--   • pengaduan_presensi
--   • izin_cuti yang tanggal_selesainya sudah lewat cutover
--   • jadwal_shift
--   • tukar_shift
--
-- Yang DIPERTAHANKAN:
--   • akun login (auth.users) dan profil pegawai
--   • grup shift / unit kerja, master shift, jam kerja, hari libur
--   • penugasan kepala unit dan pengaturan presensi
--   • seluruh transaksi sejak 1 November 2026 (data go-live)
--   • perangkat terdaftar (agar pegawai tidak perlu daftar ulang)
--
-- PERHATIAN:
--   • Data yang dihapus TIDAK dapat dikembalikan. Backup dulu bila ragu.
--   • Foto bukti di bucket `dokumen-izin` tidak ikut terhapus oleh SQL ini.
--     Bila ingin membersihkannya juga, gunakan blok opsional di bawah dengan
--     hati-hati (jalankan SEBELUM delete pengaduan).
--   • Jalankan di luar jam operasional.
-- ==========================================================================

begin;

do $$
declare
  v_cutover date := date '2026-11-01';
  v_hapus   bigint;
begin
  if v_cutover is null then
    raise exception 'Tanggal cutover tidak valid.';
  end if;

  -- OPSIONAL: hapus foto bukti pengaduan yang ikut terhapus.
  -- Hapus tanda komentar bila ingin storage ikut bersih.
  -- delete from storage.objects o
  --  using public.pengaduan_presensi q
  --  where o.bucket_id = 'dokumen-izin'
  --    and o.name = q.dokumen_path
  --    and q.tanggal < v_cutover;

  -- 1. Pengaduan presensi sebelum go-live
  delete from public.pengaduan_presensi
   where tanggal < v_cutover;
  get diagnostics v_hapus = row_count;
  raise notice 'pengaduan_presensi sebelum % dihapus: %', v_cutover, v_hapus;

  -- 2. Audit koreksi yang menempel pada presensi sebelum go-live
  delete from public.koreksi_presensi k
   using public.presensi p
   where k.presensi_id = p.id
     and p.tanggal < v_cutover;
  get diagnostics v_hapus = row_count;
  raise notice 'koreksi_presensi sebelum % dihapus: %', v_cutover, v_hapus;

  -- 3. Presensi sebelum go-live
  delete from public.presensi
   where tanggal < v_cutover;
  get diagnostics v_hapus = row_count;
  raise notice 'presensi sebelum % dihapus: %', v_cutover, v_hapus;

  -- 4. Izin/Cuti/Dinas yang seluruh rentangnya sebelum go-live
  delete from public.izin_cuti
   where tanggal_selesai < v_cutover;
  get diagnostics v_hapus = row_count;
  raise notice 'izin_cuti sebelum % dihapus: %', v_cutover, v_hapus;

  -- 5. Jadwal shift sebelum go-live
  delete from public.jadwal_shift
   where tanggal < v_cutover;
  get diagnostics v_hapus = row_count;
  raise notice 'jadwal_shift sebelum % dihapus: %', v_cutover, v_hapus;

  -- 6. Riwayat tukar shift sebelum go-live
  delete from public.tukar_shift
   where tanggal < v_cutover;
  get diagnostics v_hapus = row_count;
  raise notice 'tukar_shift sebelum % dihapus: %', v_cutover, v_hapus;

  -- OPSIONAL: hapus SEMUA perangkat agar pegawai mendaftar ulang.
  -- Hapus tanda komentar HANYA bila memang ingin semua verifikasi diulang.
  -- delete from public.perangkat;
  -- get diagnostics v_hapus = row_count;
  -- raise notice 'perangkat dihapus: %', v_hapus;

  raise notice 'Selesai. Data sejak % dipertahankan.', v_cutover;
end $$;

commit;

-- ==========================================================================
-- Verifikasi: hitungan sebelum cutover harus 0, data go-live tetap ada
-- ==========================================================================
select 'presensi sebelum 01 Nov 2026'        as keterangan, count(*) as jumlah
  from public.presensi        where tanggal < date '2026-11-01'
union all
select 'presensi sejak 01 Nov 2026 (tetap)', count(*)
  from public.presensi        where tanggal >= date '2026-11-01'
union all
select 'pengaduan sebelum 01 Nov 2026',      count(*)
  from public.pengaduan_presensi where tanggal < date '2026-11-01'
union all
select 'izin sebelum 01 Nov 2026',           count(*)
  from public.izin_cuti       where tanggal_selesai < date '2026-11-01'
union all
select 'jadwal sebelum 01 Nov 2026',         count(*)
  from public.jadwal_shift    where tanggal < date '2026-11-01'
union all
select 'jadwal sejak 01 Nov 2026 (tetap)',   count(*)
  from public.jadwal_shift    where tanggal >= date '2026-11-01'
union all
select 'tukar shift sebelum 01 Nov 2026',    count(*)
  from public.tukar_shift     where tanggal < date '2026-11-01'
union all
select 'pegawai (tetap)',                    count(*) from public.pegawai
union all
select 'perangkat (tetap)',                  count(*) from public.perangkat
order by keterangan;