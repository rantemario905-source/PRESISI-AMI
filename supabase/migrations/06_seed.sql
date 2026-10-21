-- ==========================================================================
-- 06 — DATA AWAL: Master Shift
-- Syarat: 01 dan 03 sudah sukses.
-- ==========================================================================

insert into public.shift_master (nama_shift, jam_mulai, jam_selesai)
values
  ('Pagi',  '07:00', '14:00'),
  ('Siang', '14:00', '21:00'),
  ('Malam', '21:00', '07:00')
on conflict (nama_shift) do nothing;

-- Verifikasi (opsional): harus mengembalikan 3 baris.
-- select * from public.shift_master order by jam_mulai;
