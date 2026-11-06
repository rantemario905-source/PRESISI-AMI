/**
 * ==========================================================================
 * Service: Rekapitulasi Bulanan
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { akhirBulan } from '../utils/format.js'
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
 * @returns {Promise<{ pegawai: object[], presensi: object[], jadwal: Record<string, string|null>, mulai: string, selesai: string }>}
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
      jadwal: {},
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
  const jadwal = await ambilJadwalPeta(pegawai, mulai, selesai)

  return {
    pegawai,
    presensi,
    jadwal,
    mulai,
    selesai,
  }
}

/** Peta "user_id|tanggal" → nama shift terjadwal untuk pegawai pola shift. */
async function ambilJadwalPeta(pegawai, mulai, selesai) {
  const idPegawaiShift = pegawai
    .filter((p) => p.pola_kerja !== 'reguler')
    .map((p) => p.id)

  if (idPegawaiShift.length === 0) return {}

  const buatKueri = () =>
    supabase
      .from('jadwal_shift')
      .select('user_id, tanggal, shift_master ( nama_shift )')
      .in('user_id', idPegawaiShift)
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
    peta[`${baris.user_id}|${baris.tanggal}`] = baris.shift_master?.nama_shift ?? null
  }
  return peta
}
