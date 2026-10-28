/**
 * ==========================================================================
 * Service: Presensi & Jadwal Shift
 * --------------------------------------------------------------------------
 * Penulisan presensi HANYA melalui RPC `submit_presensi` (validasi
 * server-side: device binding, anti-Fake GPS, radius 50 m).
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

/**
 * Presensi hari ini milik user. Bila hari ini belum ada, cari presensi
 * terbuka dari shift malam kemarin agar tombol absen pulang tetap aktif.
 */
export async function ambilPresensiHariIni(userId) {
  const hari = hariIni()
  const kemarin = new Date(Date.parse(`${hari}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10)

  // Prioritaskan presensi kemarin yang masih terbuka agar shift malam
  // (atau presensi yang lupa absen pulang) tidak tertutup oleh baris Alfa
  // hari ini dan tombol absen pulang tetap tersedia.
  const { data: terbuka, error: galatTerbuka } = await supabase
    .from('presensi')
    .select('*')
    .eq('user_id', userId)
    .eq('tanggal', kemarin)
    .not('jam_masuk', 'is', null)
    .is('jam_pulang', null)
    .maybeSingle()

  if (galatTerbuka) throw galatTerbuka
  if (terbuka) return terbuka

  const { data, error } = await supabase
    .from('presensi')
    .select('*')
    .eq('user_id', userId)
    .eq('tanggal', hari)
    .maybeSingle()

  if (error) throw error
  return data ?? null
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

/**
 * Jadwal kerja hari ini (reguler atau shift) dari server.
 * Server juga menentukan apakah pegawai boleh absen pada hari tersebut.
 */
export async function ambilJadwalHariIni(userId) {
  return ambilJadwalTanggal(userId, hariIni())
}

/** Jadwal kerja pada tanggal tertentu (dipakai untuk shift malam kemarin). */
export async function ambilJadwalTanggal(userId, tanggal) {
  const { data, error } = await supabase.rpc('jadwal_kerja', {
    p_user: userId,
    p_tanggal: tanggal,
  })

  if (error) throw error
  return data?.[0] ?? null
}

/** Jadwal kemarin dalam WITA, untuk mendeteksi shift malam yang masih berjalan. */
export async function ambilJadwalKemarin(userId) {
  const hari = hariIni()
  const kemarin = new Date(Date.parse(`${hari}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10)
  return ambilJadwalTanggal(userId, kemarin)
}
