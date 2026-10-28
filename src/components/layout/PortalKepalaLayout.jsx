/**
 * Layout portal kepala unit.
 * Kepala non-ASN tetap memakai akun pegawai; kepala ASN memakai akun tanpa
 * baris pegawai. Bila mengelola beberapa unit, unit aktif dipilih di header
 * dan dibagikan ke halaman lewat Outlet context.
 */
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAMA_APLIKASI, NAMA_RUMAH_SAKIT } from '../../config/constants.js'
import { Spinner } from '../ui/index.js'
import MenuAkun from './MenuAkun.jsx'
import SidebarKepala from './SidebarKepala.jsx'
import NavigasiBawah, { MENU_PORTAL_KEPALA } from '../NavigasiBawah.jsx'

const JUDUL_HALAMAN = {
  '/kepala-ruangan/jadwal-shift': 'Jadwal Shift Unit',
  '/kepala-ruangan/dinas-sakit': 'Dinas & Sakit Unit',
  '/kepala-ruangan/cuti': 'Cuti Unit',
  '/kepala-ruangan/laporan': 'Laporan Bulanan',
}

const KUNCI_UNIT_AKTIF = 'presisi-unit-kepala'

export default function PortalKepalaLayout() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const { profil, keluar } = useAuth()
  const { pathname } = useLocation()
  const judul = JUDUL_HALAMAN[pathname] ?? 'Portal Kepala Ruangan'
  const kepalaAsn = profil?.sumber_akun === 'kepala_asn'
  const menuBawah = useMemo(
    () =>
      kepalaAsn
        ? MENU_PORTAL_KEPALA.filter((item) => item.ke !== '/')
        : MENU_PORTAL_KEPALA,
    [kepalaAsn],
  )

  const daftarUnit = useMemo(() => {
    const dariProfil = Array.isArray(profil?.unit_dikelola) ? profil.unit_dikelola : []
    return [...new Set([...dariProfil, profil?.unit_kerja].filter(Boolean))]
  }, [profil])

  const [unitAktif, setUnitAktif] = useState('')

  useEffect(() => {
    if (daftarUnit.length === 0) {
      setUnitAktif('')
      return
    }
    const tersimpan =
      typeof window === 'undefined' ? '' : window.localStorage.getItem(KUNCI_UNIT_AKTIF) ?? ''
    setUnitAktif((lama) => {
      if (lama && daftarUnit.includes(lama)) return lama
      if (tersimpan && daftarUnit.includes(tersimpan)) return tersimpan
      return daftarUnit[0]
    })
  }, [daftarUnit])

  const pilihUnit = (unit) => {
    setUnitAktif(unit)
    try {
      window.localStorage.setItem(KUNCI_UNIT_AKTIF, unit)
    } catch {
      // localStorage dapat diblokir; unit aktif tetap berlaku di sesi ini.
    }
  }

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
      <SidebarKepala
        terbuka={menuTerbuka}
        onTutup={() => setMenuTerbuka(false)}
        tampilkanAbsensi={!kepalaAsn}
      />

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
              {daftarUnit.length > 1 ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <label className="sr-only" htmlFor="unit-aktif-kepala">
                    Unit yang dikelola
                  </label>
                  <select
                    id="unit-aktif-kepala"
                    value={unitAktif}
                    onChange={(event) => pilihUnit(event.target.value)}
                    className="max-w-full truncate rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-[11px]"
                    title="Pilih unit yang dikelola"
                  >
                    {daftarUnit.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <span className="shrink-0 text-[10px] text-slate-400 sm:text-[11px]">
                    ({daftarUnit.length} unit)
                  </span>
                </div>
              ) : (
                <p className="truncate text-[10px] leading-tight text-slate-400 sm:text-[11px]">
                  {unitAktif || profil?.unit_kerja || 'Belum ada unit'}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center">
              <MenuAkun nama={profil?.nama} peran="Kepala Ruangan" onKeluar={keluar} />
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
            <Outlet
              context={{
                unitAktif,
                unitDikelola: daftarUnit,
                pilihUnit,
              }}
            />
          </Suspense>
        </main>

        <footer className="tanpa-cetak mx-auto w-full max-w-7xl px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] text-center text-[10px] text-slate-400 sm:px-6 sm:pb-6 sm:text-[11px]">
          {NAMA_APLIKASI} — {NAMA_RUMAH_SAKIT}
        </footer>
      </div>

      <NavigasiBawah menu={menuBawah} label="Navigasi portal kepala ruangan" />
    </div>
  )
}
