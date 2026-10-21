/**
 * ==========================================================================
 * Service: Verifikasi & Reset Perangkat (Super Admin)
 * --------------------------------------------------------------------------
 * Persetujuan/penolakan lewat RPC agar kebijakan "1 perangkat aktif per
 * pegawai" dijalankan atomik di server.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/**
 * @param {'semua'|'pending'|'approved'|'rejected'} status
 */
export async function ambilDaftarPerangkat(status = 'semua') {
  let kueri = supabase
    .from('perangkat')
    .select(
      'id, user_id, device_token, info_perangkat, status, diajukan_pada, disetujui_pada, catatan, pegawai:pegawai!perangkat_user_id_fkey ( nama, unit_kerja )',
    )
    .order('diajukan_pada', { ascending: false })

  if (status !== 'semua') kueri = kueri.eq('status', status)

  const { data, error } = await kueri
  if (error) throw error
  return data ?? []
}

export async function setujuiPerangkat(id) {
  const { data, error } = await supabase.rpc('setujui_perangkat', { p_id: id })
  if (error) throw error
  return data
}

export async function tolakPerangkat(id, catatan) {
  const { data, error } = await supabase.rpc('tolak_perangkat', {
    p_id: id,
    p_catatan: catatan || null,
  })
  if (error) throw error
  return data
}

export async function resetPerangkat(userId) {
  const { data, error } = await supabase.rpc('reset_perangkat', { p_user_id: userId })
  if (error) throw error
  return data
}
