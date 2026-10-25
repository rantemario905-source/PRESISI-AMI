import { Link } from 'react-router-dom'

const MENU = [
  {
    ke: '/kepala-ruangan/jadwal-shift',
    label: 'Jadwal Shift',
    deskripsi: 'Atur jadwal pegawai shift',
    ikon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
      </>
    ),
  },
  {
    ke: '/kepala-ruangan/dinas-sakit',
    label: 'Dinas & Sakit',
    deskripsi: 'Catat dinas luar dan sakit',
    ikon: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M9 15l2 2 4-4" />
      </>
    ),
  },
  {
    ke: '/kepala-ruangan/cuti',
    label: 'Cuti',
    deskripsi: 'Catat cuti pegawai unit',
    ikon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18M8 15l2 2 4-4" />
      </>
    ),
  },
]

export default function MenuKepala({ unitKerja }) {
  return (
    <section
      aria-labelledby="judul-menu-kepala"
      className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 shadow-sm sm:p-4"
    >
      <div className="mb-2.5 min-w-0">
        <h2
          id="judul-menu-kepala"
          className="text-[13px] font-extrabold leading-snug text-slate-900 sm:text-sm"
        >
          Portal Kepala Ruangan
        </h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
          Jadwal shift, dinas &amp; sakit, dan cuti unit {unitKerja || 'Anda'}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MENU.map((item) => (
          <Link
            key={item.ke}
            to={item.ke}
            className="group flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-sky-100 bg-white px-2 py-2.5 text-center shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-sky-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                {item.ikon}
              </svg>
            </span>
            <span className="flex min-h-[2.6em] items-center text-[11px] font-bold leading-tight text-slate-800 sm:text-xs">
              {item.label}
            </span>
            <span className="hidden text-[10px] leading-snug text-slate-500 sm:block">
              {item.deskripsi}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
