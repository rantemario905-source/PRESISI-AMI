/**
 * ==========================================================================
 * Service: Grup Shift (master unit + seksi)
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

export const SEKSI_SHIFT = [
  'Seksi Pelayanan Medik dan Keperawatan',
  'Seksi Penunjang',
  'Sub Bagian Tata Usaha',
  'Belum ditentukan',
]

/** Semua grup shift, termasuk grup yang belum memiliki pegawai. */
export async function ambilGrupShift() {
  const { data, error } = await supabase
    .from('grup_shift')
    .select('nama, seksi, dibuat_pada, diperbarui_pada')
    .order('seksi')
    .order('nama')

  if (error) throw error
  return data ?? []
}

export async function tambahGrupShift({ nama, seksi }) {
  const { data, error } = await supabase.rpc('tambah_grup_shift', {
    p_nama: nama,
    p_seksi: seksi,
  })
  if (error) throw error
  return data
}

export async function ubahGrupShift({ namaLama, namaBaru, seksi }) {
  const { data, error } = await supabase.rpc('ubah_grup_shift', {
    p_nama_lama: namaLama,
    p_nama_baru: namaBaru,
    p_seksi: seksi,
  })
  if (error) throw error
  return data
}

export async function hapusGrupShift(nama) {
  const { data, error } = await supabase.rpc('hapus_grup_shift', { p_nama: nama })
  if (error) throw error
  return data
}
