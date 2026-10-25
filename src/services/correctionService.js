/**
 * ==========================================================================
 * Service: Koreksi Presensi & Audit Trail (Super Admin)
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/**
 * Presensi dalam rentang tanggal (inklusif).
 * @param {{ mulai: string, selesai: string, unit?: string }} params
 */
export async function ambilPresensiPeriode({ mulai, selesai, unit = 'semua' }) {
  const kolom =
    unit === 'semua'
      ? 'id, user_id, tanggal, jam_masuk, jam_pulang, status_kehadiran, menit_terlambat, jarak_masuk, jarak_pulang, dikoreksi_oleh, alasan_koreksi, pegawai:pegawai!presensi_user_id_fkey ( nama, unit_kerja )'
      : 'id, user_id, tanggal, jam_masuk, jam_pulang, status_kehadiran, menit_terlambat, jarak_masuk, jarak_pulang, dikoreksi_oleh, alasan_koreksi, pegawai:pegawai!presensi_user_id_fkey!inner ( nama, unit_kerja )'

  let kueri = supabase
    .from('presensi')
    .select(kolom)
    .gte('tanggal', mulai)
    .lte('tanggal', selesai)
    .order('tanggal', { ascending: false })
    .order('jam_masuk', { ascending: false, nullsFirst: false })

  if (unit !== 'semua') kueri = kueri.eq('pegawai.unit_kerja', unit)

  const { data, error } = await kueri
  if (error) throw error
  return data ?? []
}

/**
 * Simpan koreksi presensi (wajib alasan, tercatat di audit trail).
 * @param {{ presensiId: string, jamMasuk: string|null, jamPulang: string|null, status: string, alasan: string }} params
 */
export async function simpanKoreksi({ presensiId, jamMasuk, jamPulang, status, alasan }) {
  const { data, error } = await supabase.rpc('koreksi_presensi', {
    p_presensi_id: presensiId,
    p_jam_masuk: jamMasuk,
    p_jam_pulang: jamPulang,
    p_status: status,
    p_alasan: alasan,
  })

  if (error) throw error
  return data
}

/** Riwayat koreksi terbaru beserta nama admin dan data presensi terkait. */
export async function ambilAuditKoreksi(limit = 100) {
  const { data, error } = await supabase
    .from('koreksi_presensi')
    .select(
      'id, presensi_id, kolom_koreksi, nilai_lama, nilai_baru, alasan, waktu_koreksi, pegawai ( nama ), presensi ( tanggal, pegawai:pegawai!presensi_user_id_fkey ( nama, unit_kerja ) )',
    )
    .order('waktu_koreksi', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
