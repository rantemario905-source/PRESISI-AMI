-- ==========================================================================
-- 30 - HITUNG ULANG MENIT TERLAMBAT DATA LAMA
-- Syarat: migrasi 29 sudah dijalankan (hitung_menit_terlambat memakai floor).
--
-- Ringkasan:
--   Migrasi 29 hanya mengubah perhitungan untuk absensi dan koreksi
--   berikutnya. Baris presensi yang sudah tersimpan masih memakai hasil
--   aturan lama (ceil), sehingga absen pukul 08.00.xx tetap terbaca
--   "terlambat 1 menit".
--   Skrip ini menghitung ulang menit_terlambat sejak tanggal go-live
--   (1 November 2026) memakai public.hitung_menit_terlambat() yang baru.
--   Hanya baris yang memiliki jam_masuk yang disentuh; jadwal, status,
--   perangkat, dan data lain tidak diubah. Aman dijalankan berulang
--   (idempoten) karena hanya memperbarui baris yang nilainya berbeda.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.presensi') is null then
    raise exception 'Tabel public.presensi tidak ditemukan. Jalankan migrasi 01-29 pada project Supabase yang benar.';
  end if;

  if to_regprocedure('public.hitung_menit_terlambat(uuid, date, timestamptz)') is null then
    raise exception 'Fungsi public.hitung_menit_terlambat tidak ditemukan. Jalankan migrasi 29 lebih dahulu.';
  end if;
end;
$$;

with hitung as (
  select
    p.id,
    public.hitung_menit_terlambat(p.user_id, p.tanggal, p.jam_masuk) as menit_baru
  from public.presensi p
  where p.jam_masuk is not null
    and p.tanggal >= date '2026-11-01'
)
update public.presensi p
   set menit_terlambat = h.menit_baru
  from hitung h
 where p.id = h.id
   and p.menit_terlambat is distinct from h.menit_baru;

commit;
