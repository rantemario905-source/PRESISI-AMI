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
  lat: -0.23861315731059254,
  lng: 117.41485548535888,
}

/** Batas maksimal radius absensi dalam meter */
export const MAX_RADIUS_METERS = 100

/**
 * Batas akurasi GPS yang masih dianggap wajar (meter).
 * Jika perangkat melaporkan akurasi lebih buruk dari ini, dianggap
 * tidak valid (bisa jadi emulator / lokasi tiruan).
 */
export const MAX_AKURASI_METERS = 50

/** Zona waktu rumah sakit (WITA) untuk penentuan "hari ini" */
export const ZONA_WAKTU = 'Asia/Makassar'
