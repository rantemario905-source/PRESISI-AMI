/** Periode ringkas satu baris: rentang tanggal + jumlah hari. */
import { formatRentangRingkas } from '../../utils/format.js'
import { jumlahHari } from '../../utils/kalender.js'

export default function TampilanPeriode({ mulai, selesai, className = '' }) {
  const total = jumlahHari(mulai, selesai)

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <svg
        className="h-3.5 w-3.5 shrink-0 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-xs font-semibold leading-tight text-slate-700">
          {formatRentangRingkas(mulai, selesai)}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {total > 0 ? `${total} hari` : 'Periode belum lengkap'}
        </span>
      </span>
    </span>
  )
}
