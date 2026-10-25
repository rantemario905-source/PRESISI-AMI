/**
 * Layar "Akses Ditolak" — ditampilkan saat peran tidak sesuai dengan rute,
 * mis. pegawai biasa mencoba membuka /superadmin-portal.
 */
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AksesDitolak({ peranDiharapkan = 'superadmin' }) {
  const { profil, apakahSuperadmin } = useAuth()
  const tujuan = apakahSuperadmin ? '/superadmin-portal' : '/'

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 py-8 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-kartu sm:p-8">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600"
        >
          ✕
        </div>
        <h1 className="text-xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
          Halaman ini hanya untuk akun{' '}
          <span className="font-semibold capitalize">{peranDiharapkan}</span>. Anda masuk sebagai{' '}
          <span className="font-semibold">{profil?.nama ?? 'Pegawai'}</span> dengan peran{' '}
          <span className="font-semibold capitalize">{profil?.role ?? 'pegawai'}</span>.
        </p>
        <Link
          to={tujuan}
          className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  )
}
