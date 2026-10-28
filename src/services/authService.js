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

function normalisasiProfil(data) {
  if (!data) return null
  return {
    ...data,
    unit_dikelola: Array.isArray(data.unit_dikelola) ? data.unit_dikelola : [],
  }
}

/**
 * Ambil profil aktif. RPC profil_saya() menangani pegawai biasa, kepala
 * non-ASN multi-unit, dan kepala ASN yang tidak punya baris pegawai.
 * Bila migrasi 22 belum dijalankan, fallback ke select pegawai lama.
 */
export async function ambilProfil(userId) {
  const { data, error } = await supabase.rpc('profil_saya')
  if (!error && data) return normalisasiProfil(data)

  const rpcBelumAda =
    error &&
    (error.code === 'PGRST202' ||
      /could not find the function|function .* does not exist/i.test(error.message ?? ''))

  if (error && !rpcBelumAda) throw error

  const { data: lama, error: errorLama } = await supabase
    .from('pegawai')
    .select('id, nama, unit_kerja, role, kepala_ruangan, pola_kerja')
    .eq('id', userId)
    .maybeSingle()

  if (errorLama) throw errorLama
  return normalisasiProfil(lama)
}

/** Dengarkan perubahan sesi login (login/logout otomatis) */
export function dengarkanSesi(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return data.subscription
}
