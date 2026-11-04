/**
 * ============================================================================
 * Utilitas kalender untuk pemilih periode (tanggal murni tanpa zona waktu)
 * ----------------------------------------------------------------------------
 * Semua nilai tanggal memakai string "YYYY-MM-DD" agar tidak bergeser karena
 * zona waktu perangkat. Perhitungan hari memakai UTC sebagai kalender netral.
 * ============================================================================
 */

const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/
const POLA_PERIODE = /^(\d{4})-(\d{2})$/

export const NAMA_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/** Memecah "YYYY-MM-DD" menjadi bagian tanggal yang valid, atau null. */
export function pecahTanggal(nilai) {
  const cocok = POLA_TANGGAL.exec(String(nilai ?? '').slice(0, 10))
  if (!cocok) return null

  const tahun = Number(cocok[1])
  const bulan = Number(cocok[2])
  const hari = Number(cocok[3])
  if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31) return null

  const tanggal = new Date(0)
  tanggal.setUTCFullYear(tahun, bulan - 1, hari)
  tanggal.setUTCHours(0, 0, 0, 0)
  if (
    tanggal.getUTCFullYear() !== tahun ||
    tanggal.getUTCMonth() !== bulan - 1 ||
    tanggal.getUTCDate() !== hari
  ) {
    return null
  }

  return { tahun, bulan, hari }
}

/** Memastikan string tanggal valid. */
export function tanggalValid(nilai) {
  return pecahTanggal(nilai) !== null
}

/** Menyusun "YYYY-MM-DD" dari komponen tanggal. */
export function tanggalISO(tahun, bulan, hari) {
  const tanggal = new Date(0)
  tanggal.setUTCFullYear(Number(tahun), Number(bulan) - 1, Number(hari))
  tanggal.setUTCHours(0, 0, 0, 0)
  if (Number.isNaN(tanggal.getTime())) return ''
  return tanggal.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" -> "YYYY-MM". */
export function periodeDariTanggal(nilai) {
  return pecahTanggal(nilai) ? String(nilai).slice(0, 7) : ''
}

/** Menggeser periode "YYYY-MM" sebanyak delta bulan. */
export function geserBulan(periode, delta = 0) {
  const cocok = POLA_PERIODE.exec(String(periode ?? ''))
  if (!cocok) return ''
  const tahun = Number(cocok[1])
  const bulan = Number(cocok[2])
  if (bulan < 1 || bulan > 12) return ''
  const tanggal = new Date(Date.UTC(tahun, bulan - 1 + Number(delta), 1))
  if (Number.isNaN(tanggal.getTime())) return ''
  return tanggal.toISOString().slice(0, 7)
}

/** Indeks hari dalam minggu, Senin = 0 ... Minggu = 6. */
export function indeksHariSenin(tanggal) {
  const bagian = pecahTanggal(tanggal)
  if (!bagian) return 0
  const hari = new Date(Date.UTC(bagian.tahun, bagian.bulan - 1, bagian.hari)).getUTCDay()
  return (hari + 6) % 7
}

/**
 * Matriks hari untuk satu periode "YYYY-MM".
 * Minggu dimulai Senin dan panjangnya kelipatan 7 (28-42 sel).
 */
export function matriksBulan(periode) {
  const cocok = POLA_PERIODE.exec(String(periode ?? ''))
  if (!cocok) return []

  const tahun = Number(cocok[1])
  const bulan = Number(cocok[2])
  if (bulan < 1 || bulan > 12) return []

  const jumlahHariBulan = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate()
  const pertama = tanggalISO(tahun, bulan, 1)
  const offset = indeksHariSenin(pertama)
  const totalSel = Math.ceil((offset + jumlahHariBulan) / 7) * 7

  return Array.from({ length: totalSel }, (_, indeks) => {
    const selisih = indeks - offset + 1
    const tanggal = new Date(Date.UTC(tahun, bulan - 1, selisih))
    const tanggalStr = tanggal.toISOString().slice(0, 10)
    const hari = tanggal.getUTCDay()
    return {
      tanggal: tanggalStr,
      hari,
      diBulanIni: selisih >= 1 && selisih <= jumlahHariBulan,
      akhirPekan: hari === 0 || hari === 6,
    }
  })
}

/** Jumlah hari inklusif dari rentang; 0 bila tidak valid/terbalik. */
export function jumlahHari(mulai, selesai) {
  if (!tanggalValid(mulai) || !tanggalValid(selesai) || selesai < mulai) return 0
  const awal = Date.parse(`${mulai}T00:00:00Z`)
  const akhir = Date.parse(`${selesai}T00:00:00Z`)
  return Math.round((akhir - awal) / 86400000) + 1
}

/** Menggeser satu tanggal harian; mengembalikan '' bila tidak valid. */
export function geserTanggal(tanggal, hari = 0) {
  const bagian = pecahTanggal(tanggal)
  if (!bagian) return ''
  const hasil = new Date(Date.UTC(bagian.tahun, bagian.bulan - 1, bagian.hari + Number(hari)))
  if (Number.isNaN(hasil.getTime())) return ''
  return hasil.toISOString().slice(0, 10)
}
