/**
 * Overlay konfirmasi absensi berhasil: centang + satu baris teks.
 * Tampil ±1,4 detik lalu menutup sendiri; bisa ditutup dengan ketuk atau Esc.
 * Dipasang lewat portal karena PanelAbsen memakai `overflow-hidden`.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const DURASI_TUTUP = 1200
const DURASI_LEPAS = 1400

export default function AbsenBerhasil({ jenis = 'masuk', onSelesai }) {
  const [menutup, setMenutup] = useState(false)

  useEffect(() => {
    const a = setTimeout(() => setMenutup(true), DURASI_TUTUP)
    const b = setTimeout(() => onSelesai?.(), DURASI_LEPAS)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [onSelesai])

  useEffect(() => {
    function tutup() {
      onSelesai?.()
    }
    function tombol(e) {
      if (e.key === 'Escape') tutup()
    }
    window.addEventListener('keydown', tombol)
    return () => window.removeEventListener('keydown', tombol)
  }, [onSelesai])

  const teks = jenis === 'pulang' ? 'Absen pulang tercatat' : 'Absen masuk tercatat'

  return createPortal(
    <div
      className={`absen-tirai fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-6 ${
        menutup ? 'absen-tutup' : ''
      }`}
      onClick={() => onSelesai?.()}
      role="status"
      aria-live="polite"
    >
      <div className="absen-kartu flex w-full max-w-[13rem] flex-col items-center gap-4 rounded-2xl bg-white px-6 py-7 shadow-lg">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absen-centang h-16 w-16"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <p className="text-center text-sm text-slate-600">{teks}</p>
      </div>
    </div>,
    document.body,
  )
}
