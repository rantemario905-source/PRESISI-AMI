/**
 * Nada konfirmasi absensi berhasil.
 *
 * Nada dibuat langsung oleh browser lewat Web Audio API (tanpa berkas audio).
 * Dipanggil dari dalam handler klik sehingga lolos kebijakan autoplay.
 * Rentang nada naik + denting terakhir yang panjang meniru bunyi "transaksi
 * berhasil"; selaras dengan animasi centang di AbsenBerhasil.jsx.
 *
 * Bila perangkat bersonik senyap, tidak didukung, atau diblokir, fungsi ini
 * diam saja — overlay visual tetap menjadi konfirmasi utama.
 */
export const NADA_SUKSES = [659.25, 830.61, 987.77, 1318.51] // E5, G#5, B5, E6
export const JEDA_NADA = 100 // ms
export const DURASI_LONCENG = JEDA_NADA * (NADA_SUKSES.length - 1) + 400

const DURASI_NADA = [0.22, 0.22, 0.24, 0.6] // detik, berakhir berdentang
const VOLUME = 0.2

let konteks = null

export function mainkanLonceng() {
  if (typeof window === 'undefined') return

  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return

  try {
    konteks = konteks || new AudioCtx()
    if (konteks.state === 'suspended') konteks.resume()

    const mulai = konteks.currentTime

    NADA_SUKSES.forEach((frekuensi, i) => {
      const t = mulai + (i * JEDA_NADA) / 1000
      const akhir = t + DURASI_NADA[i]

      // Nada dasar + harmonik tipis agar terdengar seperti bell, bukan beep.
      for (const [kelipatan, porsi] of [
        [1, 1],
        [2, 0.22],
      ]) {
        const osc = konteks.createOscillator()
        const gain = konteks.createGain()

        osc.type = 'sine'
        osc.frequency.value = frekuensi * kelipatan
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(VOLUME * porsi, t + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, akhir)

        osc.connect(gain).connect(konteks.destination)
        osc.start(t)
        osc.stop(akhir + 0.02)
      }
    })
  } catch {
    // Suara hanya pelengkap; jangan pernah menggagalkan alur absensi.
  }
}
