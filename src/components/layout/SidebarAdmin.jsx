/**
 * ==========================================================================
 * Sidebar Portal Super Admin
 * --------------------------------------------------------------------------
 * Menu putih dengan aksen sky-600 (gaya PRAKTIS-NG). Di layar kecil
 * sidebar tampil sebagai drawer yang bisa ditutup.
 * ==========================================================================
 */
import { NavLink } from 'react-router-dom'
import { NAMA_APLIKASI, NAMA_RUMAH_SAKIT } from '../../config/constants.js'

const IKON = {
  dashboard: (
    <path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
  ),
  pegawai: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  perangkat: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  shift: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18M8 15h3" />
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
  rekap: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14v4M12 9v9M17 5v13" />
    </>
  ),
}

const MENU = [
  { label: 'Dashboard Utama', ke: '/superadmin-portal', akhir: true, ikon: 'dashboard' },
  { label: 'Data Pegawai', ke: '/superadmin-portal/pegawai', ikon: 'pegawai' },
  { label: 'Verifikasi Perangkat', ke: '/superadmin-portal/perangkat', ikon: 'perangkat' },
  { label: 'Master & Jadwal Shift', ke: '/superadmin-portal/shift', ikon: 'shift' },
  { label: 'Koreksi Presensi', ke: '/superadmin-portal/koreksi', ikon: 'koreksi' },
  { label: 'Izin / Cuti / Dinas', ke: '/superadmin-portal/izin', ikon: 'izin' },
  { label: 'Rekapitulasi Laporan', ke: '/superadmin-portal/rekap', ikon: 'rekap' },
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

export default function SidebarAdmin({ terbuka, onTutup }) {
  return (
    <>
      {/* Latar gelap saat drawer terbuka di layar kecil */}
      {terbuka && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onTutup}
          aria-hidden="true"
        />
      )}

      <aside
        className={`tanpa-cetak fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          terbuka ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu Super Admin"
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-sm font-extrabold text-white shadow-sm">
            PA
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900">{NAMA_APLIKASI}</p>
            <p className="truncate text-[11px] text-slate-500">{NAMA_RUMAH_SAKIT}</p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Manajemen Presensi
          </p>
          {MENU.map((item) => (
            <NavLink
              key={item.ke}
              to={item.ke}
              end={item.akhir}
              onClick={onTutup}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Ikon nama={item.ikon} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-[11px] font-semibold text-slate-500">PRESISI AMI</p>
          <p className="text-[11px] text-slate-400">Portal Super Admin · v2.0</p>
        </div>
      </aside>
    </>
  )
}
