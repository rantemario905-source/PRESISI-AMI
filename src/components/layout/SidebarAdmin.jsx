/**
 * ==========================================================================
 * Sidebar Portal Super Admin
 * --------------------------------------------------------------------------
 * Menu dikelompokkan agar tidak menumpuk. Grup dapat dibuka/tutup; grup yang
 * sedang aktif otomatis terbuka. Di HP tampil sebagai drawer.
 * ==========================================================================
 */
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAMA_APLIKASI, NAMA_RUMAH_SAKIT } from '../../config/constants.js'
import LogoRSUD from '../LogoRSUD.jsx'

const IKON = {
  dashboard: <path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />,
  pegawai: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  kepala: (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      <path d="M17 11l2 2 4-4" />
    </>
  ),
  perangkat: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  grup: (
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  shift: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18M8 15h3" />
    </>
  ),
  jadwal: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
    </>
  ),
  libur: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18M9 15h6" />
    </>
  ),
  pengaturan: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1.1V21a2 2 0 11-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.6-1 1.7 1.7 0 00-1.1-.4H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.6 1.7 1.7 0 00.4-1.1V3a2 2 0 114 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.14.37.36.7.66.96.3.26.67.4 1.06.4H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51.64z" />
    </>
  ),
  koreksi: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </>
  ),
  izin: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M9 15l2 2 4-4" />
    </>
  ),
  cuti: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18M8 14h3" />
    </>
  ),
  laporan: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
    </>
  ),
  rekap: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14v4M12 9v9M17 5v13" />
    </>
  ),
}

const GRUP_MENU = [
  {
    id: 'struktur',
    label: 'Data & Struktur',
    items: [
      { label: 'Data Pegawai', ke: '/superadmin-portal/pegawai', ikon: 'pegawai' },
      { label: 'Kepala Unit', ke: '/superadmin-portal/kepala-unit', ikon: 'kepala' },
      { label: 'Grup Shift', ke: '/superadmin-portal/grup-shift', ikon: 'grup' },
      { label: 'Master Shift', ke: '/superadmin-portal/shift', ikon: 'shift' },
    ],
  },
  {
    id: 'penjadwalan',
    label: 'Penjadwalan & Presensi',
    items: [
      { label: 'Jadwal Shift', ke: '/superadmin-portal/jadwal-shift', ikon: 'jadwal' },
      { label: 'Hari Libur', ke: '/superadmin-portal/hari-libur', ikon: 'libur' },
      { label: 'Koreksi Presensi', ke: '/superadmin-portal/koreksi', ikon: 'koreksi' },
      { label: 'Pengaturan Presensi', ke: '/superadmin-portal/pengaturan', ikon: 'pengaturan' },
    ],
  },
  {
    id: 'layanan',
    label: 'Layanan & Laporan',
    items: [
      { label: 'Dinas & Sakit', ke: '/superadmin-portal/dinas-sakit', ikon: 'izin' },
      { label: 'Cuti', ke: '/superadmin-portal/cuti', ikon: 'cuti' },
      { label: 'Laporan Bulanan', ke: '/superadmin-portal/laporan', ikon: 'laporan' },
      { label: 'Rekapitulasi Laporan', ke: '/superadmin-portal/rekap', ikon: 'rekap' },
    ],
  },
  {
    id: 'keamanan',
    label: 'Keamanan',
    items: [
      { label: 'Verifikasi Perangkat', ke: '/superadmin-portal/perangkat', ikon: 'perangkat' },
    ],
  },
]

function Ikon({ nama }) {
  return (
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
      {IKON[nama]}
    </svg>
  )
}

function grupAktif(pathname) {
  return GRUP_MENU.find((grup) =>
    grup.items.some(
      (item) => pathname === item.ke || pathname.startsWith(`${item.ke}/`),
    ),
  )?.id
}

export default function SidebarAdmin({ terbuka, onTutup }) {
  const { pathname } = useLocation()
  const [grupTerbuka, setGrupTerbuka] = useState(() => {
    const aktif = grupAktif(pathname)
    return aktif ? { [aktif]: true } : {}
  })

  useEffect(() => {
    const aktif = grupAktif(pathname)
    if (!aktif) return
    setGrupTerbuka({ [aktif]: true })
  }, [pathname])

  function toggleGrup(id) {
    setGrupTerbuka((lama) => ({ ...lama, [id]: !lama[id] }))
  }

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
        id="sidebar-admin"
        className={`tanpa-cetak safe-atas fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          terbuka ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu Super Admin"
      >
        <div className="flex min-h-16 items-center gap-3 border-b border-slate-200 px-4 sm:px-5">
          <LogoRSUD className="h-10 w-10 shrink-0 drop-shadow-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900">
              {NAMA_APLIKASI}
            </p>
            <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
              {NAMA_RUMAH_SAKIT}
            </p>
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

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <NavLink
            to="/superadmin-portal"
            end
            onClick={onTutup}
            className={({ isActive }) =>
              `flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-sm ${
                isActive
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Ikon nama="dashboard" />
            <span className="truncate">Dashboard</span>
          </NavLink>

          <div className="my-2 border-t border-slate-100" />

          {GRUP_MENU.map((grup) => {
            const dibuka = Boolean(grupTerbuka[grup.id])
            return (
              <div key={grup.id} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => toggleGrup(grup.id)}
                  aria-expanded={dibuka}
                  aria-controls={`menu-${grup.id}`}
                  className="flex min-h-[34px] w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <span>{grup.label}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      dibuka ? 'rotate-90' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                <div
                  id={`menu-${grup.id}`}
                  aria-hidden={!dibuka}
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                    dibuka ? 'pointer-events-auto grid-rows-[1fr]' : 'pointer-events-none grid-rows-[0fr]'
                  }`}
                >
                  <div
                    className={`min-h-0 space-y-0.5 overflow-hidden pb-1 transition-[opacity,transform] duration-200 ease-out ${
                      dibuka ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                    }`}
                  >
                    {grup.items.map((item) => (
                      <NavLink
                        key={item.ke}
                        to={item.ke}
                        onClick={onTutup}
                        tabIndex={dibuka ? undefined : -1}
                        className={({ isActive }) =>
                          `flex min-h-[38px] items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-sm ${
                            isActive
                              ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        <Ikon nama={item.ikon} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <p className="text-[11px] font-semibold text-slate-500">PRESISI AMI</p>
          <p className="text-[11px] text-slate-400">Portal Super Admin · v2.0</p>
        </div>
      </aside>
    </>
  )
}
