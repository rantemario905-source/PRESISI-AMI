/**
 * Tab pilihan yang membungkus ke baris berikutnya bila ruang di HP tidak cukup.
 * Warna dan ikon ditentukan otomatis dari `nilai` agar tab mudah dibedakan.
 * Dipakai pada halaman Verifikasi Perangkat, Koreksi, Izin, dan Pengaduan.
 */

const IKON = {
  data: (
    <path d="M9 3h6a1 1 0 0 1 1 1v14l-3-2-3 2V4a1 1 0 0 1 1-1z M6 8v11 M3 11v8" />
  ),
  audit: (
    <path d="M12 7v5l3 2 M3 12a9 9 0 1 0 9-9 M3 3v5h5" />
  ),
  pengaduan: (
    <path d="M21 12a8 8 0 0 1-8 8H4l2-4a8 8 0 1 1 15-4z M9 11h6 M9 14h4" />
  ),
  semua: <path d="M4 5h16v14H4z M4 10h16 M10 10v9" />,
  menunggu: <path d="M12 7v5l3 2 M3 12a9 9 0 1 0 9-9 M3 3v5h5" />,
  disetujui: <path d="M4 12.5l5 5L20 6.5" />,
  ditolak: <path d="M5 5l14 14 M19 5L5 19" />,
  dibatalkan: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M6 6l12 12" />,
  sakit: <path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.6 12 20 12 20z" />,
  cuti: <path d="M4 19V9l8-5 8 5v10 M9 19v-6h6v6" />,
  dinas: <path d="M3 13l18-8-7 16-2.5-6.5L3 13z" />,
  'dinas-sakit': (
    <path d="M8 20s-5-3.1-5-6.8A2.9 2.9 0 0 1 8 11a2.9 2.9 0 0 1 5 2.2C13 16.9 8 20 8 20z M16 5v6 M13 8h6" />
  ),
}

const WARNA = {
  data: ['bg-sky-600 text-white shadow-sm', 'border-sky-200 bg-sky-50 text-sky-700'],
  audit: ['bg-amber-500 text-white shadow-sm', 'border-amber-200 bg-amber-50 text-amber-700'],
  pengaduan: ['bg-violet-600 text-white shadow-sm', 'border-violet-200 bg-violet-50 text-violet-700'],
  semua: ['bg-slate-700 text-white shadow-sm', 'border-slate-200 bg-slate-50 text-slate-700'],
  menunggu: ['bg-amber-500 text-white shadow-sm', 'border-amber-200 bg-amber-50 text-amber-700'],
  disetujui: ['bg-emerald-600 text-white shadow-sm', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  ditolak: ['bg-rose-500 text-white shadow-sm', 'border-rose-200 bg-rose-50 text-rose-700'],
  dibatalkan: ['bg-slate-500 text-white shadow-sm', 'border-slate-200 bg-slate-50 text-slate-600'],
  sakit: ['bg-rose-500 text-white shadow-sm', 'border-rose-200 bg-rose-50 text-rose-700'],
  cuti: ['bg-teal-600 text-white shadow-sm', 'border-teal-200 bg-teal-50 text-teal-700'],
  dinas: ['bg-violet-600 text-white shadow-sm', 'border-violet-200 bg-violet-50 text-violet-700'],
  'dinas-sakit': ['bg-rose-500 text-white shadow-sm', 'border-rose-200 bg-rose-50 text-rose-700'],
}

const ALIAS = {
  pending: 'menunggu',
  approved: 'disetujui',
  rejected: 'ditolak',
}

const GAYA_AKTIF_DEFAULT = 'bg-sky-600 text-white shadow-sm'
const GAYA_DIAM_DEFAULT = 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'

export default function TabBar({ daftar, nilai, onChange, label = 'Pilih kategori', aksi }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-0.5 mb-4 flex flex-wrap items-center gap-2 px-0.5 pb-1"
    >
      {daftar.map((item) => {
        const aktif = nilai === item.nilai
        const kunci = ALIAS[item.nilai] ?? item.nilai
        const ikon = IKON[kunci] ?? item.ikon
        const warna = WARNA[kunci]
        const gaya = warna
          ? warna[aktif ? 0 : 1]
          : aktif
            ? GAYA_AKTIF_DEFAULT
            : GAYA_DIAM_DEFAULT
        return (
          <button
            key={item.nilai}
            type="button"
            role="tab"
            aria-selected={aktif}
            onClick={() => onChange(item.nilai)}
            className={`flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              warna ? `border ${gaya}` : gaya
            }`}
          >
            {ikon && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 shrink-0"
              >
                {ikon}
              </svg>
            )}
            {item.label}
          </button>
        )
      })}
      {aksi && <div className="flex items-center">{aksi}</div>}
    </div>
  )
}
