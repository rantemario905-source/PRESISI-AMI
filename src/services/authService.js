/**
 * ==========================================================================
 * Service: Autentikasi & Profil Pegawai
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/** Login dengan email & password. @returns {Promise<import('@supabase/supabase-js').User>} */
export async function masuk(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

/** Keluar dari sesi */
export async function keluar() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Ambil profil pegawai berdasarkan id user auth */
export async function ambilProfil(userId) {
  const { data, error } = await supabase
    .from('pegawai')
    .select('id, nama, unit_kerja, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Dengarkan perubahan sesi login (login/logout otomatis) */
export function dengarkanSesi(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return data.subscription
}
