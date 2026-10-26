/**
 * Bar atas (header) aplikasi: logo, navigasi pegawai, dan menu akun.
 * Di HP navigasi utama pindah ke bottom bar agar mudah dijangkau ibu jari.
 */
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LogoRSUD from './LogoRSUD.jsx'
import MenuAkun from './layout/MenuAkun.jsx'
import NavigasiBawah from './NavigasiBawah.jsx'
import { NAMA_APLIKASI } from '../config/constants.js'

const MENU_PEGAWAI = [
  { ke: '/', label: 'Absensi', akhir: true },
  { ke: '/izin-saya', label: 'Dinas & Cuti' },
  { ke: '/riwayat', label: 'Riwayat' },
]

export default function BarAtas({ onKeluar }) {
  const { profil, apakahSuperadmin, apakahKepalaRuangan } = useAuth()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-sky-700 focus:shadow-lg"
        >
          Lewati ke konten
        </a>

        <div className="atas-aman mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 pb-2.5 sm:px-6">
          <Link
            to={apakahSuperadmin ? '/superadmin-portal' : '/'}
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <LogoRSUD className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold tracking-tight text-slate-800 sm:text-sm">
                {NAMA_APLIKASI}
              </p>
              <p className="truncate text-[10px] text-slate-500 sm:text-xs">
                RSUD Aji Muhammad Idris
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {apakahSuperadmin && (
              <Link
                to="/superadmin-portal"
                className="hidden rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 sm:inline-block"
              >
                Portal Admin
              </Link>
            )}
            {apakahKepalaRuangan && (
              <Link
                to="/kepala-ruangan"
                className="hidden rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 sm:inline-block"
              >
                Kelola Unit
              </Link>
            )}
            <MenuAkun
              nama={profil?.nama}
              peran={
                apakahKepalaRuangan
                  ? 'Kepala Ruangan'
                  : profil?.role === 'superadmin'
                    ? 'Super Admin'
                    : 'Pegawai'
              }
              onKeluar={onKeluar}
            />
          </div>
        </div>

        {!apakahSuperadmin && (
          <nav
            className="mx-auto hidden w-full max-w-5xl items-center gap-1 px-4 pb-2 sm:flex sm:px-6"
            aria-label="Navigasi pegawai"
          >
            {MENU_PEGAWAI.map((item) => (
              <NavLink
                key={item.ke}
                to={item.ke}
                end={item.akhir}
                className={({ isActive }) =>
                  `flex min-h-[38px] items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {!apakahSuperadmin && (
        <NavigasiBawah tampilkanUnit={apakahKepalaRuangan} />
      )}
    </>
  )
}
