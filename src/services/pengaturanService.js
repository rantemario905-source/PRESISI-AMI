/**
 * ==========================================================================
 * Service: Pengaturan Presensi (Alfa otomatis)
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

export async function ambilPengaturanPresensi() {
  const { data, error } = await supabase
    .from('pengaturan_presensi')
    .select('alfa_otomatis, alfa_mulai, diperbarui_pada')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function simpanPengaturanPresensi({ alfaOtomatis, alfaMulai }) {
  const { data, error } = await supabase.rpc('simpan_pengaturan_presensi', {
    p_alfa_otomatis: Boolean(alfaOtomatis),
    p_alfa_mulai: alfaMulai || null,
  })
  if (error) throw error
  return data
}

/** Jalankan proses Alfa manual. Bila tanggal null, server memproses hari ini & kemarin. */
export async function jalankanAlfa(tanggal = null) {
  const { data, error } = await supabase.rpc('proses_alfa_otomatis', {
    p_tanggal: tanggal || null,
  })
  if (error) throw error
  return Number(data ?? 0)
}
