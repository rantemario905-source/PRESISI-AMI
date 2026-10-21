/**
 * ==========================================================================
 * Pemformatan tanggal, jam (WITA), dan jarak
 * ==========================================================================
 */
import { ZONA_WAKTU } from '../config/constants.js'

/** Tanggal hari ini dalam format YYYY-MM-DD menurut zona WITA */
export function hariIni() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WAKTU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** "Senin, 21 Oktober 2026" */
export function formatTanggal(iso, opsi = {}) {
  if (!iso) return '—'
  const tanggal = String(iso).length === 10 ? `${iso}T00:00:00+08:00` : iso
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WAKTU,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opsi,
  }).format(new Date(tanggal))
}

/** "21 Okt 2026" — versi ringkas untuk tabel */
export function formatTanggalRingkas(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WAKTU,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${String(iso).slice(0, 10)}T00:00:00+08:00`))
}

/** "07:15 WITA" dari timestamp ISO */
export function formatJam(iso) {
  if (!iso) return '—'
  const jam = new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WAKTU,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
  return `${jam.replace('.', ':')} WITA`
}

/** "85 m" / "1,2 km" */
export function formatJarak(meter) {
  if (meter === null || meter === undefined || Number.isNaN(meter)) return '—'
  if (meter < 1000) return `${Math.round(meter)} m`
  return `${(meter / 1000).toFixed(2).replace('.', ',')} km`
}

/** Inisial nama untuk avatar, mis. "Budi Santoso" → "BS" */
export function inisialNama(nama = '') {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0].toUpperCase())
    .join('')
}

/* ==========================================================================
 * Helper form (input date/time) & periode laporan
 * ========================================================================== */

/** Nilai untuk <input type="date">: "YYYY-MM-DD" menurut WITA */
export function formatTanggalInput(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WAKTU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

/** Nilai untuk <input type="time">: "HH:mm" menurut WITA */
export function formatJamInput(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_WAKTU,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/**
 * Menggabungkan tanggal "YYYY-MM-DD" + jam "HH:mm" menjadi ISO bertimezone
 * WITA (+08:00). Mengembalikan null bila tanggal kosong.
 */
export function gabungTanggalJam(tanggal, jam) {
  if (!tanggal) return null
  const waktu = jam && jam.length >= 5 ? jam.slice(0, 5) : '00:00'
  return `${tanggal}T${waktu}:00+08:00`
}

/** Daftar tanggal "YYYY-MM-DD" inklusif dari mulai s.d. selesai */
export function daftarTanggal(mulai, selesai) {
  if (!mulai || !selesai || selesai < mulai) return []
  const [tahun, bulan, hari] = mulai.split('-').map(Number)
  const akhir = Date.parse(`${selesai}T00:00:00Z`)
  const hasil = []
  for (let waktu = Date.UTC(tahun, bulan - 1, hari); waktu <= akhir; waktu += 86400000) {
    hasil.push(new Date(waktu).toISOString().slice(0, 10))
  }
  return hasil
}

/** Tanggal akhir bulan dari periode "YYYY-MM" */
export function akhirBulan(periode) {
  const [tahun, bulan] = periode.split('-').map(Number)
  return new Date(Date.UTC(tahun, bulan, 0)).toISOString().slice(0, 10)
}

/** Periode bulan berjalan "YYYY-MM" (WITA) */
export function periodeBulanIni() {
  return hariIni().slice(0, 7)
}

/** "Oktober 2026" dari periode "2026-10" */
export function namaBulan(periode) {
  const [tahun, bulan] = periode.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(tahun, bulan - 1, 1)))
}
