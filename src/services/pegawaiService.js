/**
 * ==========================================================================
 * Service: Data Pegawai (untuk selector & filter admin)
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/**
 * Ambil daftar pegawai.
 * @param {{ hanyaPegawai?: boolean }} opsi - default hanya role 'pegawai'
 */
export async function ambilSemuaPegawai({ hanyaPegawai = true } = {}) {
  let kueri = supabase.from('pegawai').select('id, nama, unit_kerja, role').order('nama')
  if (hanyaPegawai) kueri = kueri.eq('role', 'pegawai')

  const { data, error } = await kueri
  if (error) throw error
  return data ?? []
}

/** Daftar unit kerja unik (terurut) */
export async function ambilUnitKerja() {
  const pegawai = await ambilSemuaPegawai()
  return [...new Set(pegawai.map((p) => p.unit_kerja).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'id'),
  )
}

/**
 * Data seluruh pegawai + ringkasan status perangkatnya (khusus Super Admin).
 * Status perangkat: 'approved' | 'pending' | 'rejected' | 'none'.
 */
export async function ambilDataPegawai() {
  const [hasilPegawai, hasilPerangkat] = await Promise.all([
    supabase.from('pegawai').select('id, nama, unit_kerja, role, dibuat_pada').order('nama'),
    supabase.from('perangkat').select('user_id, status'),
  ])

  if (hasilPegawai.error) throw hasilPegawai.error
  if (hasilPerangkat.error) throw hasilPerangkat.error

  const statusPerUser = new Map()
  for (const baris of hasilPerangkat.data ?? []) {
    if (!statusPerUser.has(baris.user_id)) statusPerUser.set(baris.user_id, [])
    statusPerUser.get(baris.user_id).push(baris.status)
  }

  return (hasilPegawai.data ?? []).map((p) => {
    const daftarStatus = statusPerUser.get(p.id) ?? []
    const statusPerangkat = daftarStatus.includes('approved')
      ? 'approved'
      : daftarStatus.includes('pending')
        ? 'pending'
        : daftarStatus.length
          ? 'rejected'
          : 'none'

    return { ...p, statusPerangkat }
  })
}

/**
 * Perbarui nama & unit kerja pegawai. Role tidak dapat diubah dari sini.
 * @param {{ id: string, nama: string, unitKerja: string }} params
 */
export async function perbaruiPegawai({ id, nama, unitKerja }) {
  const { data, error } = await supabase.rpc('perbarui_pegawai', {
    p_id: id,
    p_nama: nama,
    p_unit_kerja: unitKerja,
  })

  if (error) throw error
  return data
}
