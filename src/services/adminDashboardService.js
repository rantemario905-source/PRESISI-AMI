/**
 * ==========================================================================
 * Service: Dashboard Utama Super Admin
 * --------------------------------------------------------------------------
 * Statistik ringkas + pemantauan presensi hari ini (real-time).
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { hariIni } from '../utils/format.js'

/** @returns {Promise<{totalPegawai:number, hadirHariIni:number, pendingPerangkat:number, sudahPulang:number}>} */
export async function ambilStatistik() {
  const hari = hariIni()

  const [pegawai, hadir, pending, pulang] = await Promise.all([
    supabase.from('pegawai').select('*', { count: 'exact', head: true }).eq('role', 'pegawai'),
    supabase
      .from('presensi')
      .select('*', { count: 'exact', head: true })
      .eq('tanggal', hari)
      .not('jam_masuk', 'is', null),
    supabase.from('perangkat').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('presensi')
      .select('*', { count: 'exact', head: true })
      .eq('tanggal', hari)
      .not('jam_pulang', 'is', null),
  ])

  const galat = pegawai.error || hadir.error || pending.error || pulang.error
  if (galat) throw galat

  return {
    totalPegawai: pegawai.count ?? 0,
    hadirHariIni: hadir.count ?? 0,
    pendingPerangkat: pending.count ?? 0,
    sudahPulang: pulang.count ?? 0,
  }
}

/** Presensi hari ini beserta identitas pegawai, terbaru lebih dulu. */
export async function ambilPresensiHariIni() {
  const { data, error } = await supabase
    .from('presensi')
    .select(
      'id, tanggal, jam_masuk, jam_pulang, status_kehadiran, jarak_masuk, jarak_pulang, lokasi_masuk, lokasi_pulang, pegawai:pegawai!presensi_user_id_fkey ( nama, unit_kerja )',
    )
    .eq('tanggal', hariIni())
    .order('jam_masuk', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data ?? []
}
