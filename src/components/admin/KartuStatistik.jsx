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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-kartu">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{nilai}</p>
          {keterangan && <p className="mt-1 text-xs text-slate-500">{keterangan}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${WARNA[warna] ?? WARNA.sky}`}>
          {ikon ?? '#'}
        </div>
      </div>
    </section>
  )
}
