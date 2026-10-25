/**
 * Layout portal kepala ruangan.
 * Kepala ruangan tetap memakai akun pegawai yang sama; menu ini menjadi
 * tambahan untuk mengatur jadwal shift unit serta mencatat Dinas & Sakit/Cuti.
 */
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAMA_APLIKASI, NAMA_RUMAH_SAKIT } from '../../config/constants.js'
import { inisialNama } from '../../utils/format.js'
import { Spinner } from '../ui/index.js'
import SidebarKepala from './SidebarKepala.jsx'
import NavigasiBawah, { MENU_PORTAL_KEPALA } from '../NavigasiBawah.jsx'

const JUDUL_HALAMAN = {
  '/kepala-ruangan/jadwal-shift': 'Jadwal Shift Unit',
  '/kepala-ruangan/dinas-sakit': 'Dinas & Sakit Unit',
  '/kepala-ruangan/cuti': 'Cuti Unit',
}

export default function PortalKepalaLayout() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const { profil, keluar } = useAuth()
  const { pathname } = useLocation()
  const judul = JUDUL_HALAMAN[pathname] ?? 'Portal Kepala Ruangan'

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
      <SidebarKepala terbuka={menuTerbuka} onTutup={() => setMenuTerbuka(false)} />

      <div className="lg:pl-64">
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
              aria-controls="sidebar-kepala"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold leading-tight text-slate-800 sm:text-base">
                {judul}
              </h1>
              <p className="truncate text-[10px] leading-tight text-slate-400 sm:hidden">
                {profil?.unit_kerja}
              </p>
              <p className="hidden truncate text-[11px] text-slate-400 sm:block">
                {profil?.unit_kerja} · {NAMA_RUMAH_SAKIT}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden text-right md:block">
                <p className="max-w-[190px] truncate text-sm font-bold text-slate-800">
                  {profil?.nama}
                </p>
                <p className="text-[11px] font-semibold text-sky-600">Kepala Ruangan</p>
              </div>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-700 sm:flex">
                {inisialNama(profil?.nama ?? '')}
              </div>
              <button
                type="button"
                onClick={keluar}
                className="flex min-h-[44px] items-center rounded-lg border border-slate-300 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:min-h-[38px] sm:px-3 sm:text-xs"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        <main id="konten" className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6">
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

        <footer className="tanpa-cetak mx-auto w-full max-w-7xl px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] text-center text-[10px] text-slate-400 sm:px-6 sm:pb-6 sm:text-[11px]">
          {NAMA_APLIKASI} — {NAMA_RUMAH_SAKIT}
        </footer>
      </div>

      <NavigasiBawah
        menu={MENU_PORTAL_KEPALA}
        label="Navigasi portal kepala ruangan"
      />
    </div>
  )
}
