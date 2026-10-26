/**
 * Tab pilihan yang membungkus ke baris berikutnya bila ruang di HP tidak cukup.
 * Dipakai pada halaman Verifikasi Perangkat, Koreksi, dan Izin.
 */
export default function TabBar({ daftar, nilai, onChange, label = 'Pilih kategori', aksi }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-0.5 mb-4 flex flex-wrap gap-2 px-0.5 pb-1"
    >
      {daftar.map((item) => {
        const aktif = nilai === item.nilai
        return (
          <button
            key={item.nilai}
            type="button"
            role="tab"
            aria-selected={aktif}
            onClick={() => onChange(item.nilai)}
            className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              aktif
                ? 'bg-sky-600 text-white shadow-sm'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        )
      })}
      {aksi && <div className="flex items-center">{aksi}</div>}
    </div>
  )
}
