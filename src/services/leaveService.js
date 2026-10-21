/**
 * ==========================================================================
 * Service: Izin / Cuti / Sakit / Dinas Luar
 * --------------------------------------------------------------------------
 * Admin dapat mencatat surat atas nama pegawai serta menyetujui/menolak.
 * Persetujuan otomatis menandai presensi pada rentang tanggal terkait
 * (ditangani RPC `putuskan_izin`).
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/** @param {'semua'|'menunggu'|'disetujui'|'ditolak'} status */
export async function ambilDaftarIzin(status = 'semua') {
  let kueri = supabase
    .from('izin_cuti')
    .select(
      'id, user_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status, catatan_admin, dibuat_pada, disetujui_pada, pegawai:pegawai!izin_cuti_user_id_fkey ( nama, unit_kerja ), penyetuju:pegawai!izin_cuti_disetujui_oleh_fkey ( nama )',
    )
    .order('dibuat_pada', { ascending: false })

  if (status !== 'semua') kueri = kueri.eq('status', status)

  const { data, error } = await kueri
  if (error) throw error
  return data ?? []
}

/**
 * Catat surat izin atas nama pegawai (status awal: menunggu).
 * @param {{ userId: string, jenis: string, tanggalMulai: string, tanggalSelesai: string, alasan: string }} params
 */
export async function catatIzin({ userId, jenis, tanggalMulai, tanggalSelesai, alasan }) {
  const { data, error } = await supabase
    .from('izin_cuti')
    .insert({
      user_id: userId,
      jenis,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      alasan: alasan.trim(),
      status: 'menunggu',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

/**
 * Setujui / tolak pengajuan.
 * @param {{ id: string, status: 'disetujui'|'ditolak', catatan?: string }} params
 */
export async function putuskanIzin({ id, status, catatan = '' }) {
  const { data, error } = await supabase.rpc('putuskan_izin', {
    p_id: id,
    p_status: status,
    p_catatan: catatan || null,
  })

  if (error) throw error
  return data
}
