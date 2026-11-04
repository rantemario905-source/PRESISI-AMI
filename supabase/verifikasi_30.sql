-- ==========================================================================
-- VERIFIKASI MIGRASI 30 - HITUNG ULANG MENIT TERLAMBAT DATA LAMA
-- Jalankan di Supabase SQL Editor SETELAH 30_hitung_ulang_menit_terlambat.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'hitung_menit_terlambat'
       and pg_get_functiondef(p.oid) like '%floor(extract(epoch from (p_waktu - v_mulai)) / 60.0)%'
  ) as fungsi_hitung_terlambat_memakai_menit_penuh,

  not exists (
    select 1
      from public.presensi p
     where p.jam_masuk is not null
       and p.tanggal >= date '2026-11-01'
       and p.menit_terlambat is distinct from
           public.hitung_menit_terlambat(p.user_id, p.tanggal, p.jam_masuk)
  ) as tidak_ada_selisih_sejak_go_live,

  not exists (
    select 1
      from public.presensi p
     where p.menit_terlambat < 0
  ) as tidak_ada_menit_negatif,

  not exists (
    select 1
      from public.presensi p
      cross join lateral public.jadwal_kerja(p.user_id, p.tanggal) j
     where p.jam_masuk is not null
       and p.tanggal >= date '2026-11-01'
       and coalesce(j.terjadwal, false)
       and j.jam_mulai is not null
       and p.jam_masuk >= public.waktu_wita(p.tanggal, j.jam_mulai)
       and p.jam_masuk < public.waktu_wita(p.tanggal, j.jam_mulai) + interval '1 minute'
       and p.menit_terlambat <> 0
  ) as absen_di_bawah_satu_menit_tidak_terlambat,

  not exists (
    select 1
      from public.presensi p
      cross join lateral public.jadwal_kerja(p.user_id, p.tanggal) j
     where p.jam_masuk is not null
       and p.tanggal >= date '2026-11-01'
       and coalesce(j.terjadwal, false)
       and j.jam_mulai is not null
       and p.jam_masuk >= public.waktu_wita(p.tanggal, j.jam_mulai) + interval '1 minute'
       and p.menit_terlambat < 1
  ) as absen_satu_menit_atau_lebih_tetap_terlambat;
