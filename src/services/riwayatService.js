/**
 * ==========================================================================
 * Service: Riwayat Presensi Bulanan Milik Pegawai
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { akhirBulan } from '../utils/format.js'

/**
 * @param {string} userId
 * @param {string} periode - format "YYYY-MM"
 */
export async function ambilRiwayatBulanan(userId, periode) {
  const { data, error } = await supabase
    .from('presensi')
    .select('id, tanggal, jam_masuk, jam_pulang, jarak_masuk, status_kehadiran, menit_terlambat, alasan_koreksi')
    .eq('user_id', userId)
    .gte('tanggal', `${periode}-01`)
    .lte('tanggal', akhirBulan(periode))
    .order('tanggal', { ascending: false })

  if (error) throw error
  return data ?? []
}
