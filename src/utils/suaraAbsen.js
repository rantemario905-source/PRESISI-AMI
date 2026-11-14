/**
 * Nada konfirmasi absensi berhasil.
 *
 * Nada dibuat langsung oleh browser lewat Web Audio API (tanpa berkas audio).
 * Dipanggil dari dalam handler klik sehingga lolos kebijakan autoplay.
 * Bila perangkat bersonik senyap, tidak didukung, atau diblokir, fungsi ini
 * diam saja — overlay visual tetap menjadi konfirmasi utama.
 */
let konteks = null

export function mainkanLonceng() {
  if (typeof window === 'undefined') return

  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return

  try {
    konteks = konteks || new AudioCtx()
    if (konteks.state === 'suspended') konteks.resume()

    const mulai = konteks.currentTime
    for (const [i, frekuensi] of [1046.5, 1568].entries()) {
      const osc = konteks.createOscillator()
      const gain = konteks.createGain()
      const t = mulai + i * 0.13

      osc.type = 'sine'
      osc.frequency.value = frekuensi
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)

      osc.connect(gain).connect(konteks.destination)
      osc.start(t)
      osc.stop(t + 0.2)
    }
  } catch {
    // Suara hanya pelengkap; jangan pernah menggagalkan alur absensi.
  }
}
