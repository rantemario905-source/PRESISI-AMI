/**
 * ==========================================================================
 * Service: Hari Libur Manual
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/** Hari libur pada satu tahun. */
export async function ambilHariLibur(tahun) {
  const { data, error } = await supabase
    .from('hari_libur')
    .select('tanggal, nama, dibuat_pada')
    .gte('tanggal', `${tahun}-01-01`)
    .lte('tanggal', `${tahun}-12-31`)
    .order('tanggal')

  if (error) throw error
  return data ?? []
}

/** Hari libur pada rentang tanggal (dipakai grid jadwal). */
export async function ambilHariLiburRentang(mulai, selesai) {
  const { data, error } = await supabase
    .from('hari_libur')
    .select('tanggal, nama')
    .gte('tanggal', mulai)
    .lte('tanggal', selesai)
    .order('tanggal')

  if (error) throw error
  return data ?? []
}

export async function tambahHariLibur({ tanggal, nama }) {
  const { data, error } = await supabase.rpc('tambah_hari_libur', {
    p_tanggal: tanggal,
    p_nama: nama,
  })
  if (error) throw error
  return data
}

export async function hapusHariLibur(tanggal) {
  const { data, error } = await supabase.rpc('hapus_hari_libur', { p_tanggal: tanggal })
  if (error) throw error
  return data
}
