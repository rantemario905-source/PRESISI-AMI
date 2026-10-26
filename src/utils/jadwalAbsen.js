/**
 * ==========================================================================
 * Jendela waktu absensi
 * --------------------------------------------------------------------------
 * Aturan (sama dengan validasi server di submit_presensi):
 *   - Absen masuk dibuka MENIT_AWAL_ABSEN_MASUK menit sebelum jam masuk.
 *   - Absen pulang dibuka MENIT_JEDA_ABSEN_PULANG menit setelah jam pulang.
 * Berlaku untuk pola Reguler maupun Shift, termasuk shift malam lintas hari.
 * ==========================================================================
 */
import {
  MENIT_AWAL_ABSEN_MASUK,
  MENIT_JEDA_ABSEN_PULANG,
  ZONA_WAKTU,
} from '../config/constants.js'

const OFFSET_WITA = '+08:00'

/** Gabungkan tanggal "YYYY-MM-DD" + jam "HH:mm[:ss]" menjadi Date (WITA). */
function keWaktu(tanggal, jam, tambahHari = 0) {
  if (!tanggal || !jam) return null
  const bersih = String(jam).slice(0, 8)
  const waktu = new Date(
    `${String(tanggal).slice(0, 10)}T${bersih}${OFFSET_WITA}`,
  )
  if (!Number.isFinite(waktu.getTime())) return null
  if (tambahHari) waktu.setUTCDate(waktu.getUTCDate() + tambahHari)
  return waktu
}

/** Shift malam: jam selesai lebih kecil/sama dengan jam mulai (lintas hari). */
export function jadwalLintasHari(jadwal) {
  if (!jadwal?.jam_mulai || !jadwal?.jam_selesai) return false
  return (
    String(jadwal.jam_selesai).slice(0, 8) <=
    String(jadwal.jam_mulai).slice(0, 8)
  )
}

/** Waktu tombol Absen Masuk dibuka, atau null bila tidak ada jadwal. */
export function bukaAbsenMasuk(jadwal) {
  if (!jadwal?.terjadwal || jadwal.boleh_absen === false) return null
  const mulai = keWaktu(jadwal.tanggal, jadwal.jam_mulai)
  if (!mulai) return null
  return new Date(mulai.getTime() - MENIT_AWAL_ABSEN_MASUK * 60_000)
}

/** Waktu tombol Absen Pulang dibuka, atau null bila tidak ada jadwal. */
export function bukaAbsenPulang(jadwal) {
  if (!jadwal?.terjadwal || jadwal.boleh_absen === false) return null
  const selesai = keWaktu(
    jadwal.tanggal,
    jadwal.jam_selesai,
    jadwalLintasHari(jadwal) ? 1 : 0,
  )
  if (!selesai) return null
  return new Date(selesai.getTime() + MENIT_JEDA_ABSEN_PULANG * 60_000)
}

/** "07.40" atau "16.31" menurut WITA. */
export function formatJamBuka(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WAKTU,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace('.', ':')
}

/** "08.00" dari nilai time PostgreSQL "08:00:00". */
export function formatJamJadwal(jam) {
  if (!jam) return ''
  return String(jam).slice(0, 5).replace('.', ':')
}
