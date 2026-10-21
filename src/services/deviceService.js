/**
 * ==========================================================================
 * Service: Pengelolaan Perangkat (Device Binding)
 * --------------------------------------------------------------------------
 * Status per pegawai diambil dari gabungan akun + device_token perangkat:
 *   - 'belum_terdaftar' : token tidak ada di database
 *   - 'pending'         : menunggu persetujuan Admin IT
 *   - 'approved'        : perangkat resmi, tombol absen aktif
 *   - 'rejected'        : pengajuan ditolak (bisa diajukan ulang)
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/** Ambil status perangkat milik user untuk device_token tertentu */
export async function ambilStatusPerangkat(userId, deviceToken) {
  const { data, error } = await supabase
    .from('perangkat')
    .select('id, device_token, status, diajukan_pada, disetujui_pada, catatan')
    .eq('user_id', userId)
    .eq('device_token', deviceToken)
    .maybeSingle()

  if (error) throw error

  if (!data) return { status: 'belum_terdaftar', data: null }
  return { status: data.status, data }
}

/**
 * Ajukan verifikasi perangkat (menyimpan token dengan status pending).
 * Bila token sudah pernah ditolak, diajukan ulang menjadi pending.
 */
export async function ajukanVerifikasiPerangkat({ userId, deviceToken, infoPerangkat }) {
  const { data, error } = await supabase
    .from('perangkat')
    .upsert(
      {
        user_id: userId,
        device_token: deviceToken,
        info_perangkat: infoPerangkat,
        status: 'pending',
        diajukan_pada: new Date().toISOString(),
        disetujui_pada: null,
        disetujui_oleh: null,
        catatan: null,
      },
      { onConflict: 'user_id,device_token' },
    )
    .select('id, status, diajukan_pada')
    .single()

  if (error) throw error
  return data
}

/** Daftar riwayat perangkat milik user (untuk riwayat audit perangkat) */
export async function ambilRiwayatPerangkat(userId) {
  const { data, error } = await supabase
    .from('perangkat')
    .select('id, device_token, status, diajukan_pada, disetujui_pada, info_perangkat')
    .eq('user_id', userId)
    .order('diajukan_pada', { ascending: false })

  if (error) throw error
  return data ?? []
}
