/**
 * Layar "Akses Ditolak" — ditampilkan saat peran tidak sesuai dengan rute,
 * mis. pegawai biasa mencoba membuka /superadmin-portal.
 */
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Button } from './ui/index.js'

export default function AksesDitolak({ peranDiharapkan = 'superadmin' }) {
  const { profil, apakahSuperadmin } = useAuth()
  const tujuan = apakahSuperadmin ? '/superadmin-portal' : '/'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-kartu">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
          ✕
        </div>
        <h1 className="text-xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-slate-600">
          Halaman ini hanya untuk akun{' '}
          <span className="font-semibold capitalize">{peranDiharapkan}</span>. Anda masuk sebagai{' '}
          <span className="font-semibold">{profil?.nama ?? 'Pegawai'}</span> dengan peran{' '}
          <span className="font-semibold capitalize">{profil?.role ?? 'pegawai'}</span>.
        </p>
        <Link to={tujuan} className="mt-6 block">
          <Button variant="utama" className="w-full">
            Kembali ke Halaman Utama
          </Button>
        </Link>
      </div>
    </div>
  )
}
