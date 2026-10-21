/**
 * Bar atas (header) aplikasi: logo, navigasi pegawai, dan tombol keluar.
 */
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LogoRSUD from './LogoRSUD.jsx'
import Button from './ui/Button.jsx'
import { NAMA_APLIKASI } from '../config/constants.js'

const MENU_PEGAWAI = [
  { ke: '/', label: 'Absensi', akhir: true },
  { ke: '/izin-saya', label: 'Izin & Cuti' },
  { ke: '/riwayat', label: 'Riwayat' },
]

export default function BarAtas({ onKeluar }) {
  const { profil, apakahSuperadmin } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pt-3 pb-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <LogoRSUD className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-800">
              {NAMA_APLIKASI}
            </p>
            <p className="truncate text-xs text-slate-500">RSUD Aji Muhammad Idris</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {apakahSuperadmin && (
            <Link
              to="/superadmin-portal"
              className="hidden rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 sm:inline-block"
            >
              Portal Admin
            </Link>
          )}
          <div className="hidden text-right sm:block">
            <p className="truncate text-sm font-semibold text-slate-700">{profil?.nama}</p>
            <p className="truncate text-xs text-slate-400 capitalize">{profil?.role}</p>
          </div>
          <Button variant="sekunder" size="sm" onClick={onKeluar}>
            Keluar
          </Button>
        </div>
      </div>

      {!apakahSuperadmin && (
        <nav
          className="mx-auto flex w-full max-w-5xl items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
          aria-label="Navigasi pegawai"
        >
          {MENU_PEGAWAI.map((item) => (
            <NavLink
              key={item.ke}
              to={item.ke}
              end={item.akhir}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
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
  )
}
