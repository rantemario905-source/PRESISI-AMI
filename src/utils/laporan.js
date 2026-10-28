/**
 * ==========================================================================
 * Helper laporan presensi bulanan per pegawai
 * ==========================================================================
 */

export const STATUS_KEHADIRAN = [
  'Hadir',
  'Sakit',
  'Cuti',
  'Dinas Luar',
  'Alfa',
  'Koreksi',
]

export const STATUS_BERALASAN = ['Sakit', 'Cuti', 'Dinas Luar']

/** Kelompokkan baris presensi berdasarkan user_id. */
export function kelompokkanPresensi(daftar = []) {
  const peta = new Map()
  for (const baris of daftar) {
    if (!peta.has(baris.user_id)) peta.set(baris.user_id, [])
    peta.get(baris.user_id).push(baris)
  }
  return peta
}

/** Ringkasan jumlah status dan keterlambatan dari baris presensi. */
export function ringkasKehadiran(daftar = []) {
  const hitungan = Object.fromEntries(STATUS_KEHADIRAN.map((status) => [status, 0]))
  let terlambat = 0
  let totalMenitTerlambat = 0

  for (const baris of daftar) {
    if (hitungan[baris.status_kehadiran] !== undefined) {
      hitungan[baris.status_kehadiran] += 1
    }
    const menit = Number(baris.menit_terlambat ?? 0)
    if (menit > 0) {
      terlambat += 1
      totalMenitTerlambat += menit
    }
  }

  return {
    hitungan,
    terlambat,
    totalMenitTerlambat,
    total: daftar.length,
  }
}

/** Label pola kerja pegawai. */
export function labelPolaKerja(polaKerja) {
  return polaKerja === 'reguler' ? 'Reguler' : 'Shift'
}
