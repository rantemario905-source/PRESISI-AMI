-- ==========================================================================
-- MIGRASI 39 - STATUS KEMBALI HADIR SETELAH KOREKSI
-- --------------------------------------------------------------------------
-- Koreksi presensi (koreksi Super Admin maupun pengaduan yang disetujui)
-- sebelumnya menulis status 'Koreksi'. Akibatnya hari tersebut tidak terhitung
-- hadir pada rekapitulasi dan laporan bulanan.
--
-- Aturan baru:
--   1. Status akhir presensi yang dikoreksi tetap 'Hadir'.
--   2. Jejak koreksi disimpan terpisah: dikoreksi_oleh, alasan_koreksi,
--      tabel koreksi_presensi, dan pengaduan_presensi.
--   3. Semua nilai 'Koreksi' yang disimpan diubah menjadi 'Hadir' (termasuk
--      data lama), sehingga rekap bulan-bulan sebelumnya ikut benar.
--
-- Nilai 'Koreksi' tetap sah di constraint presensi untuk kompatibilitas data
-- historis, tetapi tidak lagi pernah tersimpan.
-- ==========================================================================

create or replace function public.normalisasi_status_koreksi()
returns trigger
language plpgsql
as $$
begin
  if new.status_kehadiran = 'Koreksi' then
    new.status_kehadiran := 'Hadir';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_normalisasi_status_koreksi on public.presensi;

create trigger trg_normalisasi_status_koreksi
before insert or update on public.presensi
for each row execute function public.normalisasi_status_koreksi();

-- Backfill data lama: hanya baris yang sudah punya jam masuk.
update public.presensi
   set status_kehadiran = 'Hadir'
 where status_kehadiran = 'Koreksi'
   and jam_masuk is not null;
