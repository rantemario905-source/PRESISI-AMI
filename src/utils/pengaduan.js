/**
 * ==========================================================================
 * Helper pengaduan presensi (absen pulang terlewat)
 * ==========================================================================
 */
import { hariIni } from './format.js'
import { susunWaktuKoreksi } from './koreksiPresensi.js'

export const BATAS_HARI_PENGADUAN = 7

const SATU_HARI_MS = 86_400_000

function tanggalIso(nilai) {
  const iso = String(nilai ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

/** Tanggal batas paling awal yang masih boleh diadukan (YYYY-MM-DD). */
export function batasAwalPengaduan(hariAcuan = hariIni(), batas = BATAS_HARI_PENGADUAN) {
  const acuan = tanggalIso(hariAcuan)
  if (!acuan) return null
  const waktu = Date.parse(`${acuan}T00:00:00Z`) - batas * SATU_HARI_MS
  return new Date(waktu).toISOString().slice(0, 10)
}

/** Apakah tanggal presensi masih dalam 7 hari terakhir (termasuk hari ini). */
export function dalamBatasPengaduan(
  tanggal,
  hariAcuan = hariIni(),
  batas = BATAS_HARI_PENGADUAN,
) {
  const tgl = tanggalIso(tanggal)
  const acuan = tanggalIso(hariAcuan)
  if (!tgl || !acuan) return false

  const selisih = (Date.parse(`${acuan}T00:00:00Z`) - Date.parse(`${tgl}T00:00:00Z`)) / SATU_HARI_MS
  return selisih >= 0 && selisih <= batas
}

/**
 * Susun timestamp jam pulang pengaduan. Shift malam lintas hari otomatis
 * dihitung H+1 (memakai aturan koreksi presensi yang sama).
 */
export function susunWaktuPengaduan({ tanggal, jamPulang, jamMasuk }) {
  const hasil = susunWaktuKoreksi({
    tanggal,
    jamMasuk,
    jamPulang,
    masukAsli: null,
    pulangAsli: null,
  })
  return {
    jamPulangIso: hasil.jamPulangIso,
    pulangLintasHari: hasil.pulangLintasHari,
  }
}
