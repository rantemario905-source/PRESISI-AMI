/** Tampilan periode ringkas dengan ikon kalender dan jumlah hari. */
import { formatTanggalRingkas } from '../../utils/format.js'
import { jumlahHari } from '../../utils/kalender.js'

export default function TampilanPeriode({ mulai, selesai, className = '' }) {
  const total = jumlahHari(mulai, selesai)
  const satuHari = mulai && selesai && mulai === selesai

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700"
        aria-hidden="true"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold leading-tight text-slate-700">
          {formatTanggalRingkas(mulai)}
          {!satuHari && mulai && selesai && (
            <>
              {' '}
              <span className="text-slate-400">s.d.</span>{' '}
              {formatTanggalRingkas(selesai)}
            </>
          )}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {total > 0 ? `${total} hari` : 'Periode belum lengkap'}
        </span>
      </span>
    </span>
  )
}
