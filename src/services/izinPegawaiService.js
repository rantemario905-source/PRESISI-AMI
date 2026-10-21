/**
 * ==========================================================================
 * Service: Pengajuan Izin/Cuti oleh Pegawai
 * --------------------------------------------------------------------------
 * RLS membatasi pegawai hanya dapat membaca & mengajukan izin miliknya
 * sendiri dengan status awal 'menunggu'. Pengajuan tidak dapat dibatalkan
 * atau diubah oleh pegawai setelah dikirim.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

export async function ambilIzinSaya(userId) {
  const { data, error } = await supabase
    .from('izin_cuti')
    .select(
      'id, jenis, tanggal_mulai, tanggal_selesai, alasan, status, catatan_admin, dibuat_pada, disetujui_pada',
    )
    .eq('user_id', userId)
    .order('dibuat_pada', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Ajukan izin/cuti baru (status otomatis 'menunggu').
 * @param {{ userId: string, jenis: string, tanggalMulai: string, tanggalSelesai: string, alasan: string }} params
 */
export async function ajukanIzinSaya({ userId, jenis, tanggalMulai, tanggalSelesai, alasan }) {
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
    .select('id, status, dibuat_pada')
    .single()

  if (error) throw error
  return data
}
