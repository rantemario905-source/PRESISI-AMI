/**
 * Kartu statistik ringkas untuk dashboard admin.
 */
const WARNA = {
  sky: 'bg-sky-100 text-sky-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
}

export default function KartuStatistik({ label, nilai, keterangan, ikon, warna = 'sky' }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs sm:font-semibold">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums leading-none text-slate-900 sm:mt-2 sm:text-3xl">
            {nilai}
          </p>
          {keterangan && (
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">{keterangan}</p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base sm:h-11 sm:w-11 sm:text-lg ${WARNA[warna] ?? WARNA.sky}`}
          aria-hidden="true"
        >
          {ikon ?? '#'}
        </div>
      </div>
    </section>
  )
}
