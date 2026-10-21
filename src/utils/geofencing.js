/**
 * ==========================================================================
 * Logika Geofencing & Proteksi Mock Location
 * --------------------------------------------------------------------------
 * 1. Haversine       → jarak akurat (meter) GPS pengguna vs RSUD AMI
 * 2. Mock Location   → tolak jika isMocked=true ATAU accuracy===0
 * 3. Radius 100 m    → tolak jika berada di luar radius rumah sakit
 *
 * Validasi ini adalah lapisan UX; validasi otoritatif (keamanan ketat)
 * dilakukan ulang di sisi server melalui RPC `submit_presensi`
 * (lihat supabase/schema.sql).
 * ==========================================================================
 */
import {
  RSUD_AMI,
  MAX_RADIUS_METERS,
  MAX_AKURASI_METERS,
} from '../config/constants.js'

/**
 * Menghitung jarak antara dua koordinat GPS memakai rumus Haversine.
 * @returns {number} jarak dalam METER
 */
export function haversineMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000 // radius bumi dalam meter
  const toRad = (derajat) => (derajat * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Memvalidasi posisi hasil Geolocation API terhadap aturan absensi.
 *
 * @param {GeolocationPosition} position - objek posisi dari browser
 * @returns {{
 *   valid: boolean,
 *   kode: 'VALID'|'MOCK_LOCATION'|'AKURASI_TIDAK_SAH'|'AKURASI_BURUK'|'LUAR_RADIUS'|'LOKASI_TIDAK_SAH',
 *   pesan: string,
 *   jarak?: number,
 *   koordinat?: { lat: number, lng: number },
 *   akurasi?: number
 * }}
 */
export function periksaLokasi(position) {
  const coords = position?.coords

  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return {
      valid: false,
      kode: 'LOKASI_TIDAK_SAH',
      pesan: 'Data lokasi dari perangkat tidak dapat dibaca. Pastikan layanan lokasi aktif lalu coba lagi.',
    }
  }

  const koordinat = { lat: coords.latitude, lng: coords.longitude }
  const akurasi = coords.accuracy

  // (a) Deteksi Fake GPS / Mock Location
  if (coords.isMocked === true || akurasi === 0) {
    return {
      valid: false,
      kode: 'MOCK_LOCATION',
      pesan: 'Terdeteksi menggunakan Fake GPS / Mock Location. Absensi dibatalkan.',
      koordinat,
      akurasi,
    }
  }

  if (akurasi === null || akurasi === undefined) {
    return {
      valid: false,
      kode: 'AKURASI_TIDAK_SAH',
      pesan: 'Perangkat tidak melaporkan akurasi GPS. Absensi tidak dapat diverifikasi.',
      koordinat,
    }
  }

  // Akurasi tidak wajar (mis. emulator) → tolak
  if (akurasi > MAX_AKURASI_METERS) {
    return {
      valid: false,
      kode: 'AKURASI_BURUK',
      pesan: `Akurasi GPS tidak wajar (${Math.round(akurasi)} m). Pindah ke ruang terbuka dan coba lagi.`,
      koordinat,
      akurasi,
    }
  }

  // (b) Cek radius 100 meter
  const jarak = haversineMeter(RSUD_AMI.lat, RSUD_AMI.lng, koordinat.lat, koordinat.lng)

  if (jarak > MAX_RADIUS_METERS) {
    return {
      valid: false,
      kode: 'LUAR_RADIUS',
      pesan: `Anda berada di luar radius ${MAX_RADIUS_METERS} meter dari ${'RSUD AMI'}. Jarak Anda saat ini ${Math.round(jarak)} meter dari rumah sakit.`,
      jarak,
      koordinat,
      akurasi,
    }
  }

  // (c) Lolos seluruh validasi
  return {
    valid: true,
    kode: 'VALID',
    pesan: `Lokasi terverifikasi — berada ${Math.round(jarak)} meter dari pusat rumah sakit.`,
    jarak,
    koordinat,
    akurasi,
  }
}

/**
 * Meminta izin & membaca posisi GPS perangkat (sekali jalan).
 * @returns {Promise<GeolocationPosition>}
 */
export function dapatkanLokasi() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Perangkat/browser ini tidak mendukung pembacaan lokasi.'))
      return
    }

    // Geolocation hanya berjalan di konteks aman (HTTPS / localhost / 127.0.0.1).
    // Membuka lewat IP jaringan (mis. http://192.168.1.5:5173) akan diblokir browser.
    if (!window.isSecureContext) {
      reject(
        new Error(
          'Akses lokasi diblokir karena alamat tidak aman. Buka aplikasi melalui http://localhost:5173 ' +
            '(bukan alamat IP jaringan), atau gunakan HTTPS.',
        ),
      )
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      const pesan = {
        1:
          'Akses lokasi diblokir browser. Klik ikon gembok/pengaturan di sebelah kiri address bar → ' +
          'Izin Lokasi → Izinkan, lalu muat ulang halaman. Pastikan juga layanan lokasi perangkat aktif.',
        2: 'Posisi perangkat tidak tersedia. Pastikan GPS/layanan lokasi aktif.',
        3: 'Waktu membaca lokasi habis. Coba lagi.',
      }
      reject(new Error(pesan[err.code] || 'Gagal membaca lokasi perangkat.'))
    }, {
      enableHighAccuracy: true, // diwajibkan spesifikasi
      timeout: 15000,
      maximumAge: 0,
    })
  })
}
