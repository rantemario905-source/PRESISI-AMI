/**
 * ==========================================================================
 * PRESISI AMI — Konfigurasi Aplikasi
 * --------------------------------------------------------------------------
 * SATU-SATUNYA sumber koordinat pusat RSUD AMI untuk sisi klien.
 * Catatan: nilai yang sama juga didefinisikan di supabase/schema.sql
 * (fungsi submit_presensi) — keduanya harus disamakan bila berubah.
 * ==========================================================================
 */

export const NAMA_APLIKASI = 'PRESISI AMI'
export const DESKRIPSI_APLIKASI = 'Presensi Sistem Informasi Staf Integrasi'
export const NAMA_RUMAH_SAKIT = 'RSUD Aji Muhammad Idris'

/** Titik pusat geofencing RSUD AMI (dari Google Maps) */
export const RSUD_AMI = {
  lat: -0.23805651650343132,
  lng: 117.41442516465149,
}

/** Batas maksimal radius absensi dalam meter */
export const MAX_RADIUS_METERS = 50

/**
 * Batas akurasi GPS yang masih dianggap wajar (meter).
 * Jika perangkat melaporkan akurasi lebih buruk dari ini, dianggap
 * tidak valid (bisa jadi emulator / lokasi tiruan).
 */
export const MAX_AKURASI_METERS = 50

/** Zona waktu rumah sakit (WITA) untuk penentuan "hari ini" */
export const ZONA_WAKTU = 'Asia/Makassar'

/**
 * Jendela waktu absensi. Nilai yang sama juga dipakai server pada fungsi
 * submit_presensi (supabase/schema.sql) — ubah keduanya bila berubah.
 *
 * - Absen masuk dibuka 60 menit (1 jam) sebelum jam masuk jadwal.
 * - Absen pulang dibuka 1 menit setelah jam pulang jadwal.
 * - Absen pulang ditutup 2 jam (120 menit) setelah jam pulang, berlaku untuk
 *   semua pola kerja termasuk shift malam lintas hari.
 */
export const MENIT_AWAL_ABSEN_MASUK = 60
export const MENIT_JEDA_ABSEN_PULANG = 1
export const MENIT_TUTUP_ABSEN_PULANG = 120

/** Penanda tangan tetap pada laporan presensi bulanan pegawai. */
export const PENANDA_TANGAN_LAPORAN = {
  jabatan: 'Kasubbag Tata Usaha',
  nama: 'Suriami, SKM., M.Kes',
  nip: '197312302007012011',
}
