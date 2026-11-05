/**
 * ==========================================================================
 * Service: Rekapitulasi Bulanan
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { akhirBulan, daftarTanggal } from '../utils/format.js'
import { ambilSemuaHalaman } from '../utils/paginasi.js'
import { ambilSemuaPegawai } from './pegawaiService.js'

/**
 * Data mentah rekap satu bulan + daftar pegawai (termasuk yang tidak punya
 * catatan presensi) untuk ditampilkan/diolah di halaman rekap.
 *
 * @param {{ periode: string, unit?: string }} params
 *        periode format "YYYY-MM", unit "semua" atau nama unit
 */
export async function ambilRekapBulanan({ periode, unit = 'semua' }) {
  const mulai = `${periode}-01`
  const selesai = akhirBulan(periode)

  const semuaPegawai = await ambilSemuaPegawai()
  const pegawai =
    unit === 'semua' ? semuaPegawai : semuaPegawai.filter((p) => p.unit_kerja === unit)

  const buatKueri = () => {
    let kueri = supabase
      .from('presensi')
      .select(
        'id, user_id, tanggal, jam_masuk, jam_pulang, status_kehadiran, menit_terlambat, jarak_masuk, pegawai:pegawai!presensi_user_id_fkey!inner ( nama, unit_kerja )',
      )
      .gte('tanggal', mulai)
      .lte('tanggal', selesai)

    if (unit !== 'semua') kueri = kueri.eq('pegawai.unit_kerja', unit)

    return kueri
      .order('tanggal', { ascending: true })
      .order('user_id', { ascending: true })
  }

  const presensi = await ambilSemuaHalaman(buatKueri)

  return { pegawai, presensi, mulai, selesai }
}

/**
 * Data laporan presensi bulanan per pegawai.
 * Kepala ruangan otomatis dibatasi RLS ke unitnya sendiri.
 *
 * @param {{ periode: string, unit: string }} params
 * @returns {Promise<{ pegawai: object[], presensi: object[], alasanIzin: Record<string, string>, mulai: string, selesai: string }>}
 */
export async function ambilLaporanBulanan({ periode, unit }) {
  const mulai = `${periode}-01`
  const selesai = akhirBulan(periode)

  const semuaPegawai = await ambilSemuaPegawai()
  const pegawai =
    !unit || unit === 'semua'
      ? semuaPegawai
      : semuaPegawai.filter((p) => p.unit_kerja === unit)

  if (pegawai.length === 0) {
    return {
      pegawai: [],
      presensi: [],
      alasanIzin: {},
      alasanPengaduan: {},
      jadwal: {},
      tukar: [],
      mulai,
      selesai,
    }
  }

  const idPegawai = pegawai.map((p) => p.id)
  const buatKueri = () =>
    supabase
      .from('presensi')
      .select(
        'id, user_id, tanggal, jam_masuk, jam_pulang, status_kehadiran, menit_terlambat',
      )
      .in('user_id', idPegawai)
      .gte('tanggal', mulai)
      .lte('tanggal', selesai)
      .order('tanggal', { ascending: true })
      .order('user_id', { ascending: true })

  const presensi = await ambilSemuaHalaman(buatKueri)

  const [alasanIzin, alasanPengaduan, jadwal, tukar] = await Promise.all([
    ambilAlasanIzin(idPegawai, mulai, selesai),
    ambilAlasanPengaduan(idPegawai, mulai, selesai),
    ambilJadwalPeta(idPegawai, mulai, selesai),
    ambilTukarBulan(idPegawai, mulai, selesai),
  ])

  return {
    pegawai,
    presensi,
    alasanIzin,
    alasanPengaduan,
    jadwal,
    tukar,
    mulai,
    selesai,
  }
}

