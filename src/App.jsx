/**
 * ==========================================================================
 * Router Utama PRESISI AMI
 * --------------------------------------------------------------------------
 *   /login                       → seluruh staf
 *   /                            → halaman absensi pegawai  (role: pegawai)
 *   /izin-saya                   → pengajuan izin/cuti pegawai (role: pegawai)
 *   /riwayat                     → riwayat & rekap bulanan pegawai (role: pegawai)
 *   /superadmin-portal           → portal Super Admin       (role: superadmin)
 *     ├─ /                       → Dashboard Utama
 *     ├─ /pegawai                → Data Pegawai
 *     ├─ /perangkat              → Verifikasi & Reset Perangkat
 *     ├─ /shift                  → Master & Jadwal Shift
 *     ├─ /koreksi                → Koreksi Presensi & Audit Trail
 *     ├─ /izin                   → Izin / Cuti / Dinas Luar
 *     └─ /rekap                  → Rekapitulasi & Cetak Laporan
 *
 * Halaman dimuat dengan React.lazy (code-splitting) agar bundle awal kecil.
 * ==========================================================================
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PortalAdminLayout from './components/layout/PortalAdminLayout.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import { LayarMemuat } from './components/ui/index.js'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const IzinSaya = lazy(() => import('./pages/IzinSaya.jsx'))
const RiwayatSaya = lazy(() => import('./pages/RiwayatSaya.jsx'))
const DashboardUtama = lazy(() => import('./pages/admin/DashboardUtama.jsx'))
const DataPegawai = lazy(() => import('./pages/admin/DataPegawai.jsx'))
const VerifikasiPerangkat = lazy(() => import('./pages/admin/VerifikasiPerangkat.jsx'))
const MasterShift = lazy(() => import('./pages/admin/MasterShift.jsx'))
const KoreksiPresensi = lazy(() => import('./pages/admin/KoreksiPresensi.jsx'))
const PengajuanIzin = lazy(() => import('./pages/admin/PengajuanIzin.jsx'))
const Rekapitulasi = lazy(() => import('./pages/admin/Rekapitulasi.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LayarMemuat label="Memuat halaman…" />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute peran="pegawai">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/izin-saya"
            element={
              <ProtectedRoute peran="pegawai">
                <IzinSaya />
              </ProtectedRoute>
            }
          />

          <Route
            path="/riwayat"
            element={
              <ProtectedRoute peran="pegawai">
                <RiwayatSaya />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin-portal"
            element={
              <ProtectedRoute peran="superadmin">
                <PortalAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardUtama />} />
            <Route path="pegawai" element={<DataPegawai />} />
            <Route path="perangkat" element={<VerifikasiPerangkat />} />
            <Route path="shift" element={<MasterShift />} />
            <Route path="koreksi" element={<KoreksiPresensi />} />
            <Route path="izin" element={<PengajuanIzin />} />
            <Route path="rekap" element={<Rekapitulasi />} />
          </Route>

          <Route path="/beranda" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
