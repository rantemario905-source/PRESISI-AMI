/**
 * Sidebar portal kepala ruangan.
 * Memuat jadwal shift unit, Dinas & Sakit, dan Cuti.
 */
import { NavLink } from 'react-router-dom'
import { NAMA_APLIKASI, NAMA_RUMAH_SAKIT } from '../../config/constants.js'
import LogoRSUD from '../LogoRSUD.jsx'

const MENU = [
  {
    label: 'Jadwal Shift',
    ke: '/kepala-ruangan/jadwal-shift',
    ikon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
      </>
    ),
  },
  {
    label: 'Dinas & Sakit',
    ke: '/kepala-ruangan/dinas-sakit',
    ikon: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M9 15l2 2 4-4" />
      </>
    ),
  },
  {
    label: 'Cuti',
    ke: '/kepala-ruangan/cuti',
    ikon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18M8 14h3" />
      </>
    ),
  },
  {
    label: 'Laporan Bulanan',
    ke: '/kepala-ruangan/laporan',
    ikon: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
      </>
    ),
  },
]

export default function SidebarKepala({ terbuka, onTutup, tampilkanAbsensi = true }) {
  return (
    <>
      {terbuka && (
        <button
          type="button"
          className="fixed inset-0 z-40 h-full w-full cursor-default bg-slate-900/40 lg:hidden"
          onClick={onTutup}
          aria-label="Tutup menu"
        />
      )}

      <aside
        id="sidebar-kepala"
        className={`tanpa-cetak safe-atas fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          terbuka ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu Kepala Ruangan"
      >
        <div className="flex min-h-16 items-center gap-3 border-b border-slate-200 px-4 sm:px-5">
          <LogoRSUD className="h-10 w-10 shrink-0 drop-shadow-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900">
              {NAMA_APLIKASI}
            </p>
            <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">{NAMA_RUMAH_SAKIT}</p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 lg:hidden"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Administrasi Unit
          </p>
          {MENU.map((item) => (
            <NavLink
              key={item.ke}
              to={item.ke}
              onClick={onTutup}
              className={({ isActive }) =>
                `flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-sm ${
                  isActive
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px] shrink-0"
                aria-hidden="true"
              >
                {item.ikon}
              </svg>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}

          {tampilkanAbsensi && (
            <div className="pt-2">
              <NavLink
                to="/"
                end
                onClick={onTutup}
                className="flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[18px] w-[18px] shrink-0"
                  aria-hidden="true"
                >
                  <path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
                </svg>
                <span className="truncate">Kembali ke Absensi</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="border-t border-slate-200 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <p className="text-[11px] font-semibold text-slate-500">PRESISI AMI</p>
          <p className="text-[11px] text-slate-400">Portal Kepala Ruangan · v2.0</p>
        </div>
      </aside>
    </>
  )
}
