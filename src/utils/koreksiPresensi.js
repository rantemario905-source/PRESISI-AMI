/**
 * ==========================================================================
 * Penyusun waktu koreksi presensi
 * --------------------------------------------------------------------------
 * Form koreksi hanya menerima jam (HH:mm). Tanggal mulai presensi dipakai
 * sebagai acuan. Shift malam (mis. 20.31 → 08.00) otomatis dihitung H+1.
 *
 * Bila jam tidak diubah admin, timestamp asli dipertahankan agar offset hari
 * yang sudah tersimpan (termasuk absen masuk setelah tengah malam) tidak
 * bergeser.
 * ==========================================================================
 */
import { formatJamInput, gabungTanggalJam } from './format.js'

const SATU_HARI_MS = 86_400_000
const MAKS_GESER_HARI = 7

function tambahHari(iso, hari) {
  return new Date(new Date(iso).getTime() + hari * SATU_HARI_MS).toISOString()
}

function tanggalWita(iso) {
  if (!iso) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

/**
 * Susun timestamp ISO untuk koreksi presensi.
 * @param {{ tanggal: string, jamMasuk?: string, jamPulang?: string,
 *   masukAsli?: string|null, pulangAsli?: string|null }} params
 * @returns {{ jamMasukIso: string|null, jamPulangIso: string|null, pulangLintasHari: boolean }}
 */
export function susunWaktuKoreksi({
  tanggal,
  jamMasuk = '',
  jamPulang = '',
  masukAsli = null,
  pulangAsli = null,
}) {
  let jamMasukIso = null
  let jamPulangIso = null

  if (jamMasuk) {
    const tidakBerubah = Boolean(masukAsli) && jamMasuk === formatJamInput(masukAsli)
    jamMasukIso = tidakBerubah ? masukAsli : gabungTanggalJam(tanggal, jamMasuk)
  }

  if (jamPulang) {
    const tidakBerubah = Boolean(pulangAsli) && jamPulang === formatJamInput(pulangAsli)
    jamPulangIso = tidakBerubah ? pulangAsli : gabungTanggalJam(tanggal, jamPulang)
  }

  if (jamMasukIso && jamPulangIso) {
    let geser = 0
    while (
      new Date(jamPulangIso).getTime() <= new Date(jamMasukIso).getTime() &&
      geser < MAKS_GESER_HARI
    ) {
      jamPulangIso = tambahHari(jamPulangIso, 1)
      geser += 1
    }
  }

  const pulangLintasHari = Boolean(
    jamPulangIso && tanggalWita(jamPulangIso) !== String(tanggal).slice(0, 10),
  )

  return { jamMasukIso, jamPulangIso, pulangLintasHari }
}
