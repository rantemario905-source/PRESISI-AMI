-- ==========================================================================
-- JADWAL ALFA OTOMATIS (opsional, jalankan setelah migrasi 12)
-- --------------------------------------------------------------------------
-- Supabase Cron memanggil fungsi setiap 15 menit. Fungsi akan membuat Alfa
-- hanya untuk pegawai yang jam kerjanya sudah berakhir dan belum memiliki
-- presensi. Data yang sudah ada tidak digandakan.
--
-- Cara pakai:
--   1. Buka Supabase Dashboard > Database > Extensions.
--   2. Aktifkan ekstensi "pg_cron".
--   3. Jalankan seluruh isi file ini di SQL Editor.
-- ==========================================================================

create extension if not exists pg_cron;

-- Hapus jadwal lama dengan nama yang sama agar tidak menumpuk.
do $$
begin
  perform cron.unschedule('presisi-alfa-otomatis');
exception
  when others then
    -- Belum ada jadwal dengan nama tersebut; lanjutkan.
    null;
end $$;

select cron.schedule(
  'presisi-alfa-otomatis',
  '*/15 * * * *',
  $$select public.proses_alfa_otomatis();$$
);

-- Cek jadwal yang terdaftar:
-- select jobid, schedule, command, active from cron.job;
