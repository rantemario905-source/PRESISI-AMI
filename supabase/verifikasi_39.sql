-- ==========================================================================
-- VERIFIKASI MIGRASI 39 - STATUS KEMBALI HADIR SETELAH KOREKSI
-- Jalankan di Supabase SQL Editor SETELAH 39_status_hadir_setelah_koreksi.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1 from pg_trigger
     where tgrelid = 'public.presensi'::regclass
       and tgname = 'trg_normalisasi_status_koreksi'
       and not tgisinternal
  ) as trigger_normalisasi_ada,

  not exists (
    select 1 from public.presensi
     where status_kehadiran = 'Koreksi'
       and jam_masuk is not null
  ) as tidak_ada_koreksi_berjam_masuk,

  (select count(*) from public.presensi where status_kehadiran = 'Koreksi')
    as sisa_status_koreksi,

  exists (
    select 1 from pg_proc
     where oid = 'public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, timestamptz, text)'::regprocedure
       and prosecdef
  ) as putuskan_pengaduan_security_definer,

  exists (
    select 1 from pg_proc
     where oid = 'public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text)'::regprocedure
       and prosecdef
  ) as koreksi_presensi_security_definer;

-- Uji manual cepat: koreksi satu baris lewat aplikasi, lalu pastikan
-- status_kehadiran menjadi 'Hadir' dan dikoreksi_oleh/alasan_koreksi terisi.