/** Peta "user_id|tanggal" → alasan pengaduan yang disetujui (opsional). */
async function ambilAlasanPengaduan(idPegawai, mulai, selesai) {
  const buatKueri = () =>
    supabase
      .from('pengaduan_presensi')
      .select('user_id, tanggal, alasan, dibuat_pada')
      .in('user_id', idPegawai)
      .eq('status', 'disetujui')
      .gte('tanggal', mulai)
      .lte('tanggal', selesai)
      .order('dibuat_pada', { ascending: true })

  let data
  try {
    data = await ambilSemuaHalaman(buatKueri)
  } catch {
    return {}
  }

  const peta = {}
  for (const baris of data ?? []) {
    const kunci = `${baris.user_id}|${baris.tanggal}`
    const alasan = String(baris.alasan ?? '').trim()
    if (!alasan) continue
    if (!peta[kunci]) {
      peta[kunci] = alasan
    } else if (!peta[kunci].includes(alasan)) {
      peta[kunci] = `${peta[kunci]} · ${alasan}`
    }
  }
  return peta
}

/** Peta "user_id|tanggal" → ringkasan shift terjadwal. */
async function ambilJadwalPeta(idPegawai, mulai, selesai) {
  const buatKueri = () =>
    supabase
      .from('jadwal_shift')
      .select('user_id, tanggal, shift_master ( nama_shift, jam_mulai, jam_selesai )')
      .in('user_id', idPegawai)
      .gte('tanggal', mulai)
      .lte('tanggal', selesai)
      .order('tanggal', { ascending: true })

  let data
  try {
    data = await ambilSemuaHalaman(buatKueri)
  } catch {
    return {}
  }

  const peta = {}
  for (const baris of data ?? []) {
    peta[`${baris.user_id}|${baris.tanggal}`] = baris.shift_master ?? null
  }
  return peta
}

/** Daftar kejadian tukar shift yang melibatkan pegawai terpilih pada bulan itu. */
async function ambilTukarBulan(idPegawai, mulai, selesai) {
  const buatKueri = () =>
    supabase
      .from('tukar_shift')
      .select(
        [
          'id, tanggal, pegawai_a, pegawai_b, alasan',
          'orang_a:pegawai!tukar_shift_pegawai_a_fkey ( nama )',
          'orang_b:pegawai!tukar_shift_pegawai_b_fkey ( nama )',
          'sa_lama:shift_master!tukar_shift_shift_a_lama_fkey ( nama_shift )',
          'sb_lama:shift_master!tukar_shift_shift_b_lama_fkey ( nama_shift )',
          'sa_baru:shift_master!tukar_shift_shift_a_baru_fkey ( nama_shift )',
          'sb_baru:shift_master!tukar_shift_shift_b_baru_fkey ( nama_shift )',
        ].join(', '),
      )
      .gte('tanggal', mulai)
      .lte('tanggal', selesai)
      .order('tanggal', { ascending: true })

  let data
  try {
    data = await ambilSemuaHalaman(buatKueri)
  } catch {
    return []
  }

  const kumpulan = new Set(idPegawai)
  return (data ?? []).filter(
    (baris) => kumpulan.has(baris.pegawai_a) || kumpulan.has(baris.pegawai_b),
  )
}

/** Peta "user_id|tanggal" → alasan izin yang disetujui (opsional, tidak fatal). */
async function ambilAlasanIzin(idPegawai, mulai, selesai) {
  const buatKueri = () =>
    supabase
      .from('izin_cuti')
      .select('user_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status')
      .in('user_id', idPegawai)
      .eq('status', 'disetujui')
      .lte('tanggal_mulai', selesai)
      .gte('tanggal_selesai', mulai)
      .order('id', { ascending: true })

  let data
  try {
    data = await ambilSemuaHalaman(buatKueri)
  } catch {
    return {}
  }

  const peta = {}
  for (const izin of data ?? []) {
    for (const tanggal of daftarTanggal(izin.tanggal_mulai, izin.tanggal_selesai)) {
      if (tanggal < mulai || tanggal > selesai) continue
      peta[`${izin.user_id}|${tanggal}`] = izin.alasan
    }
  }
  return peta
}
