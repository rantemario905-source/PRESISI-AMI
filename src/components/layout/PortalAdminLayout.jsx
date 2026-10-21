/**
 * ==========================================================================
 * Layout Portal Super Admin
 * --------------------------------------------------------------------------
 * Sidebar kiri + topbar + area konten. Seluruh menu Fase 2 dirender
 * sebagai child route lewat <Outlet />.
 * ==========================================================================
 */
import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAMA_APLIKASI, NAMA_RUMAH_SAKIT } from '../../config/constants.js'
import { inisialNama } from '../../utils/format.js'
import { Spinner } from '../ui/index.js'
import SidebarAdmin from './SidebarAdmin.jsx'

const JUDUL_HALAMAN = {
  '/superadmin-portal': 'Dashboard Utama',
  '/superadmin-portal/pegawai': 'Data Pegawai',
  '/superadmin-portal/perangkat': 'Verifikasi & Reset Perangkat',
  '/superadmin-portal/shift': 'Master & Jadwal Shift',
  '/superadmin-portal/koreksi': 'Koreksi Presensi & Audit Trail',
  '/superadmin-portal/izin': 'Pengajuan Izin / Cuti / Dinas Luar',
  '/superadmin-portal/rekap': 'Rekapitulasi & Cetak Laporan',
}

export default function PortalAdminLayout() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const { profil, keluar } = useAuth()
  const { pathname } = useLocation()
  const judul = JUDUL_HALAMAN[pathname] ?? 'Portal Super Admin'

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarAdmin terbuka={menuTerbuka} onTutup={() => setMenuTerbuka(false)} />

      <div className="lg:pl-64">
        <header className="tanpa-cetak sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuTerbuka(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              aria-label="Buka menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-800 sm:text-base">{judul}</h2>
              <p className="hidden truncate text-[11px] text-slate-400 sm:block">{NAMA_RUMAH_SAKIT}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-sm font-bold text-slate-800">{profil?.nama}</p>
                <p className="text-[11px] font-semibold text-sky-600">Super Admin</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-700">
                {inisialNama(profil?.nama ?? '')}
              </div>
              <button
                type="button"
                onClick={keluar}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
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

        <footer className="tanpa-cetak mx-auto w-full max-w-7xl px-4 pb-6 text-center text-[11px] text-slate-400 sm:px-6">
          {NAMA_APLIKASI} — Presensi Sistem Informasi Staf Integrasi
        </footer>
      </div>
    </div>
  )
}
