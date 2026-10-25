/**
 * ==========================================================================
 * Router Utama PRESISI AMI
 * --------------------------------------------------------------------------
 *   /login                       → seluruh staf
 *   /                            → halaman absensi pegawai  (role: pegawai)
 *   /izin-saya                   → riwayat Dinas & Sakit / Cuti pegawai
 *   /riwayat                     → riwayat & rekap bulanan pegawai
 *   /kepala-ruangan              → portal kepala ruangan (flag kepala_ruangan)
 *     ├─ /jadwal-shift           → jadwal shift unit sendiri
 *     ├─ /dinas-sakit            → catat Dinas & Sakit unit
 *     └─ /cuti                   → catat Cuti unit
 *   /superadmin-portal           → portal Super Admin       (role: superadmin)
 *     ├─ /                       → Dashboard Utama
 *     ├─ /pegawai                → Data Pegawai
 *     ├─ /perangkat              → Verifikasi & Reset Perangkat
 *     ├─ /grup-shift             → Master grup/unit dan seksi
 *     ├─ /shift                  → Master Shift
 *     ├─ /jadwal-shift           → Grid jadwal shift per grup
 *     ├─ /hari-libur             → Hari libur manual
 *     ├─ /pengaturan             → Alfa otomatis
 *     ├─ /koreksi                → Koreksi Presensi & Audit Trail
 *     ├─ /dinas-sakit            → Pengajuan Dinas & Sakit
 *     ├─ /cuti                   → Pengajuan Cuti
 *     └─ /rekap                  → Rekapitulasi & Cetak Laporan
 *
 * Halaman dimuat dengan React.lazy (code-splitting) agar bundle awal kecil.
 * ==========================================================================
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PortalAdminLayout from './components/layout/PortalAdminLayout.jsx'
import PortalKepalaLayout from './components/layout/PortalKepalaLayout.jsx'
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
const JadwalShift = lazy(() => import('./pages/admin/JadwalShift.jsx'))
const GrupShift = lazy(() => import('./pages/admin/GrupShift.jsx'))
const HariLibur = lazy(() => import('./pages/admin/HariLibur.jsx'))
const PengaturanPresensi = lazy(() => import('./pages/admin/PengaturanPresensi.jsx'))
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
            path="/kepala-ruangan"
            element={
              <ProtectedRoute peran="pegawai" kepalaRuangan>
                <PortalKepalaLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="jadwal-shift" replace />} />
            <Route
              path="jadwal-shift"
              element={<JadwalShift mode="kepala" />}
            />
            <Route
              path="dinas-sakit"
              element={<PengajuanIzin mode="kepala" kategori="dinas-sakit" />}
            />
            <Route path="cuti" element={<PengajuanIzin mode="kepala" kategori="cuti" />} />
          </Route>

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
            <Route path="grup-shift" element={<GrupShift />} />
            <Route path="shift" element={<MasterShift />} />
            <Route path="jadwal-shift" element={<JadwalShift />} />
            <Route path="hari-libur" element={<HariLibur />} />
            <Route path="pengaturan" element={<PengaturanPresensi />} />
            <Route path="koreksi" element={<KoreksiPresensi />} />
            <Route
              path="dinas-sakit"
              element={<PengajuanIzin mode="superadmin" kategori="dinas-sakit" />}
            />
            <Route path="cuti" element={<PengajuanIzin mode="superadmin" kategori="cuti" />} />
            <Route path="izin" element={<Navigate to="/superadmin-portal/dinas-sakit" replace />} />
            <Route path="rekap" element={<Rekapitulasi />} />
          </Route>

          <Route path="/beranda" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
