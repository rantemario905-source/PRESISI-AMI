/**
 * Nada konfirmasi absensi berhasil.
 *
 * Nada dibuat langsung oleh browser lewat Web Audio API (tanpa berkas audio).
 * Dipanggil dari dalam handler klik sehingga lolos kebijakan autoplay.
 * Opsi A "marimba": tiga nada naik yang hangat, harmonik tipis, dan lowpass
 * agar ujung nada tidak tajam di speaker HP. Diselaraskan dengan animasi
 * centang di AbsenBerhasil.jsx.
 *
 * Bila perangkat bersonik senyap, tidak didukung, atau diblokir, fungsi ini
 * diam saja — overlay visual tetap menjadi konfirmasi utama.
 */
export const NADA_SUKSES = [783.99, 987.77, 1174.66] // G5, B5, D6
export const JEDA_NADA = 140 // ms
export const DURASI_LONCENG = JEDA_NADA * (NADA_SUKSES.length - 1) + 550

const DURASI_NADA = [0.4, 0.4, 0.55] // detik, nada terakhir berdentang
const VOLUME = 0.16
const HARMONIK = 3 // kelipatan frekuensi kayu
const PORSI_HARMONIK = 0.1

let konteks = null

export function mainkanLonceng() {
  if (typeof window === 'undefined') return

  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return

  try {
    konteks = konteks || new AudioCtx()
    if (konteks.state === 'suspended') konteks.resume()

    const mulai = konteks.currentTime

    // Lowpass + kompresor menjaga nada tetap lembut saat bertumpuk.
    const lowpass = konteks.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 5000

    const kompresor = konteks.createDynamicsCompressor()
    lowpass.connect(kompresor).connect(konteks.destination)

    NADA_SUKSES.forEach((frekuensi, i) => {
      const t = mulai + (i * JEDA_NADA) / 1000
      const akhir = t + DURASI_NADA[i]

      for (const [kelipatan, porsi] of [
        [1, 1],
        [HARMONIK, PORSI_HARMONIK],
      ]) {
        const osc = konteks.createOscillator()
        const gain = konteks.createGain()

        osc.type = 'sine'
        osc.frequency.value = frekuensi * kelipatan
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(VOLUME * porsi, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, akhir)

        osc.connect(gain).connect(lowpass)
        osc.start(t)
        osc.stop(akhir + 0.02)
      }
    })
  } catch {
    // Suara hanya pelengkap; jangan pernah menggagalkan alur absensi.
  }
}
