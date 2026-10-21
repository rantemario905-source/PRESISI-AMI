/**
 * ==========================================================================
 * Service: Presensi & Jadwal Shift
 * --------------------------------------------------------------------------
 * Penulisan presensi HANYA melalui RPC `submit_presensi` (validasi
 * server-side: device binding, anti-Fake GPS, radius 100 m).
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { hariIni } from '../utils/format.js'

/**
 * Kirim absensi (masuk/pulang).
 * @param {object} payload
 * @param {string} payload.deviceToken - token perangkat aktif
 * @param {'masuk'|'pulang'} payload.tipe
 * @param {number} payload.lat - lintang hasil GPS
 * @param {number} payload.lng - bujur hasil GPS
 * @param {number} payload.akurasi - akurasi GPS (meter)
 * @param {boolean} payload.isMocked - hasil deteksi mock location browser
 * @returns {Promise<object>} hasil RPC { status, waktu, jarak, pesan }
 */
export async function kirimPresensi({ deviceToken, tipe, lat, lng, akurasi, isMocked }) {
  const { data, error } = await supabase.rpc('submit_presensi', {
    p_device_token: deviceToken,
    p_tipe: tipe,
    p_lat: lat,
    p_lng: lng,
    p_akurasi: akurasi,
    p_is_mocked: Boolean(isMocked),
  })

  if (error) throw error
  return data
}

/** Presensi hari ini milik user (null bila belum ada) */
export async function ambilPresensiHariIni(userId) {
  const { data, error } = await supabase
    .from('presensi')
    .select('*')
    .eq('user_id', userId)
    .eq('tanggal', hariIni())
    .maybeSingle()

  if (error) throw error
  return data
}

/** Riwayat presensi terbaru milik user (untuk tabel riwayat) */
export async function ambilRiwayatPresensi(userId, limit = 7) {
  const { data, error } = await supabase
    .from('presensi')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/** Jadwal shift hari ini milik user (null → Non-Shift) */
export async function ambilJadwalHariIni(userId) {
  const { data, error } = await supabase
    .from('jadwal_shift')
    .select('id, tanggal, shift_master ( id, nama_shift, jam_mulai, jam_selesai )')
    .eq('user_id', userId)
    .eq('tanggal', hariIni())
    .maybeSingle()

  if (error) throw error
  return data
}
