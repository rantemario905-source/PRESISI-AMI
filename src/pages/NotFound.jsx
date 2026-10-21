/**
 * Halaman 404 — rute tidak dikenal.
 */
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/index.js'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-6xl font-extrabold text-sky-600">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-800">Halaman Tidak Ditemukan</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-600">
        Halaman yang Anda tuju tidak ada atau telah dipindahkan.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="utama">Kembali ke Beranda</Button>
      </Link>
    </div>
  )
}
