/**
 * ==========================================================================
 * Layout Portal Super Admin
 * --------------------------------------------------------------------------
 * Sidebar kiri + topbar + area konten. Seluruh menu Fase 2 dirender
 * sebagai child route lewat <Outlet />.
 * ==========================================================================
 */
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAMA_APLIKASI } from '../../config/constants.js'
import { Spinner } from '../ui/index.js'
import MenuAkun from './MenuAkun.jsx'
import SidebarAdmin from './SidebarAdmin.jsx'

const JUDUL_HALAMAN = {
  '/superadmin-portal': 'Dashboard',
  '/superadmin-portal/pegawai': 'Data Pegawai',
  '/superadmin-portal/perangkat': 'Verifikasi & Reset Perangkat',
  '/superadmin-portal/grup-shift': 'Grup Shift & Seksi',
  '/superadmin-portal/shift': 'Master Shift',
  '/superadmin-portal/jadwal-shift': 'Jadwal Shift',
  '/superadmin-portal/hari-libur': 'Hari Libur',
  '/superadmin-portal/pengaturan': 'Pengaturan Presensi',
  '/superadmin-portal/koreksi': 'Koreksi Presensi & Audit Trail',
  '/superadmin-portal/dinas-sakit': 'Pengajuan Dinas & Sakit',
  '/superadmin-portal/cuti': 'Pengajuan Cuti',
  '/superadmin-portal/rekap': 'Rekapitulasi & Cetak Laporan',
  '/superadmin-portal/laporan': 'Laporan Bulanan Pegawai',
}

export default function PortalAdminLayout() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const { profil, keluar } = useAuth()
  const { pathname } = useLocation()
  const judul = JUDUL_HALAMAN[pathname] ?? 'Portal Super Admin'

  // Kunci scroll & tutup drawer dengan Esc saat menu HP terbuka
  useEffect(() => {
    if (!menuTerbuka) return undefined
    const tanganiTombol = (event) => {
      if (event.key === 'Escape') setMenuTerbuka(false)
    }
    document.addEventListener('keydown', tanganiTombol)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tanganiTombol)
      document.body.style.overflow = ''
    }
  }, [menuTerbuka])

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SidebarAdmin terbuka={menuTerbuka} onTutup={() => setMenuTerbuka(false)} />

      <div className="bg-gradient-to-b from-sky-50/90 via-sky-50/60 to-slate-50 print:bg-none print:bg-white print:!pl-0 lg:pl-64">
        <header className="tanpa-cetak safe-atas sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <a
            href="#konten"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-sky-700 focus:shadow-lg"
          >
            Lewati ke konten
          </a>

          <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:min-h-16 sm:gap-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuTerbuka(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 lg:hidden"
              aria-label="Buka menu"
              aria-expanded={menuTerbuka}
              aria-controls="sidebar-admin"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[13px] font-bold text-slate-800 sm:text-base">{judul}</h1>
            </div>

            <div className="flex shrink-0 items-center">
              <MenuAkun nama={profil?.nama} peran="Super Admin" onKeluar={keluar} />
            </div>
          </div>
        </header>

        <main
          id="konten"
          className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6"
        >
          {/* Boundary lokal: sidebar tetap tampil saat chunk halaman diunduh */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Spinner /> Memuat halaman…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>

        <footer className="tanpa-cetak mx-auto w-full max-w-7xl px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-center text-[10px] text-slate-400 sm:px-6 sm:pb-6 sm:text-[11px]">
          {NAMA_APLIKASI} — Presensi Sistem Informasi Staf Integrasi
        </footer>
      </div>
    </div>
  )
}
