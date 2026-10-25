-- ==========================================================================
-- 06 — DATA AWAL: Master Shift
-- Syarat: 01 dan 03 sudah sukses.
-- ==========================================================================

insert into public.shift_master (nama_shift, jam_mulai, jam_selesai)
values
  ('Pagi',  '07:30', '14:30'),
  ('Siang', '14:30', '21:30'),
  ('Malam', '21:30', '07:30')
on conflict (nama_shift) do nothing;

-- Verifikasi (opsional): harus mengembalikan 3 baris.
-- select * from public.shift_master order by jam_mulai;
