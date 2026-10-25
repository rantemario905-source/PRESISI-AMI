/**
 * Halaman 404 — rute tidak dikenal.
 */
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 py-8 text-center">
      <p className="text-6xl font-extrabold text-sky-600">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-800">Halaman Tidak Ditemukan</h1>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-600 sm:text-sm">
        Halaman yang Anda tuju tidak ada atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
