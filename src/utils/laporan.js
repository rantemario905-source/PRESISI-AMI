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

/**
 * Isi kolom "Keterangan" laporan bulanan. Hanya Sakit/Cuti/Dinas Luar dan
 * pengaduan yang disetujui yang dicantumkan. Koreksi manual Super Admin,
 * Alfa, dan tukar shift tidak ditampilkan.
 */
export function keteranganPresensi(
  baris,
  { alasanIzin = {}, alasanPengaduan = {} } = {},
) {
  const kunci = `${baris.user_id}|${baris.tanggal}`
  if (STATUS_BERALASAN.includes(baris.status_kehadiran)) {
    return alasanIzin[kunci] || '—'
  }
  return alasanPengaduan[kunci] || '—'
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

/** Ringkasan shift terjadwal untuk kolom laporan, mis. "Pagi 07:30–14:30". */
export function labelShift(shift) {
  if (!shift) return '—'
  const nama = shift.nama_shift ?? '—'
  const jam = (nilai) => String(nilai ?? '').slice(0, 5)
  if (!shift.jam_mulai) return nama
  return `${nama} ${jam(shift.jam_mulai)}–${jam(shift.jam_selesai)}`
}

/**
 * Ringkas kejadian tukar shift dari sudut pandang satu pegawai.
 * @returns {{ id: string, tanggal: string, rekan: string, asal: string, baru: string, alasan: string }[]}
 */
export function ringkasTukar(daftar = [], pegawaiId) {
  return (daftar ?? [])
    .filter((b) => b.pegawai_a === pegawaiId || b.pegawai_b === pegawaiId)
    .map((b) => {
      const sebagaiA = b.pegawai_a === pegawaiId
      return {
        id: b.id,
        tanggal: b.tanggal,
        rekan: (sebagaiA ? b.orang_b?.nama : b.orang_a?.nama) ?? '—',
        asal: (sebagaiA ? b.sa_lama?.nama_shift : b.sb_lama?.nama_shift) ?? '—',
        baru: (sebagaiA ? b.sa_baru?.nama_shift : b.sb_baru?.nama_shift) ?? '—',
        alasan: b.alasan ?? '',
      }
    })
    .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)))
}
