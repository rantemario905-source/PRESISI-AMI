/**
 * Navigasi bawah khusus pegawai (tampil di HP).
 * Memberi pola aplikasi mobile profesional: tab utama selalu terjangkau ibu jari.
 */
import { NavLink } from 'react-router-dom'

export const MENU_PEGAWAI = [
  { ke: '/', label: 'Absensi', akhir: true, ikon: 'absensi' },
  { ke: '/izin-saya', label: 'Dinas & Cuti', ikon: 'izin' },
  { ke: '/riwayat', label: 'Riwayat', ikon: 'riwayat' },
]

export const MENU_PORTAL_KEPALA = [
  { ke: '/kepala-ruangan/jadwal-shift', label: 'Jadwal', ikon: 'jadwal' },
  { ke: '/kepala-ruangan/dinas-sakit', label: 'Dinas', ikon: 'izin' },
  { ke: '/kepala-ruangan/cuti', label: 'Cuti', ikon: 'cuti' },
  { ke: '/kepala-ruangan/laporan', label: 'Laporan', ikon: 'laporan' },
  { ke: '/', label: 'Absensi', akhir: true, ikon: 'absensi' },
]

function Ikon({ nama }) {
  if (nama === 'izin') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[21px] w-[21px]"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18M8 14h3" />
      </svg>
    )
  }

  if (nama === 'riwayat') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[21px] w-[21px]"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (nama === 'jadwal') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[21px] w-[21px]"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
      </svg>
    )
  }

  if (nama === 'cuti') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[21px] w-[21px]"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18M8 15l2 2 4-4" />
      </svg>
    )
  }

  if (nama === 'laporan') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[21px] w-[21px]"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
      </svg>
    )
  }

  if (nama === 'unit') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[21px] w-[21px]"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[21px] w-[21px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  )
}

export default function NavigasiBawah({
  tampilkanUnit = false,
  menu,
  label = 'Navigasi utama',
}) {
  const daftar = menu ?? (tampilkanUnit
    ? [...MENU_PEGAWAI, { ke: '/kepala-ruangan', label: 'Unit', ikon: 'unit' }]
    : MENU_PEGAWAI)
  const kolom =
    daftar.length >= 5 ? 'grid-cols-5' : daftar.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <nav
      aria-label={label}
      className="navigasi-bawah fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-6px_24px_rgba(15,23,42,0.07)] backdrop-blur sm:hidden"
    >
      <div
        className={`mx-auto grid max-w-md ${kolom} gap-1 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5`}
      >
        {daftar.map((item) => (
          <NavLink
            key={item.ke}
            to={item.ke}
            end={item.akhir}
            className={({ isActive }) =>
              `flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-bold leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isActive ? 'text-sky-700' : 'text-slate-500 active:bg-slate-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'bg-sky-100' : ''
                  }`}
                >
                  <Ikon nama={item.ikon} />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
