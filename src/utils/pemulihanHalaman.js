/**
 * ==========================================================================
 * Pemulihan halaman saat modul (chunk) gagal dimuat
 * --------------------------------------------------------------------------
 * Penyebab umum: deploy baru menghapus chunk lama sementara perangkat masih
 * memegang index.html lama (GitHub Pages: HTML/assets 10 menit, aset lama 404).
 * Akibatnya navigasi ke halaman lazy gagal dan React memutihkan seluruh layar.
 *
 * Strategi: deteksi galat muat modul, lalu muat ulang sekali dengan URL
 * berparameter untuk melewati cache HTML. Guard mencegah muat ulang berulang.
 * ==========================================================================
 */

const KUNCI_MUAT_ULANG = 'presisi-ami:muat-ulang-terakhir'
const JEDA_MINIMAL_MS = 30_000
export const PARAM_PERBARUI = 'perbarui'

const POLA_GALAT_MODUL = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'failed to load module script',
  'loading chunk',
  'chunkloaderror',
  'unable to preload css',
]

/** Apakah galat berasal dari kegagalan mengunduh/mengevaluasi chunk halaman. */
export function adalahGalatMuatModul(galat) {
  const pesan = String(galat?.message ?? galat ?? '').toLowerCase()
  if (!pesan) return false
  return POLA_GALAT_MODUL.some((pola) => pesan.includes(pola))
}

function bacaStempel() {
  try {
    return Number(window.sessionStorage.getItem(KUNCI_MUAT_ULANG)) || 0
  } catch {
    return 0
  }
}

function tulisStempel(nilai) {
  try {
    window.sessionStorage.setItem(KUNCI_MUAT_ULANG, String(nilai))
  } catch {
    /* sessionStorage diblokir — guard URL tetap melindungi dari loop */
  }
}

/**
 * Muat ulang otomatis hanya boleh terjadi sekali per 30 detik dan tidak bila
 * URL sudah membawa penanda `perbarui` (artinya percobaan sebelumnya gagal).
 */
export function bolehMuatUlangOtomatis(sekarang = Date.now()) {
  if (typeof window === 'undefined') return false

  try {
    if (new URL(window.location.href).searchParams.has(PARAM_PERBARUI)) return false
  } catch {
    return false
  }

  return sekarang - bacaStempel() > JEDA_MINIMAL_MS
}

/**
 * Muat ulang halaman sekali dengan penanda waktu agar browser mengambil
 * index.html terbaru (aset hashed yang baru) alih-alih HTML dari cache.
 * @returns {boolean} true bila muat ulang dijalankan
 */
export function muatUlangSekali() {
  if (typeof window === 'undefined') return false

  const sekarang = Date.now()
  if (!bolehMuatUlangOtomatis(sekarang)) return false

  tulisStempel(sekarang)

  try {
    const url = new URL(window.location.href)
    url.searchParams.set(PARAM_PERBARUI, String(sekarang))
    window.location.replace(url.toString())
    return true
  } catch {
    try {
      window.location.reload()
      return true
    } catch {
      return false
    }
  }
}

/** Menghapus penanda `perbarui` dari URL setelah aplikasi berhasil dimuat. */
export function bersihkanPenandaPerbarui() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return

  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(PARAM_PERBARUI)) return
    url.searchParams.delete(PARAM_PERBARUI)
    const bersih = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', bersih)
  } catch {
    /* abaikan — URL tetap berfungsi walau penanda tidak terhapus */
  }
}
