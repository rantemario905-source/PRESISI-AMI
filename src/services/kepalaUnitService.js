/**
 * ==========================================================================
 * Service: Penugasan Kepala Unit
 * --------------------------------------------------------------------------
 * Sumber kebenaran penugasan adalah tabel public.kepala_unit. Kepala ASN
 * tidak memiliki baris pegawai, sedangkan kepala non-ASN tetap terdaftar
 * sebagai pegawai pada unit induknya.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/** Daftar kepala unit beserta unit yang dikelola (khusus Super Admin). */
export async function ambilDaftarKepalaUnit() {
  const { data, error } = await supabase.rpc('daftar_kepala_unit')
  if (error) throw error
  return Array.isArray(data) ? data : []
}

/** Daftar akun auth bertanda kepala ASN yang belum masuk tabel pegawai. */
export async function ambilAkunKepalaAsn() {
  const { data, error } = await supabase.rpc('daftar_akun_kepala_asn')
  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * Simpan penugasan unit seorang kepala. Array kosong berarti melepas semua.
 * @param {{ userId: string, units: string[], nama?: string }} params
 */
export async function simpanKepalaUnit({ userId, units, nama = null }) {
  const { data, error } = await supabase.rpc('simpan_kepala_unit', {
    p_user_id: userId,
    p_units: units,
    p_nama: nama,
  })
  if (error) throw error
  return data
}

/** Nama kepala unit untuk kop/tanda tangan laporan. */
export async function ambilNamaKepalaUnit(unit) {
  if (!unit) return ''
  const { data, error } = await supabase.rpc('nama_kepala_unit', { p_unit: unit })
  if (error) throw error
  return data ?? ''
}
