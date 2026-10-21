/**
 * ==========================================================================
 * Device Binding — Penguncian Perangkat Pegawai
 * --------------------------------------------------------------------------
 * Menghasilkan `device_token` unik (UUID) yang disimpan di localStorage
 * browser pegawai. Token ini mengikat satu akun ke satu perangkat:
 * akun tidak dapat diabsenkan dari perangkat lain karena token perangkat
 * tersebut tidak terdaftar / belum disetujui Admin IT di database.
 *
 * Kebijakan: 1 pegawai = 1 perangkat aktif (disetujui Admin IT).
 * ==========================================================================
 */

const KUNCI_TOKEN = 'presisi_ami:device_token'

/** Fallback bila crypto.randomUUID tidak tersedia (browser lama) */
function buatUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Mengambil device_token dari localStorage; dibuat bila belum ada.
 * @returns {string} device_token (UUID)
 */
export function ambilDeviceToken() {
  try {
    let token = window.localStorage.getItem(KUNCI_TOKEN)
    if (!token) {
      token = buatUuid()
      window.localStorage.setItem(KUNCI_TOKEN, token)
    }
    return token
  } catch {
    // localStorage tidak tersedia (mode privat) → token hanya berlaku
    // selama sesi berjalan; status perangkat akan selalu "belum terdaftar".
    if (!window.__presisiAmiTokenFallback) {
      window.__presisiAmiTokenFallback = buatUuid()
    }
    return window.__presisiAmiTokenFallback
  }
}

/**
 * Ringkasan identitas perangkat (untuk pencatatan admin).
 * @returns {string} maksimal 250 karakter
 */
export function infoPerangkat() {
  try {
    const ua = navigator.userAgent
    return ua.length > 250 ? `${ua.slice(0, 247)}...` : ua
  } catch {
    return 'Tidak diketahui'
  }
}

/**
 * Menghapus token perangkat dari perangkat ini (hanya untuk keperluan
 * debug/perbaikan mandiri; penguncian resmi tetap melalui Admin IT).
 */
export function hapusDeviceToken() {
  try {
    window.localStorage.removeItem(KUNCI_TOKEN)
  } catch {
    /* abaikan */
  }
}
