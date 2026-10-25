/**
 * ==========================================================================
 * Service: Rekapitulasi Bulanan
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { akhirBulan } from '../utils/format.js'
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

  let kueri = supabase
    .from('presensi')
    .select(
      'id, user_id, tanggal, jam_masuk, jam_pulang, status_kehadiran, menit_terlambat, jarak_masuk, pegawai:pegawai!presensi_user_id_fkey!inner ( nama, unit_kerja )',
    )
    .gte('tanggal', mulai)
    .lte('tanggal', selesai)
    .order('tanggal', { ascending: true })

  if (unit !== 'semua') kueri = kueri.eq('pegawai.unit_kerja', unit)

  const { data, error } = await kueri
  if (error) throw error

  return { pegawai, presensi: data ?? [], mulai, selesai }
}
