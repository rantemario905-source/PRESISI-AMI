/**
 * ==========================================================================
 * Helper cetak jadwal shift (F4 landscape)
 * --------------------------------------------------------------------------
 * Menyusun matriks pegawai × tanggal untuk satu periode, plus pemetaan warna
 * dan singkatan nama shift. Tanggal memakai string "YYYY-MM-DD" (tanpa zona
 * waktu) agar konsisten dengan `src/utils/kalender.js`.
 * ==========================================================================
 */
import { tanggalISO } from './kalender.js'

const POLA_PERIODE = /^(\d{4})-(\d{2})$/

/** Kelompok warna shift: 'pagi', 'siang', 'malam', atau 'lain'. */
export function kelasShift(nama) {
  const teks = String(nama ?? '').toLowerCase()
  if (teks.includes('pagi')) return 'pagi'
  if (teks.includes('siang')) return 'siang'
  if (teks.includes('malam')) return 'malam'
  return 'lain'
}

/** Singkatan 3 huruf untuk sel jadwal, mis. "Pagi" -> "PAG". */
export function singkatShift(nama) {
  const teks = String(nama ?? '').trim()
  if (!teks) return '—'
  return teks.slice(0, 3).toUpperCase()
}

/** Daftar hari dalam periode "YYYY-MM" (urut naik). */
export function daftarHariBulan(periode) {
  const cocok = POLA_PERIODE.exec(String(periode ?? ''))
  if (!cocok) return []

  const tahun = Number(cocok[1])
  const bulan = Number(cocok[2])
  if (bulan < 1 || bulan > 12) return []

  const jumlah = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate()
  return Array.from({ length: jumlah }, (_, indeks) => {
    const nomor = indeks + 1
    const tanggal = tanggalISO(tahun, bulan, nomor)
    const hari = new Date(Date.UTC(tahun, bulan - 1, nomor)).getUTCDay()
    return { tanggal, nomor, hari, akhirPekan: hari === 0 || hari === 6 }
  })
}

/**
 * Matriks jadwal untuk dicetak.
 * @param {{ pegawai?: object[], jadwal?: object[], periode: string }} params
 * @returns {{ pegawai: object, sel: { tanggal: string, nomor: number, akhirPekan: boolean, shift: object|null }[] }[]}
 */
export function susunMatriksJadwal({ pegawai = [], jadwal = [], periode } = {}) {
  const hari = daftarHariBulan(periode)
  const peta = new Map()
  for (const baris of jadwal ?? []) {
    peta.set(`${baris.user_id}|${baris.tanggal}`, baris.shift_master ?? null)
  }

  return (pegawai ?? []).map((p) => ({
    pegawai: p,
    sel: hari.map((h) => ({
      ...h,
      shift: peta.get(`${p.id}|${h.tanggal}`) ?? null,
    })),
  }))
}
