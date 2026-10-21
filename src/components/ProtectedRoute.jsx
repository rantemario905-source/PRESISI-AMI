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
import { LayarMemuat } from './ui/index.js'

/**
 * @param {object} props
 * @param {'pegawai'|'superadmin'} [props.peran] - peran wajib untuk membuka rute
 * @param {import('react').ReactNode} props.children
 */
export default function ProtectedRoute({ peran, children }) {
  const { sesi, profil, memuat } = useAuth()
  const lokasi = useLocation()

  if (memuat) return <LayarMemuat />

  // Belum login → arahkan ke halaman login dan simpan rute asal
  if (!sesi) return <Navigate to="/login" replace state={{ dari: lokasi.pathname }} />

  // Login tapi profil belum termuat (mis. gagal ambil data)
  if (!profil) return <LayarMemuat label="Memuat profil pegawai…" />

  // Peran tidak sesuai → arahkan otomatis ke beranda sesuai peran.
  // (AksesDitolak hanya dipakai bila pengguna sudah berada di berandanya
  //  sendiri namun peran tetap tidak cocok — kasus yang tidak normal.)
  if (peran && profil.role !== peran) {
    const beranda = profil.role === 'superadmin' ? '/superadmin-portal' : '/'
    if (lokasi.pathname !== beranda) return <Navigate to={beranda} replace />
    return <AksesDitolak peranDiharapkan={peran} />
  }

  return children
}
