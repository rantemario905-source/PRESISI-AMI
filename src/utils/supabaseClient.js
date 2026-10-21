/**
 * ==========================================================================
 * Koneksi Supabase (klien)
 * --------------------------------------------------------------------------
 * Membaca kredensial dari variabel lingkungan:
 *   VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
 * Jika belum diisi, `supabase` bernilai null dan aplikasi menampilkan
 * pesan konfigurasi yang jelas (bukan crash).
 * ==========================================================================
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const konfigurasiLengkap = Boolean(url && anonKey)

export const supabase = konfigurasiLengkap
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
