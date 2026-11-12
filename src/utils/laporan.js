/**
 * ==========================================================================
 * Helper laporan presensi bulanan per pegawai
 * ==========================================================================
 */
import { akhirBulan, daftarTanggal } from './format.js'
import { indeksHariSenin } from './kalender.js'

export const STATUS_KEHADIRAN = [
  'Hadir',
  'Sakit',
  'Cuti',
  'Dinas Luar',
  'Izin',
  'Alfa',
]

const AWALAN_PERSETUJUAN = [
  /^Pengaduan(?: absen masuk)? disetujui oleh [^:]*:\s*/i,
  /^Koreksi jam masuk disetujui oleh [^:]*:\s*/i,
]

/**
 * Buang awalan jejak persetujuan dan catatan admin pada `alasan_koreksi`
 * agar yang tersisa hanya alasan aslinya. Dipakai di layar riwayat & admin.
 */
export function bersihkanAlasanKoreksi(nilai) {
  let hasil = String(nilai ?? '').trim()
  if (!hasil) return ''

  for (const pola of AWALAN_PERSETUJUAN) {
    if (pola.test(hasil)) {
      hasil = hasil.replace(pola, '')
      break
    }
  }

  const batas = hasil.indexOf(' | ')
  if (batas >= 0) hasil = hasil.slice(0, batas)

  return hasil.trim()
}

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

/** Nama shift terjadwal untuk kolom laporan. */
export function labelShift(namaShift) {
  return namaShift || '—'
}

const WARNA_STATUS_LAPORAN = {
  Hadir: 'status-hadir',
  Alfa: 'status-alfa',
  Sakit: 'status-sakit',
  Cuti: 'status-cuti',
  'Dinas Luar': 'status-dinas',
  Izin: 'status-izin',
  Koreksi: 'status-koreksi',
  Libur: 'status-libur',
}

/** Kelas warna sel status pada cetakan laporan bulanan. */
export function kelasStatusLaporan(status) {
  return WARNA_STATUS_LAPORAN[status] ?? ''
}

const STATUS_NYATA = new Set([
  'Hadir',
  'Koreksi',
  'Sakit',
  'Cuti',
  'Dinas Luar',
  'Izin',
])

function liburMingguan(jamKerja, unitKerja, isodow) {
  const khusus = jamKerja?.unit?.[unitKerja]?.[isodow]
  if (typeof khusus === 'boolean') return khusus
  return Boolean(jamKerja?.global?.[isodow])
}

/**
 * Tandai libur berurutan (mis. Sabtu+Minggu) agar sel gabungan memakai satu
 * `rowSpan` dengan satu teks saja. Baris pertama grup mendapat `rowSpanLibur`
 * sejumlah hari; baris lanjutan 0. Hanya libur dengan jenis sama yang digabung
 * (libur nasional tetap terpisah dari akhir pekan).
 */
export function tandaiLiburBerurutan(baris = []) {
  return baris.map((hari, indeks) => {
    const sebelumnya = baris[indeks - 1]
    if (!hari.libur || (sebelumnya?.libur && sebelumnya.jenisLibur === hari.jenisLibur)) {
      return { ...hari, rowSpanLibur: 0 }
    }
    let jumlah = 1
    while (
      baris[indeks + jumlah]?.libur &&
      baris[indeks + jumlah].jenisLibur === hari.jenisLibur
    ) {
      jumlah += 1
    }
    return { ...hari, rowSpanLibur: jumlah }
  })
}

/**
 * Susun satu baris untuk setiap tanggal dalam periode laporan.
 * - Presensi nyata (Hadir/Koreksi/Sakit/Cuti/Dinas Luar/Izin) selalu ditampilkan.
 * - Libur: akhir pekan/libur unit, hari libur nasional (pegawai reguler),
 *   atau pegawai shift tanpa jadwal.
 * - Hari kerja tanpa catatan dibiarkan tanpa status ("—").
 *
 * @returns {{ tanggal: string, nomor: number, baris: object|null, libur: boolean, namaLibur: string|null, shift: string|null }[]}
 */
export function susunBarisLaporan({
  periode,
  presensi = [],
  jadwal = {},
  hariLibur = {},
  jamKerja = { global: {}, unit: {} },
  userId,
  unitKerja,
  polaKerja = 'reguler',
} = {}) {
  const tanggal = daftarTanggal(`${periode}-01`, akhirBulan(periode))
  if (tanggal.length === 0) return []

  const petaPresensi = new Map()
  for (const baris of presensi ?? []) {
    if (baris?.tanggal) petaPresensi.set(String(baris.tanggal).slice(0, 10), baris)
  }

  return tanggal.map((tgl, indeks) => {
    const baris = petaPresensi.get(tgl) ?? null
    const shift = jadwal?.[`${userId}|${tgl}`] ?? null
    const presensiNyata = Boolean(baris && STATUS_NYATA.has(baris.status_kehadiran))
    const namaLibur = hariLibur?.[tgl] ?? null

    let libur = false
    let jenisLibur = null
    if (!presensiNyata) {
      if (polaKerja === 'reguler') {
        if (namaLibur) {
          libur = true
          jenisLibur = 'nasional'
        } else {
          const isodow = indeksHariSenin(tgl) + 1
          libur = liburMingguan(jamKerja, unitKerja, isodow)
          if (libur) jenisLibur = 'mingguan'
        }
      } else if (!shift) {
        libur = true
        jenisLibur = 'shift'
      }
    }

    return {
      tanggal: tgl,
      nomor: indeks + 1,
      baris: libur ? null : baris,
      libur,
      jenisLibur,
      namaLibur,
      shift,
    }
  })
}
