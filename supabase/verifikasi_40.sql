-- ==========================================================================
-- VERIFIKASI MIGRASI 40 - HAK AKSES jadwal_kerja SESUAI kepala_unit
-- Jalankan di Supabase SQL Editor SETELAH 40_jadwal_kerja_hak_akses.sql.
-- Semua nilai pemeriksaan harus true.
-- ==========================================================================

select
  exists (
    select 1 from pg_proc
     where oid = 'public.jadwal_kerja(uuid, date)'::regprocedure
       and prosecdef
       and pg_get_functiondef(oid) ilike '%bisa_lihat_presensi%'
  ) as jadwal_kerja_pakai_bisa_lihat_presensi,

  not exists (
    select 1 from pg_proc
     where oid = 'public.jadwal_kerja(uuid, date)'::regprocedure
       and pg_get_functiondef(oid) ilike '%saya.kepala_ruangan%'
  ) as aturan_lama_kepala_ruangan_hilang,

  not exists (
    select 1 from pg_proc
     where oid = 'public.jadwal_kerja(uuid, date)'::regprocedure
       and pg_get_functiondef(oid) ilike '%saya.unit_kerja = target.unit_kerja%'
  ) as aturan_unit_tunggal_hilang,

  has_function_privilege('authenticated', 'public.jadwal_kerja(uuid, date)', 'EXECUTE')
    as authenticated_boleh_execute,

  not has_function_privilege('anon', 'public.jadwal_kerja(uuid, date)', 'EXECUTE')
    as anon_tidak_boleh_execute;

-- Uji manual cepat: login sebagai kepala unit (termasuk kepala multi-unit atau
-- kepala ASN), setujui satu pengaduan presensi pegawai di unit yang dikelola.
-- Sebelum migrasi 40 muncul "Anda tidak berhak melihat jadwal pegawai ini.";
-- sesudah migrasi harus tersimpan tanpa galat.
