/**
 * ==========================================================================
 * ProtectedRoute — Penjaga rute berbasis peran
 * --------------------------------------------------------------------------
 * - Belum login  → dialihkan ke /login (mengingat rute asal)
 * - Peran salah  → layar Akses Ditolak (mis. pegawai buka /superadmin-portal)
 * - Masih cek sesi → layar memuat
 * ==========================================================================
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AksesDitolak from './AksesDitolak.jsx'
import { Alert, Button, LayarMemuat } from './ui/index.js'

/**
 * @param {object} props
 * @param {'pegawai'|'superadmin'} [props.peran] - peran wajib untuk membuka rute
 * @param {boolean} [props.kepalaRuangan] - wajib memiliki flag kepala ruangan
 * @param {import('react').ReactNode} props.children
 */
export default function ProtectedRoute({ peran, kepalaRuangan = false, children }) {
  const { sesi, profil, memuat, galat, muatProfil, keluar } = useAuth()
  const lokasi = useLocation()

  if (memuat) return <LayarMemuat />

  // Belum login → arahkan ke halaman login dan simpan rute asal
  if (!sesi) return <Navigate to="/login" replace state={{ dari: lokasi.pathname }} />

  // Login tapi profil gagal dimuat: tampilkan error, jangan spinner tanpa henti.
  if (!profil) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4">
        <section className="kartu w-full max-w-md">
          <Alert variant="bahaya" title="Profil gagal dimuat">
            {galat || 'Profil pegawai tidak ditemukan. Hubungi Admin IT.'}
          </Alert>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            Periksa koneksi internet dan pastikan seluruh migrasi database sudah dijalankan.
            Setelah itu tekan <strong>Coba lagi</strong>.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="sekunder" onClick={() => keluar()}>
              Keluar
            </Button>
            <Button onClick={muatProfil}>Coba lagi</Button>
          </div>
        </section>
      </main>
    )
  }

  // Peran tidak sesuai → arahkan otomatis ke beranda sesuai peran.
  // (AksesDitolak hanya dipakai bila pengguna sudah berada di berandanya
  //  sendiri namun peran tetap tidak cocok — kasus yang tidak normal.)
  if (peran && profil.role !== peran) {
    const beranda = profil.role === 'superadmin' ? '/superadmin-portal' : '/'
    if (lokasi.pathname !== beranda) return <Navigate to={beranda} replace />
    return <AksesDitolak peranDiharapkan={peran} />
  }

  // Rute khusus kepala ruangan. Flag tidak dapat diubah dari UI.
  if (kepalaRuangan && !profil.kepala_ruangan) {
    return <Navigate to="/" replace />
  }

  return children
}
